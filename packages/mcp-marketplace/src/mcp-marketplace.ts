import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type {
  MCPServerConfig,
  MCPServerListing,
  MCPServerReview,
  MCPInstallRecord,
  MCPPublishReviewResult,
  MCPQualityCheckResult,
  MCPMetrics,
  MCPListingStatus,
} from '@synapse/shared';
import { MCPMarketplaceRegistry } from './marketplace-registry.js';
import { MCPRatingStore } from './rating-store.js';
import { rank, rankWithScores } from './ranking-engine.js';
import { publishReview, qualityCheck } from './review-engine.js';

/** Adapter 接口 — 通过回调访问 MCPHub，避免循环依赖 */
export interface MCPHubAdapter {
  getServerMetrics(serverId: string): MCPMetrics | undefined;
  getServerStatus(serverId: string): string | undefined;
  addServer(config: MCPServerConfig): Promise<void>;
  removeServer(serverId: string): Promise<void>;
  getServerConfig(serverId: string): MCPServerConfig | undefined;
  getAllConfigs(): MCPServerConfig[];
}

export interface MCPMarketplaceConfig {
  registryDir: string;
  reviewsDir: string;
  installedRecordPath?: string;
}

export class MCPMarketplace {
  private registry: MCPMarketplaceRegistry;
  private ratingStore: MCPRatingStore;
  private installed: Map<string, MCPInstallRecord> = new Map();
  private installedRecordPath?: string;
  private adapter: MCPHubAdapter;

  constructor(config: MCPMarketplaceConfig, adapter: MCPHubAdapter) {
    this.registry = new MCPMarketplaceRegistry(config.registryDir);
    this.ratingStore = new MCPRatingStore(config.reviewsDir);
    this.adapter = adapter;
    if (config.installedRecordPath) {
      this.installedRecordPath = config.installedRecordPath;
      this.loadInstalled();
    }
  }

  private loadInstalled(): void {
    if (this.installedRecordPath && existsSync(this.installedRecordPath)) {
      try {
        const records: MCPInstallRecord[] = JSON.parse(
          readFileSync(this.installedRecordPath, 'utf-8'),
        );
        for (const r of records) {
          this.installed.set(r.serverId, r);
        }
      } catch {
        this.installed = new Map();
      }
    }
  }

  private saveInstalled(): void {
    if (!this.installedRecordPath) return;
    const dir = dirname(this.installedRecordPath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(
      this.installedRecordPath,
      JSON.stringify(Array.from(this.installed.values()), null, 2),
    );
  }

  // === Publish ===

  publish(
    config: MCPServerConfig,
    author: { id: string; name: string },
    tags?: string[],
  ): { listing: MCPServerListing; reviewResult: MCPPublishReviewResult } {
    // Check for duplicate
    const existing = this.registry.get(config.id);
    if (existing) {
      throw new Error(`Server "${config.id}" is already published.`);
    }

    // Get tool names from hub (if connected) — fall back to empty list
    const status = this.adapter.getServerStatus(config.id);
    const toolNames: string[] = [];
    // toolNames will be populated when syncMetrics is called later

    // Auto review
    const reviewResult = publishReview(config, toolNames);

    if (reviewResult.score < 30) {
      const failedChecks = reviewResult.checks
        .filter((c) => !c.pass)
        .map((c) => `${c.name}: ${c.reason}`)
        .join('; ');
      throw new Error(
        `Server rejected (score: ${reviewResult.score}/100): ${failedChecks}`,
      );
    }

    const listingStatus: MCPListingStatus =
      reviewResult.score >= 70 ? 'active' : 'pending_review';

    const now = new Date().toISOString();
    const listing: MCPServerListing = {
      id: config.id,
      name: config.name,
      description: config.description,
      category: config.category,
      tags: tags ?? config.tags ?? [],
      author,
      version: '1.0.0',
      transport: config.transport,
      toolCount: toolNames.length,
      toolNames,
      serverConfig: config,
      // Runtime metrics (default)
      uptimeRate: status === 'connected' ? 1.0 : 0.0,
      avgLatencyMs: 0,
      errorRate: 0,
      totalCalls: 0,
      // Market data
      installs: 0,
      rating: { average: 0, count: 0 },
      status: listingStatus,
      publishedAt: now,
      updatedAt: now,
    };

    this.registry.publish(listing);
    return { listing, reviewResult };
  }

  unpublish(serverId: string): boolean {
    return this.registry.unpublish(serverId);
  }

  updateMetadata(
    serverId: string,
    updates: { tags?: string[]; status?: MCPListingStatus; description?: string },
  ): MCPServerListing | undefined {
    const listing = this.registry.get(serverId);
    if (!listing) return undefined;

    if (updates.tags !== undefined) listing.tags = updates.tags;
    if (updates.status !== undefined) listing.status = updates.status;
    if (updates.description !== undefined) listing.description = updates.description;
    listing.updatedAt = new Date().toISOString();

    this.registry.publish(listing);
    return listing;
  }

  // === Review (Human) ===

  reviewServer(
    serverId: string,
    decision: { action: 'approve' | 'reject'; reviewer: string; reason?: string },
  ): MCPServerListing {
    const listing = this.registry.get(serverId);
    if (!listing) throw new Error(`Server "${serverId}" not found in marketplace`);
    if (listing.status !== 'pending_review') {
      throw new Error(
        `Server "${serverId}" is "${listing.status}", only pending_review can be reviewed`,
      );
    }

    const newStatus: MCPListingStatus = decision.action === 'approve' ? 'active' : 'rejected';
    this.registry.setStatus(serverId, newStatus);
    return { ...listing, status: newStatus, updatedAt: new Date().toISOString() };
  }

  listPendingReview(): MCPServerListing[] {
    return this.registry.search({ status: 'pending_review' });
  }

  // === Install ===

  async install(serverId: string): Promise<MCPInstallRecord> {
    const listing = this.registry.get(serverId);
    if (!listing) throw new Error(`Server "${serverId}" not found in marketplace`);
    if (listing.status !== 'active') {
      throw new Error(`Server "${serverId}" is ${listing.status} and cannot be installed`);
    }

    // Add server to MCPHub
    await this.adapter.addServer(listing.serverConfig);

    const record: MCPInstallRecord = {
      serverId,
      version: listing.version,
      installedAt: new Date().toISOString(),
    };

    this.installed.set(serverId, record);
    this.saveInstalled();

    // Update install count
    this.registry.updateStats(serverId, { installs: listing.installs + 1 });

    return record;
  }

  async uninstall(serverId: string): Promise<boolean> {
    if (!this.installed.has(serverId)) return false;

    try {
      await this.adapter.removeServer(serverId);
    } catch {
      // Server may not be registered in hub (e.g., already removed)
    }

    this.installed.delete(serverId);
    this.saveInstalled();
    return true;
  }

  listInstalled(): MCPInstallRecord[] {
    return Array.from(this.installed.values());
  }

  // === Reviews ===

  addReview(review: {
    serverId: string;
    userId: string;
    userName: string;
    rating: number;
    comment: string;
  }): { review: MCPServerReview; qualityCheck: MCPQualityCheckResult } {
    if (review.rating < 1 || review.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const listing = this.registry.get(review.serverId);
    if (!listing) throw new Error(`Server "${review.serverId}" not found in marketplace`);

    const newReview = this.ratingStore.addReview(review);

    const { average, count } = this.ratingStore.getAverageRating(review.serverId);
    this.registry.updateRating(review.serverId, average, count);

    const updatedListing = this.registry.get(review.serverId)!;
    const qc = qualityCheck(updatedListing);

    if (qc.action === 'suspend' && updatedListing.status === 'active') {
      this.registry.setStatus(review.serverId, 'suspended');
    }
    if (qc.action === 'deprecated' && updatedListing.status === 'active') {
      this.registry.setStatus(review.serverId, 'deprecated');
    }

    return { review: newReview, qualityCheck: qc };
  }

  getReviews(serverId: string): MCPServerReview[] {
    return this.ratingStore.getReviews(serverId);
  }

  // === Search & Browse ===

  getListing(serverId: string): MCPServerListing | undefined {
    return this.registry.get(serverId);
  }

  search(query: { q?: string; category?: string; tag?: string }): MCPServerListing[] {
    return this.registry.search(query);
  }

  browse(options: {
    category?: string;
    sort?: 'ranking' | 'recent' | 'installs';
  }): MCPServerListing[] {
    let listings = this.registry.search({ category: options.category });

    switch (options.sort) {
      case 'recent':
        listings.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
        break;
      case 'installs':
        listings.sort((a, b) => b.installs - a.installs);
        break;
      case 'ranking':
      default:
        listings = rank(listings);
        break;
    }

    return listings;
  }

  top(limit = 10): (MCPServerListing & { score: number })[] {
    const all = this.registry.search({});
    const ranked = rankWithScores(all);
    return ranked.slice(0, limit).map((s) => ({ ...s.listing, score: s.score }));
  }

  // === Metrics Sync ===

  syncMetrics(serverId: string): void {
    const listing = this.registry.get(serverId);
    if (!listing) return;

    const metrics = this.adapter.getServerMetrics(serverId);
    if (!metrics) return;

    const totalCalls = metrics.totalCalls;
    const successCalls = metrics.successCalls;
    const errorRate = totalCalls > 0 ? (totalCalls - successCalls) / totalCalls : 0;
    // Approximate uptimeRate: if server is connected, 1.0; else from ratio
    const hubStatus = this.adapter.getServerStatus(serverId);
    const uptimeRate = hubStatus === 'connected' ? 1.0 : listing.uptimeRate;

    this.registry.updateMetrics(serverId, {
      uptimeRate,
      avgLatencyMs: metrics.avgLatencyMs,
      errorRate,
      totalCalls,
    });

    // Run quality check after metric update
    const updatedListing = this.registry.get(serverId)!;
    const qc = qualityCheck(updatedListing);
    if (qc.action === 'suspend' && updatedListing.status === 'active') {
      this.registry.setStatus(serverId, 'suspended');
    }
    if (qc.action === 'deprecated' && updatedListing.status === 'active') {
      this.registry.setStatus(serverId, 'deprecated');
    }
  }

  // === Seed ===

  async seedBuiltInServers(): Promise<number> {
    const configs = this.adapter.getAllConfigs();
    let seeded = 0;

    for (const config of configs) {
      if (this.registry.get(config.id)) continue; // already published

      try {
        this.publish(config, { id: 'system', name: 'Synapse AI' }, config.tags);
        seeded++;
      } catch {
        // Validation failed or already published — skip silently
      }
    }

    return seeded;
  }

  // === Stats ===

  getStats(): {
    totalPublished: number;
    totalInstalled: number;
    pendingReview: number;
    totalReviews: number;
    avgUptimeRate: number;
    totalCalls: number;
    categoryCounts: Record<string, number>;
  } {
    const index = this.registry.getIndex();
    const categoryCounts: Record<string, number> = {};

    let totalUptimeRate = 0;
    let totalCallsSum = 0;
    let activeCount = 0;

    for (const entry of index) {
      categoryCounts[entry.category] = (categoryCounts[entry.category] ?? 0) + 1;
      const listing = this.registry.get(entry.id);
      if (listing && listing.status === 'active') {
        totalUptimeRate += listing.uptimeRate;
        totalCallsSum += listing.totalCalls;
        activeCount++;
      }
    }

    const pendingReview = index.filter((e) => e.status === 'pending_review').length;

    return {
      totalPublished: index.length,
      totalInstalled: this.installed.size,
      pendingReview,
      totalReviews: this.ratingStore.getTotalCount(),
      avgUptimeRate: activeCount > 0 ? totalUptimeRate / activeCount : 0,
      totalCalls: totalCallsSum,
      categoryCounts,
    };
  }
}

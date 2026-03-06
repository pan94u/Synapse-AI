import { mkdirSync, existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import type { MCPServerListing, MCPListingStatus } from '@synapse/shared';

interface IndexEntry {
  id: string;
  name: string;
  category: string;
  status: MCPListingStatus;
  installs: number;
  ratingAverage: number;
  ratingCount: number;
  publishedAt: string;
  updatedAt: string;
  tags: string[];
}

export class MCPMarketplaceRegistry {
  private registryDir: string;
  private indexPath: string;
  private index: IndexEntry[] = [];

  constructor(registryDir: string) {
    this.registryDir = registryDir;
    this.indexPath = join(registryDir, '_index.json');
    this.ensureDir();
    this.loadIndex();
  }

  private ensureDir(): void {
    if (!existsSync(this.registryDir)) {
      mkdirSync(this.registryDir, { recursive: true });
    }
  }

  private loadIndex(): void {
    if (existsSync(this.indexPath)) {
      try {
        this.index = JSON.parse(readFileSync(this.indexPath, 'utf-8'));
      } catch {
        this.index = [];
      }
    }
  }

  private saveIndex(): void {
    writeFileSync(this.indexPath, JSON.stringify(this.index, null, 2));
  }

  private entryPath(id: string): string {
    return join(this.registryDir, `${id}.json`);
  }

  private toIndexEntry(listing: MCPServerListing): IndexEntry {
    return {
      id: listing.id,
      name: listing.name,
      category: listing.category,
      status: listing.status,
      installs: listing.installs,
      ratingAverage: listing.rating.average,
      ratingCount: listing.rating.count,
      publishedAt: listing.publishedAt,
      updatedAt: listing.updatedAt,
      tags: listing.tags,
    };
  }

  publish(listing: MCPServerListing): void {
    writeFileSync(this.entryPath(listing.id), JSON.stringify(listing, null, 2));

    const idx = this.index.findIndex((e) => e.id === listing.id);
    if (idx !== -1) {
      this.index[idx] = this.toIndexEntry(listing);
    } else {
      this.index.push(this.toIndexEntry(listing));
    }
    this.saveIndex();
  }

  unpublish(serverId: string): boolean {
    const path = this.entryPath(serverId);
    if (!existsSync(path)) return false;

    unlinkSync(path);
    this.index = this.index.filter((e) => e.id !== serverId);
    this.saveIndex();
    return true;
  }

  get(id: string): MCPServerListing | undefined {
    const path = this.entryPath(id);
    if (!existsSync(path)) return undefined;
    try {
      return JSON.parse(readFileSync(path, 'utf-8'));
    } catch {
      return undefined;
    }
  }

  list(): MCPServerListing[] {
    return this.index
      .map((e) => this.get(e.id))
      .filter((s): s is MCPServerListing => s !== undefined);
  }

  search(query: {
    q?: string;
    category?: string;
    tag?: string;
    status?: MCPListingStatus;
  }): MCPServerListing[] {
    let filtered = this.index.slice();

    if (query.status) {
      filtered = filtered.filter((e) => e.status === query.status);
    } else {
      filtered = filtered.filter((e) => e.status === 'active');
    }

    if (query.category) {
      filtered = filtered.filter((e) => e.category === query.category);
    }

    if (query.tag) {
      const tag = query.tag.toLowerCase();
      filtered = filtered.filter((e) => e.tags.some((t) => t.toLowerCase() === tag));
    }

    if (query.q) {
      const q = query.q.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.id.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    return filtered
      .map((e) => this.get(e.id))
      .filter((s): s is MCPServerListing => s !== undefined);
  }

  updateStats(serverId: string, updates: { installs?: number }): void {
    const listing = this.get(serverId);
    if (!listing) return;

    if (updates.installs !== undefined) listing.installs = updates.installs;
    listing.updatedAt = new Date().toISOString();

    writeFileSync(this.entryPath(serverId), JSON.stringify(listing, null, 2));

    const idx = this.index.findIndex((e) => e.id === serverId);
    if (idx !== -1) {
      this.index[idx] = this.toIndexEntry(listing);
      this.saveIndex();
    }
  }

  updateRating(serverId: string, average: number, count: number): void {
    const listing = this.get(serverId);
    if (!listing) return;

    listing.rating = { average, count };
    listing.updatedAt = new Date().toISOString();

    writeFileSync(this.entryPath(serverId), JSON.stringify(listing, null, 2));

    const idx = this.index.findIndex((e) => e.id === serverId);
    if (idx !== -1) {
      this.index[idx].ratingAverage = average;
      this.index[idx].ratingCount = count;
      this.index[idx].updatedAt = listing.updatedAt;
      this.saveIndex();
    }
  }

  updateMetrics(
    serverId: string,
    metrics: { uptimeRate?: number; avgLatencyMs?: number; errorRate?: number; totalCalls?: number },
  ): void {
    const listing = this.get(serverId);
    if (!listing) return;

    if (metrics.uptimeRate !== undefined) listing.uptimeRate = metrics.uptimeRate;
    if (metrics.avgLatencyMs !== undefined) listing.avgLatencyMs = metrics.avgLatencyMs;
    if (metrics.errorRate !== undefined) listing.errorRate = metrics.errorRate;
    if (metrics.totalCalls !== undefined) listing.totalCalls = metrics.totalCalls;
    listing.updatedAt = new Date().toISOString();

    writeFileSync(this.entryPath(serverId), JSON.stringify(listing, null, 2));

    const idx = this.index.findIndex((e) => e.id === serverId);
    if (idx !== -1) {
      this.index[idx].updatedAt = listing.updatedAt;
      this.saveIndex();
    }
  }

  setStatus(serverId: string, status: MCPListingStatus): boolean {
    const listing = this.get(serverId);
    if (!listing) return false;

    listing.status = status;
    listing.updatedAt = new Date().toISOString();

    writeFileSync(this.entryPath(serverId), JSON.stringify(listing, null, 2));

    const idx = this.index.findIndex((e) => e.id === serverId);
    if (idx !== -1) {
      this.index[idx].status = status;
      this.index[idx].updatedAt = listing.updatedAt;
      this.saveIndex();
    }
    return true;
  }

  getIndex(): IndexEntry[] {
    return this.index;
  }

  getActiveCount(): number {
    return this.index.filter((e) => e.status === 'active').length;
  }
}

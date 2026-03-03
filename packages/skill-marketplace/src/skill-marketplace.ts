import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import type {
  SkillDefinition,
  SkillExecution,
  MarketplaceSkill,
  MarketplaceReview,
  MarketplaceStats,
  PublishInput,
  QualityCheckResult,
  InstallRecord,
} from '@synapse/shared';
import { MarketplaceRegistry } from './marketplace-registry.js';
import { RatingStore } from './rating-store.js';
import { SkillInstaller } from './skill-installer.js';
import { rank, rankWithScores } from './ranking-engine.js';
import { validateForPublish, qualityCheck } from './review-engine.js';

/** Adapter 接口 — 通过回调访问 SkillManager，避免循环依赖 */
export interface SkillManagerAdapter {
  getSkill(id: string): SkillDefinition | undefined;
  getHistory(): {
    query(filter: { skillId?: string; status?: SkillExecution['status'] }): SkillExecution[];
  };
  reloadInstalledSkills(): void;
}

export interface SkillMarketplaceConfig {
  registryDir: string;
  reviewsDir: string;
  installedSkillsDir: string;
  installedRecordPath: string;
}

export class SkillMarketplace {
  private registry: MarketplaceRegistry;
  private ratingStore: RatingStore;
  private installer: SkillInstaller;
  private adapter: SkillManagerAdapter;

  constructor(config: SkillMarketplaceConfig, adapter: SkillManagerAdapter) {
    this.registry = new MarketplaceRegistry(config.registryDir);
    this.ratingStore = new RatingStore(config.reviewsDir);
    this.installer = new SkillInstaller(config.installedSkillsDir, config.installedRecordPath);
    this.adapter = adapter;
  }

  // === Publish ===

  publish(input: PublishInput): { skill: MarketplaceSkill; warnings: string[] } {
    // 1. Resolve skill from SkillManager
    const skillDef = this.adapter.getSkill(input.skillId);
    if (!skillDef) {
      throw new Error(`Skill "${input.skillId}" not found in SkillManager`);
    }

    // 2. Validate for publishing
    const validation = validateForPublish(skillDef);
    if (!validation.valid) {
      throw new Error(`Skill validation failed: ${validation.errors.join('; ')}`);
    }

    // 3. Check for duplicate
    const existing = this.registry.get(input.skillId);
    if (existing) {
      throw new Error(`Skill "${input.skillId}" is already published. Use update instead.`);
    }

    // 4. Build SKILL.md content for storage
    const skillContent = this.buildSkillContent(skillDef);
    const checksum = createHash('sha256').update(skillContent).digest('hex');

    const now = new Date().toISOString();
    const marketplaceSkill: MarketplaceSkill = {
      id: skillDef.id,
      name: skillDef.name,
      version: input.version ?? '1.0.0',
      author: input.author,
      description: skillDef.description,
      category: skillDef.category,
      tags: input.tags ?? [],
      downloads: 0,
      rating: { average: 0, count: 0 },
      successRate: 1.0,
      publishedAt: now,
      updatedAt: now,
      size: Buffer.byteLength(skillContent, 'utf-8'),
      dependencies: input.dependencies ?? [],
      compatibility: input.compatibility ?? '',
      status: 'active',
      checksum,
      skillContent,
    };

    // 5. Register in marketplace
    this.registry.publish(marketplaceSkill);

    return { skill: marketplaceSkill, warnings: validation.warnings };
  }

  unpublish(skillId: string): boolean {
    return this.registry.unpublish(skillId);
  }

  updateMetadata(
    skillId: string,
    updates: { tags?: string[]; status?: MarketplaceSkill['status'] },
  ): MarketplaceSkill | undefined {
    const skill = this.registry.get(skillId);
    if (!skill) return undefined;

    if (updates.tags !== undefined) skill.tags = updates.tags;
    if (updates.status !== undefined) skill.status = updates.status;
    skill.updatedAt = new Date().toISOString();

    this.registry.publish(skill);
    return skill;
  }

  // === Install ===

  install(skillId: string): InstallRecord {
    const skill = this.registry.get(skillId);
    if (!skill) {
      throw new Error(`Skill "${skillId}" not found in marketplace`);
    }
    if (skill.status !== 'active') {
      throw new Error(`Skill "${skillId}" is ${skill.status} and cannot be installed`);
    }

    const record = this.installer.install(skill);

    // Update download count
    this.registry.updateStats(skillId, { downloads: skill.downloads + 1 });

    // Reload installed skills in SkillManager
    this.adapter.reloadInstalledSkills();

    return record;
  }

  uninstall(skillId: string): boolean {
    const result = this.installer.uninstall(skillId);
    if (result) {
      this.adapter.reloadInstalledSkills();
    }
    return result;
  }

  updateInstalled(skillId: string): InstallRecord | undefined {
    const skill = this.registry.get(skillId);
    if (!skill) {
      throw new Error(`Skill "${skillId}" not found in marketplace`);
    }

    const record = this.installer.update(skill);
    if (record) {
      this.adapter.reloadInstalledSkills();
    }
    return record;
  }

  listInstalled(): InstallRecord[] {
    return this.installer.listInstalled();
  }

  checkUpdates(): { skillId: string; current: string; latest: string }[] {
    return this.installer.checkUpdates((id) => this.registry.get(id));
  }

  // === Search & Browse ===

  getSkill(skillId: string): MarketplaceSkill | undefined {
    return this.registry.get(skillId);
  }

  search(query: { q?: string; category?: string; tag?: string }): MarketplaceSkill[] {
    return this.registry.search(query);
  }

  browse(options: {
    category?: string;
    sort?: 'ranking' | 'recent' | 'downloads';
  }): MarketplaceSkill[] {
    let skills = this.registry.search({ category: options.category });

    switch (options.sort) {
      case 'recent':
        skills.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
        break;
      case 'downloads':
        skills.sort((a, b) => b.downloads - a.downloads);
        break;
      case 'ranking':
      default:
        skills = rank(skills);
        break;
    }

    return skills;
  }

  top(limit = 10): MarketplaceSkill[] {
    const all = this.registry.search({});
    const ranked = rank(all);
    return ranked.slice(0, limit);
  }

  // === Reviews ===

  addReview(review: {
    skillId: string;
    userId: string;
    userName: string;
    rating: number;
    comment: string;
  }): { review: MarketplaceReview; qualityCheck: QualityCheckResult } {
    // Validate rating range
    if (review.rating < 1 || review.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Verify skill exists in marketplace
    const skill = this.registry.get(review.skillId);
    if (!skill) {
      throw new Error(`Skill "${review.skillId}" not found in marketplace`);
    }

    const newReview = this.ratingStore.addReview(review);

    // Update rating on marketplace skill
    const { average, count } = this.ratingStore.getAverageRating(review.skillId);
    this.registry.updateRating(review.skillId, average, count);

    // Run quality check
    const updatedSkill = this.registry.get(review.skillId)!;
    const execStats = this.getExecutionStats(review.skillId);
    const qc = qualityCheck(updatedSkill, execStats);

    // Auto-suspend if quality check recommends it
    if (qc.action === 'suspend' && updatedSkill.status === 'active') {
      this.registry.setStatus(review.skillId, 'suspended');
    }

    return { review: newReview, qualityCheck: qc };
  }

  updateReview(
    reviewId: string,
    updates: { rating?: number; comment?: string },
  ): MarketplaceReview | undefined {
    if (updates.rating !== undefined && (updates.rating < 1 || updates.rating > 5)) {
      throw new Error('Rating must be between 1 and 5');
    }

    const updated = this.ratingStore.updateReview(reviewId, updates);
    if (!updated) return undefined;

    // Recalculate rating
    const { average, count } = this.ratingStore.getAverageRating(updated.skillId);
    this.registry.updateRating(updated.skillId, average, count);

    return updated;
  }

  deleteReview(reviewId: string): boolean {
    const review = this.ratingStore.getReview(reviewId);
    if (!review) return false;

    const deleted = this.ratingStore.deleteReview(reviewId);
    if (deleted) {
      const { average, count } = this.ratingStore.getAverageRating(review.skillId);
      this.registry.updateRating(review.skillId, average, count);
    }
    return deleted;
  }

  getReviews(skillId: string): MarketplaceReview[] {
    return this.ratingStore.getReviews(skillId);
  }

  // === Stats ===

  getStats(): MarketplaceStats {
    const index = this.registry.getIndex();
    const categoryCounts: Record<string, number> = {};
    for (const entry of index) {
      categoryCounts[entry.category] = (categoryCounts[entry.category] ?? 0) + 1;
    }

    return {
      totalPublished: index.length,
      totalInstalled: this.installer.listInstalled().length,
      totalReviews: this.ratingStore.getTotalCount(),
      categoryCounts,
    };
  }

  // === Internal Helpers ===

  private buildSkillContent(skill: SkillDefinition): string {
    // Reconstruct SKILL.md from SkillDefinition
    const frontmatter: Record<string, unknown> = {
      name: skill.name,
      description: skill.description,
      category: skill.category,
      status: skill.status,
    };

    if (skill.allowedTools.length > 0) {
      frontmatter['allowed-tools'] = skill.allowedTools;
    }
    if (skill.parameters.length > 0) {
      frontmatter.parameters = skill.parameters;
    }
    if (skill.metadata) {
      frontmatter.metadata = skill.metadata;
    }
    if (skill.license) {
      frontmatter.license = skill.license;
    }
    if (skill.compatibility) {
      frontmatter.compatibility = skill.compatibility;
    }
    if (skill.createdAt) {
      frontmatter.createdAt = skill.createdAt;
    }
    if (skill.updatedAt) {
      frontmatter.updatedAt = skill.updatedAt;
    }

    // Build YAML manually to avoid adding a yaml dependency to this package
    const yamlLines = this.toYaml(frontmatter);
    return `---\n${yamlLines}---\n\n${skill.instructions}`;
  }

  private toYaml(obj: Record<string, unknown>, indent = 0): string {
    const prefix = '  '.repeat(indent);
    let result = '';

    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined || value === null) continue;

      if (Array.isArray(value)) {
        if (value.length === 0) {
          result += `${prefix}${key}: []\n`;
        } else if (typeof value[0] === 'object') {
          result += `${prefix}${key}:\n`;
          for (const item of value) {
            const itemLines = this.toYaml(item as Record<string, unknown>, indent + 2);
            const lines = itemLines.split('\n').filter(Boolean);
            if (lines.length > 0) {
              result += `${prefix}  - ${lines[0].trim()}\n`;
              for (let i = 1; i < lines.length; i++) {
                result += `${prefix}    ${lines[i].trim()}\n`;
              }
            }
          }
        } else {
          result += `${prefix}${key}:\n`;
          for (const item of value) {
            result += `${prefix}  - ${item}\n`;
          }
        }
      } else if (typeof value === 'object') {
        result += `${prefix}${key}:\n`;
        result += this.toYaml(value as Record<string, unknown>, indent + 1);
      } else if (typeof value === 'string' && value.includes('\n')) {
        result += `${prefix}${key}: |\n`;
        for (const line of value.split('\n')) {
          result += `${prefix}  ${line}\n`;
        }
      } else {
        result += `${prefix}${key}: ${value}\n`;
      }
    }

    return result;
  }

  private getExecutionStats(
    skillId: string,
  ): { totalExecutions: number; failureCount: number } | undefined {
    try {
      const history = this.adapter.getHistory();
      const all = history.query({ skillId });
      if (all.length === 0) return undefined;

      const failures = all.filter((e) => e.status === 'error');
      return { totalExecutions: all.length, failureCount: failures.length };
    } catch {
      return undefined;
    }
  }
}

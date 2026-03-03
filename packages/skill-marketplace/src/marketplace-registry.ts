import { mkdirSync, existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import type { MarketplaceSkill } from '@synapse/shared';

interface IndexEntry {
  id: string;
  name: string;
  category: string;
  status: MarketplaceSkill['status'];
  downloads: number;
  ratingAverage: number;
  ratingCount: number;
  publishedAt: string;
  updatedAt: string;
  tags: string[];
}

export class MarketplaceRegistry {
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

  private toIndexEntry(skill: MarketplaceSkill): IndexEntry {
    return {
      id: skill.id,
      name: skill.name,
      category: skill.category,
      status: skill.status,
      downloads: skill.downloads,
      ratingAverage: skill.rating.average,
      ratingCount: skill.rating.count,
      publishedAt: skill.publishedAt,
      updatedAt: skill.updatedAt,
      tags: skill.tags,
    };
  }

  publish(skill: MarketplaceSkill): void {
    writeFileSync(this.entryPath(skill.id), JSON.stringify(skill, null, 2));

    const idx = this.index.findIndex((e) => e.id === skill.id);
    if (idx !== -1) {
      this.index[idx] = this.toIndexEntry(skill);
    } else {
      this.index.push(this.toIndexEntry(skill));
    }
    this.saveIndex();
  }

  unpublish(skillId: string): boolean {
    const path = this.entryPath(skillId);
    if (!existsSync(path)) return false;

    unlinkSync(path);
    this.index = this.index.filter((e) => e.id !== skillId);
    this.saveIndex();
    return true;
  }

  get(id: string): MarketplaceSkill | undefined {
    const path = this.entryPath(id);
    if (!existsSync(path)) return undefined;
    try {
      return JSON.parse(readFileSync(path, 'utf-8'));
    } catch {
      return undefined;
    }
  }

  list(): MarketplaceSkill[] {
    return this.index
      .map((e) => this.get(e.id))
      .filter((s): s is MarketplaceSkill => s !== undefined);
  }

  search(query: {
    q?: string;
    category?: string;
    tag?: string;
    status?: MarketplaceSkill['status'];
  }): MarketplaceSkill[] {
    let filtered = this.index.slice();

    if (query.status) {
      filtered = filtered.filter((e) => e.status === query.status);
    } else {
      // Default: only show active skills
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
      .filter((s): s is MarketplaceSkill => s !== undefined);
  }

  updateStats(skillId: string, updates: { downloads?: number; successRate?: number }): void {
    const skill = this.get(skillId);
    if (!skill) return;

    if (updates.downloads !== undefined) skill.downloads = updates.downloads;
    if (updates.successRate !== undefined) skill.successRate = updates.successRate;
    skill.updatedAt = new Date().toISOString();

    writeFileSync(this.entryPath(skillId), JSON.stringify(skill, null, 2));

    const idx = this.index.findIndex((e) => e.id === skillId);
    if (idx !== -1) {
      this.index[idx] = this.toIndexEntry(skill);
      this.saveIndex();
    }
  }

  updateRating(skillId: string, average: number, count: number): void {
    const skill = this.get(skillId);
    if (!skill) return;

    skill.rating = { average, count };
    skill.updatedAt = new Date().toISOString();

    writeFileSync(this.entryPath(skillId), JSON.stringify(skill, null, 2));

    const idx = this.index.findIndex((e) => e.id === skillId);
    if (idx !== -1) {
      this.index[idx].ratingAverage = average;
      this.index[idx].ratingCount = count;
      this.index[idx].updatedAt = skill.updatedAt;
      this.saveIndex();
    }
  }

  setStatus(skillId: string, status: MarketplaceSkill['status']): boolean {
    const skill = this.get(skillId);
    if (!skill) return false;

    skill.status = status;
    skill.updatedAt = new Date().toISOString();

    writeFileSync(this.entryPath(skillId), JSON.stringify(skill, null, 2));

    const idx = this.index.findIndex((e) => e.id === skillId);
    if (idx !== -1) {
      this.index[idx].status = status;
      this.index[idx].updatedAt = skill.updatedAt;
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

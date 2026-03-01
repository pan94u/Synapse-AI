import { mkdirSync, existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import type { OrgMemoryEntry } from '@synapse/shared';

interface IndexEntry {
  id: string;
  category: OrgMemoryEntry['category'];
  title: string;
  tags: string[];
}

const CATEGORIES: OrgMemoryEntry['category'][] = ['policies', 'decisions', 'lessons', 'knowledge'];

export class OrgMemoryStore {
  private dataDir: string;
  private indexPath: string;
  private index: IndexEntry[] = [];

  constructor(dataDir: string) {
    this.dataDir = dataDir;
    this.indexPath = join(dataDir, '_index.json');
    this.ensureDirs();
    this.loadIndex();
  }

  private ensureDirs(): void {
    for (const cat of CATEGORIES) {
      const dir = join(this.dataDir, cat);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
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

  private entryPath(category: string, id: string): string {
    return join(this.dataDir, category, `${id}.json`);
  }

  create(entry: Omit<OrgMemoryEntry, 'id' | 'createdAt' | 'updatedAt'>): OrgMemoryEntry {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const full: OrgMemoryEntry = {
      id,
      ...entry,
      createdAt: now,
      updatedAt: now,
    };

    writeFileSync(this.entryPath(full.category, id), JSON.stringify(full, null, 2));
    this.index.push({ id, category: full.category, title: full.title, tags: full.tags });
    this.saveIndex();

    return full;
  }

  get(id: string): OrgMemoryEntry | undefined {
    const indexEntry = this.index.find((e) => e.id === id);
    if (!indexEntry) return undefined;

    const path = this.entryPath(indexEntry.category, id);
    if (!existsSync(path)) return undefined;

    return JSON.parse(readFileSync(path, 'utf-8'));
  }

  update(id: string, updates: Partial<Pick<OrgMemoryEntry, 'title' | 'content' | 'tags'>>): OrgMemoryEntry | undefined {
    const existing = this.get(id);
    if (!existing) return undefined;

    const updated: OrgMemoryEntry = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    writeFileSync(this.entryPath(updated.category, id), JSON.stringify(updated, null, 2));

    // Update index
    const idx = this.index.findIndex((e) => e.id === id);
    if (idx !== -1) {
      this.index[idx] = { id, category: updated.category, title: updated.title, tags: updated.tags };
      this.saveIndex();
    }

    return updated;
  }

  delete(id: string): boolean {
    const indexEntry = this.index.find((e) => e.id === id);
    if (!indexEntry) return false;

    const path = this.entryPath(indexEntry.category, id);
    if (existsSync(path)) {
      unlinkSync(path);
    }

    this.index = this.index.filter((e) => e.id !== id);
    this.saveIndex();
    return true;
  }

  list(category?: string): OrgMemoryEntry[] {
    const filtered = category ? this.index.filter((e) => e.category === category) : this.index;
    return filtered
      .map((e) => this.get(e.id))
      .filter((e): e is OrgMemoryEntry => e !== undefined);
  }

  search(query: string, category?: string): OrgMemoryEntry[] {
    const q = query.toLowerCase();
    let candidates = category ? this.index.filter((e) => e.category === category) : this.index;

    // Fast filter on index (title + tags)
    candidates = candidates.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q)),
    );

    // Load full entries and also check content
    const results: OrgMemoryEntry[] = [];
    for (const c of candidates) {
      const entry = this.get(c.id);
      if (entry) results.push(entry);
    }

    // Also check entries whose content matches but title/tags didn't
    const candidateIds = new Set(candidates.map((c) => c.id));
    const remaining = category ? this.index.filter((e) => e.category === category && !candidateIds.has(e.id)) : this.index.filter((e) => !candidateIds.has(e.id));
    for (const r of remaining) {
      const entry = this.get(r.id);
      if (entry && entry.content.toLowerCase().includes(q)) {
        results.push(entry);
      }
    }

    return results;
  }

  /** Filter entries by persona's orgMemoryAccess glob patterns (e.g. "company/*", "finance/summary/*") */
  listByAccess(accessPatterns: string[]): OrgMemoryEntry[] {
    if (accessPatterns.length === 0) return [];

    return this.index
      .filter((e) => this.matchesAccess(e.category, accessPatterns))
      .map((e) => this.get(e.id))
      .filter((e): e is OrgMemoryEntry => e !== undefined);
  }

  private matchesAccess(category: string, patterns: string[]): boolean {
    for (const pattern of patterns) {
      // Simple glob matching: "company/*" matches all categories, "finance/*" matches "finance" category-like patterns
      // Patterns: "company/*" → match all, "strategy/*" → match decisions, etc.
      if (pattern === '*' || pattern === '*/*') return true;
      if (pattern.startsWith('company/')) return true; // company/* means all org memory
      if (pattern.startsWith('strategy/')) return category === 'decisions' || category === 'knowledge';
      if (pattern.startsWith('finance/')) return category === 'policies' || category === 'knowledge';
      if (pattern.startsWith('hr/')) return category === 'policies' || category === 'knowledge';
      if (pattern.startsWith('legal/')) return category === 'policies' || category === 'knowledge';
      if (pattern.startsWith('engineering/')) return category === 'knowledge' || category === 'lessons';
      // Direct category match
      if (pattern === category || pattern === `${category}/*`) return true;
    }
    return false;
  }
}

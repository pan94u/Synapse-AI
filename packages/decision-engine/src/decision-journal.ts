import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DecisionRecord } from '@synapse/shared';

interface IndexEntry {
  id: string;
  deciderId: string;
  status: DecisionRecord['tracking']['status'];
  createdAt: string;
}

export class DecisionJournal {
  private dataDir: string;
  private indexPath: string;
  private index: IndexEntry[] = [];

  constructor(dataDir: string) {
    this.dataDir = dataDir;
    this.indexPath = join(dataDir, '_index.json');
    this.ensureDir();
    this.loadIndex();
  }

  private ensureDir(): void {
    if (!existsSync(this.dataDir)) {
      mkdirSync(this.dataDir, { recursive: true });
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
    return join(this.dataDir, `${id}.json`);
  }

  create(record: Omit<DecisionRecord, 'id' | 'createdAt' | 'updatedAt'>): DecisionRecord {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const full: DecisionRecord = {
      id,
      ...record,
      createdAt: now,
      updatedAt: now,
    };

    writeFileSync(this.entryPath(id), JSON.stringify(full, null, 2));
    this.index.push({
      id,
      deciderId: full.deciderId,
      status: full.tracking.status,
      createdAt: full.createdAt,
    });
    this.saveIndex();

    return full;
  }

  get(id: string): DecisionRecord | undefined {
    return this.getById(id);
  }

  update(
    id: string,
    updates: Partial<Pick<DecisionRecord, 'decision' | 'tracking'>>,
  ): DecisionRecord | undefined {
    const existing = this.getById(id);
    if (!existing) return undefined;

    if (updates.decision) {
      existing.decision = { ...existing.decision, ...updates.decision };
    }
    if (updates.tracking) {
      existing.tracking = { ...existing.tracking, ...updates.tracking };
    }
    existing.updatedAt = new Date().toISOString();

    writeFileSync(this.entryPath(id), JSON.stringify(existing, null, 2));

    // Update index status
    const indexEntry = this.index.find((e) => e.id === id);
    if (indexEntry && updates.tracking?.status) {
      indexEntry.status = updates.tracking.status;
      this.saveIndex();
    }

    return existing;
  }

  query(filter: {
    deciderId?: string;
    status?: DecisionRecord['tracking']['status'];
    limit?: number;
  }): DecisionRecord[] {
    let entries = this.index.slice();

    if (filter.deciderId) {
      entries = entries.filter((e) => e.deciderId === filter.deciderId);
    }
    if (filter.status) {
      entries = entries.filter((e) => e.status === filter.status);
    }

    entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    if (filter.limit) {
      entries = entries.slice(0, filter.limit);
    }

    return entries
      .map((e) => this.getById(e.id))
      .filter((e): e is DecisionRecord => e !== undefined);
  }

  getRecent(limit = 20): DecisionRecord[] {
    const sorted = this.index.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return sorted
      .slice(0, limit)
      .map((e) => this.getById(e.id))
      .filter((e): e is DecisionRecord => e !== undefined);
  }

  getCount(): number {
    return this.index.length;
  }

  private getById(id: string): DecisionRecord | undefined {
    const path = this.entryPath(id);
    if (!existsSync(path)) return undefined;
    try {
      return JSON.parse(readFileSync(path, 'utf-8'));
    } catch {
      return undefined;
    }
  }
}

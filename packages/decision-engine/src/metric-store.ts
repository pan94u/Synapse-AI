import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { MetricSnapshot } from '@synapse/shared';

interface IndexEntry {
  id: string;
  metricId: string;
  value: number;
  period: string;
  periodType: MetricSnapshot['periodType'];
  collectedAt: string;
}

export class MetricStore {
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

  record(snapshot: Omit<MetricSnapshot, 'id' | 'collectedAt'>): MetricSnapshot {
    const id = crypto.randomUUID();
    const full: MetricSnapshot = {
      id,
      ...snapshot,
      collectedAt: new Date().toISOString(),
    };

    writeFileSync(this.entryPath(id), JSON.stringify(full, null, 2));
    this.index.push({
      id,
      metricId: full.metricId,
      value: full.value,
      period: full.period,
      periodType: full.periodType,
      collectedAt: full.collectedAt,
    });
    this.saveIndex();

    return full;
  }

  getLatest(metricId: string): MetricSnapshot | undefined {
    const entries = this.index
      .filter((e) => e.metricId === metricId)
      .sort((a, b) => b.collectedAt.localeCompare(a.collectedAt));

    if (entries.length === 0) return undefined;
    return this.getById(entries[0].id);
  }

  getHistory(metricId: string, opts?: { periodType?: MetricSnapshot['periodType']; limit?: number }): MetricSnapshot[] {
    let entries = this.index.filter((e) => e.metricId === metricId);

    if (opts?.periodType) {
      entries = entries.filter((e) => e.periodType === opts.periodType);
    }

    entries.sort((a, b) => b.collectedAt.localeCompare(a.collectedAt));

    if (opts?.limit) {
      entries = entries.slice(0, opts.limit);
    }

    return entries
      .map((e) => this.getById(e.id))
      .filter((e): e is MetricSnapshot => e !== undefined);
  }

  query(filter: {
    metricId?: string;
    periodType?: MetricSnapshot['periodType'];
    from?: string;
    to?: string;
    limit?: number;
  }): MetricSnapshot[] {
    let entries = this.index.slice();

    if (filter.metricId) {
      entries = entries.filter((e) => e.metricId === filter.metricId);
    }
    if (filter.periodType) {
      entries = entries.filter((e) => e.periodType === filter.periodType);
    }
    if (filter.from) {
      entries = entries.filter((e) => e.collectedAt >= filter.from!);
    }
    if (filter.to) {
      entries = entries.filter((e) => e.collectedAt <= filter.to!);
    }

    entries.sort((a, b) => b.collectedAt.localeCompare(a.collectedAt));

    if (filter.limit) {
      entries = entries.slice(0, filter.limit);
    }

    return entries
      .map((e) => this.getById(e.id))
      .filter((e): e is MetricSnapshot => e !== undefined);
  }

  getCount(): number {
    return this.index.length;
  }

  getMetricIds(): string[] {
    return [...new Set(this.index.map((e) => e.metricId))];
  }

  private getById(id: string): MetricSnapshot | undefined {
    const path = this.entryPath(id);
    if (!existsSync(path)) return undefined;
    try {
      return JSON.parse(readFileSync(path, 'utf-8'));
    } catch {
      return undefined;
    }
  }
}

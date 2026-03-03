import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { SkillExecution } from '@synapse/shared';

interface IndexEntry {
  id: string;
  skillId: string;
  personaId: string;
  triggerType: SkillExecution['triggerType'];
  status: SkillExecution['status'];
  startedAt: string;
  completedAt?: string;
}

export class ExecutionHistory {
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

  recordStart(exec: Omit<SkillExecution, 'id' | 'completedAt'>): SkillExecution {
    const id = crypto.randomUUID();
    const full: SkillExecution = { id, ...exec };

    writeFileSync(this.entryPath(id), JSON.stringify(full, null, 2));
    this.index.push({
      id,
      skillId: full.skillId,
      personaId: full.personaId,
      triggerType: full.triggerType,
      status: full.status,
      startedAt: full.startedAt,
    });
    this.saveIndex();

    return full;
  }

  recordComplete(
    id: string,
    result: {
      status: 'success' | 'error';
      result?: string;
      error?: string;
      model?: string;
      toolCallsExecuted?: number;
    },
  ): SkillExecution | undefined {
    const entry = this.get(id);
    if (!entry) return undefined;

    const updated: SkillExecution = {
      ...entry,
      ...result,
      completedAt: new Date().toISOString(),
    };

    writeFileSync(this.entryPath(id), JSON.stringify(updated, null, 2));

    const idx = this.index.findIndex((e) => e.id === id);
    if (idx !== -1) {
      this.index[idx].status = updated.status;
      this.index[idx].completedAt = updated.completedAt;
      this.saveIndex();
    }

    return updated;
  }

  get(id: string): SkillExecution | undefined {
    const path = this.entryPath(id);
    if (!existsSync(path)) return undefined;
    try {
      return JSON.parse(readFileSync(path, 'utf-8'));
    } catch {
      return undefined;
    }
  }

  query(filter: {
    skillId?: string;
    personaId?: string;
    status?: SkillExecution['status'];
    limit?: number;
  }): SkillExecution[] {
    let filtered = this.index.slice();

    if (filter.skillId) filtered = filtered.filter((e) => e.skillId === filter.skillId);
    if (filter.personaId) filtered = filtered.filter((e) => e.personaId === filter.personaId);
    if (filter.status) filtered = filtered.filter((e) => e.status === filter.status);

    // Most recent first
    filtered.sort((a, b) => b.startedAt.localeCompare(a.startedAt));

    if (filter.limit) filtered = filtered.slice(0, filter.limit);

    return filtered
      .map((e) => this.get(e.id))
      .filter((e): e is SkillExecution => e !== undefined);
  }

  getRecent(limit = 20): SkillExecution[] {
    return this.query({ limit });
  }

  getCount(): number {
    return this.index.length;
  }
}

import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ProactiveTaskExecution } from '@synapse/shared';

interface IndexEntry {
  id: string;
  taskId: string;
  personaId: string;
  action: string;
  triggerType: ProactiveTaskExecution['triggerType'];
  status: ProactiveTaskExecution['status'];
  startedAt: string;
  completedAt?: string;
}

export class TaskHistory {
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

  recordStart(execution: Omit<ProactiveTaskExecution, 'id' | 'completedAt'>): ProactiveTaskExecution {
    const id = crypto.randomUUID();
    const full: ProactiveTaskExecution = { id, ...execution };

    writeFileSync(this.entryPath(id), JSON.stringify(full, null, 2));
    this.index.push({
      id,
      taskId: full.taskId,
      personaId: full.personaId,
      action: full.action,
      triggerType: full.triggerType,
      status: full.status,
      startedAt: full.startedAt,
    });
    this.saveIndex();

    return full;
  }

  recordComplete(
    executionId: string,
    result: { status: 'success' | 'error'; result?: string; error?: string; model?: string; toolCallsExecuted?: number },
  ): ProactiveTaskExecution | undefined {
    const entry = this.get(executionId);
    if (!entry) return undefined;

    const updated: ProactiveTaskExecution = {
      ...entry,
      ...result,
      completedAt: new Date().toISOString(),
    };

    writeFileSync(this.entryPath(executionId), JSON.stringify(updated, null, 2));

    const idx = this.index.findIndex((e) => e.id === executionId);
    if (idx !== -1) {
      this.index[idx].status = updated.status;
      this.index[idx].completedAt = updated.completedAt;
      this.saveIndex();
    }

    return updated;
  }

  get(executionId: string): ProactiveTaskExecution | undefined {
    const path = this.entryPath(executionId);
    if (!existsSync(path)) return undefined;
    try {
      return JSON.parse(readFileSync(path, 'utf-8'));
    } catch {
      return undefined;
    }
  }

  query(filter: {
    taskId?: string;
    personaId?: string;
    status?: ProactiveTaskExecution['status'];
    limit?: number;
  }): ProactiveTaskExecution[] {
    let filtered = this.index.slice();

    if (filter.taskId) filtered = filtered.filter((e) => e.taskId === filter.taskId);
    if (filter.personaId) filtered = filtered.filter((e) => e.personaId === filter.personaId);
    if (filter.status) filtered = filtered.filter((e) => e.status === filter.status);

    // Most recent first
    filtered.sort((a, b) => b.startedAt.localeCompare(a.startedAt));

    if (filter.limit) filtered = filtered.slice(0, filter.limit);

    return filtered
      .map((e) => this.get(e.id))
      .filter((e): e is ProactiveTaskExecution => e !== undefined);
  }

  getRecent(limit = 20): ProactiveTaskExecution[] {
    return this.query({ limit });
  }
}

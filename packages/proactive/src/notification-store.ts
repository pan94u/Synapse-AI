import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ProactiveNotification } from '@synapse/shared';

interface IndexEntry {
  id: string;
  personaId: string;
  severity: ProactiveNotification['severity'];
  read: boolean;
  createdAt: string;
}

export class NotificationStore {
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

  create(notification: Omit<ProactiveNotification, 'id' | 'createdAt' | 'read'>): ProactiveNotification {
    const id = crypto.randomUUID();
    const full: ProactiveNotification = {
      id,
      ...notification,
      read: false,
      createdAt: new Date().toISOString(),
    };

    writeFileSync(this.entryPath(id), JSON.stringify(full, null, 2));
    this.index.push({
      id,
      personaId: full.personaId,
      severity: full.severity,
      read: false,
      createdAt: full.createdAt,
    });
    this.saveIndex();

    return full;
  }

  getForPersona(personaId: string, opts?: { unreadOnly?: boolean; limit?: number }): ProactiveNotification[] {
    let filtered = this.index.filter((e) => e.personaId === personaId);

    if (opts?.unreadOnly) filtered = filtered.filter((e) => !e.read);

    // Most recent first
    filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    if (opts?.limit) filtered = filtered.slice(0, opts.limit);

    return filtered
      .map((e) => this.getById(e.id))
      .filter((e): e is ProactiveNotification => e !== undefined);
  }

  markRead(id: string): boolean {
    const idx = this.index.findIndex((e) => e.id === id);
    if (idx === -1) return false;

    this.index[idx].read = true;
    this.saveIndex();

    const entry = this.getById(id);
    if (entry) {
      entry.read = true;
      writeFileSync(this.entryPath(id), JSON.stringify(entry, null, 2));
    }

    return true;
  }

  markAllRead(personaId: string): number {
    let count = 0;
    for (const entry of this.index) {
      if (entry.personaId === personaId && !entry.read) {
        entry.read = true;
        const full = this.getById(entry.id);
        if (full) {
          full.read = true;
          writeFileSync(this.entryPath(entry.id), JSON.stringify(full, null, 2));
        }
        count++;
      }
    }
    if (count > 0) this.saveIndex();
    return count;
  }

  getUnreadCount(personaId: string): number {
    return this.index.filter((e) => e.personaId === personaId && !e.read).length;
  }

  getRecent(limit = 20): ProactiveNotification[] {
    const sorted = this.index.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return sorted
      .slice(0, limit)
      .map((e) => this.getById(e.id))
      .filter((e): e is ProactiveNotification => e !== undefined);
  }

  private getById(id: string): ProactiveNotification | undefined {
    const path = this.entryPath(id);
    if (!existsSync(path)) return undefined;
    try {
      return JSON.parse(readFileSync(path, 'utf-8'));
    } catch {
      return undefined;
    }
  }
}

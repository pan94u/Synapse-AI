import type { MCPAuditEntry } from '@synapse/shared';
import { randomUUID } from 'node:crypto';

const MAX_ENTRIES = 1000;

export class MCPAuditLogger {
  private entries: MCPAuditEntry[] = [];

  log(entry: Omit<MCPAuditEntry, 'id' | 'timestamp'>): void {
    const full: MCPAuditEntry = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      ...entry,
    };

    this.entries.push(full);

    // Trim to max size
    if (this.entries.length > MAX_ENTRIES) {
      this.entries = this.entries.slice(-MAX_ENTRIES);
    }

    console.log(
      `[mcp-audit] ${full.action} ${full.serverId}/${full.target} (${full.latencyMs}ms)`,
    );
  }

  query(filter: {
    serverId?: string;
    since?: string;
    until?: string;
  }): MCPAuditEntry[] {
    let result = this.entries;

    if (filter.serverId) {
      result = result.filter((e) => e.serverId === filter.serverId);
    }
    if (filter.since) {
      result = result.filter((e) => e.timestamp >= filter.since!);
    }
    if (filter.until) {
      result = result.filter((e) => e.timestamp <= filter.until!);
    }

    return result;
  }

  getRecent(limit: number): MCPAuditEntry[] {
    return this.entries.slice(-limit);
  }
}

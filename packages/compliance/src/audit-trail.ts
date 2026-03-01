import type { AuditTrailEntry, PreHookResult, PostHookResult } from '@synapse/shared';

const MAX_ENTRIES = 2000;
let nextId = 1;

export class ComplianceAuditTrail {
  private entries: AuditTrailEntry[] = [];

  record(entry: Omit<AuditTrailEntry, 'id' | 'timestamp'>): void {
    const full: AuditTrailEntry = {
      ...entry,
      id: `audit-${nextId++}`,
      timestamp: new Date().toISOString(),
    };
    this.entries.push(full);
    if (this.entries.length > MAX_ENTRIES) {
      this.entries = this.entries.slice(-MAX_ENTRIES);
    }
  }

  query(filter: {
    personaId?: string;
    toolName?: string;
    since?: string;
    until?: string;
  }): AuditTrailEntry[] {
    return this.entries.filter((e) => {
      if (filter.personaId && e.personaId !== filter.personaId) return false;
      if (filter.toolName && e.toolName !== filter.toolName) return false;
      if (filter.since && e.timestamp < filter.since) return false;
      if (filter.until && e.timestamp > filter.until) return false;
      return true;
    });
  }

  getRecent(limit = 50): AuditTrailEntry[] {
    return this.entries.slice(-limit).reverse();
  }
}

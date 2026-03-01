import type { OrgMemoryEntry, PersonalFact, ConversationSummary, KnowledgeDocument } from '@synapse/shared';

/** Structural interface for OrgMemoryStore — avoids direct @synapse/memory dependency */
export interface OrgMemoryStoreAdapter {
  search(query: string, category?: string): OrgMemoryEntry[];
  list(category?: string): OrgMemoryEntry[];
  listByAccess(accessPatterns: string[]): OrgMemoryEntry[];
  create(entry: Omit<OrgMemoryEntry, 'id' | 'createdAt' | 'updatedAt'>): OrgMemoryEntry;
}

/** Structural interface for PersonalMemoryStore */
export interface PersonalMemoryStoreAdapter {
  getFact(personaId: string, key: string): PersonalFact | undefined;
  listFacts(personaId: string): PersonalFact[];
  setFact(personaId: string, key: string, value: string): PersonalFact;
}

/** Structural interface for KnowledgeBase */
export interface KnowledgeBaseAdapter {
  search(query: string, personaId?: string): KnowledgeDocument[];
}

export interface MemoryToolDeps {
  orgMemory: OrgMemoryStoreAdapter;
  personalMemory: PersonalMemoryStoreAdapter;
  knowledgeBase: KnowledgeBaseAdapter;
  personaId: string;
  orgMemoryAccess: string[];
}

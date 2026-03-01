/** Organization memory entry — shared knowledge (policies, decisions, lessons, best practices) */
export interface OrgMemoryEntry {
  id: string;
  category: 'policies' | 'decisions' | 'lessons' | 'knowledge';
  title: string;
  content: string;
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/** Personal memory — facts and preferences */
export interface PersonalFact {
  id: string;
  personaId: string;
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

/** Personal memory — conversation summary */
export interface ConversationSummary {
  id: string;
  personaId: string;
  date: string;
  summary: string;
  topics: string[];
  createdAt: string;
}

/** Knowledge base document */
export interface KnowledgeDocument {
  id: string;
  personaId: string;
  title: string;
  content: string;
  source?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

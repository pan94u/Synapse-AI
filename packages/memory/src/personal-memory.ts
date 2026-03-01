import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { PersonalFact, ConversationSummary } from '@synapse/shared';

export class PersonalMemoryStore {
  private dataDir: string;

  constructor(dataDir: string) {
    this.dataDir = dataDir;
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }
  }

  private personaDir(personaId: string): string {
    const dir = join(this.dataDir, personaId);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  private factsPath(personaId: string): string {
    return join(this.personaDir(personaId), 'facts.json');
  }

  private conversationsPath(personaId: string): string {
    return join(this.personaDir(personaId), 'conversations.json');
  }

  private loadFacts(personaId: string): PersonalFact[] {
    const path = this.factsPath(personaId);
    if (!existsSync(path)) return [];
    try {
      return JSON.parse(readFileSync(path, 'utf-8'));
    } catch {
      return [];
    }
  }

  private saveFacts(personaId: string, facts: PersonalFact[]): void {
    writeFileSync(this.factsPath(personaId), JSON.stringify(facts, null, 2));
  }

  private loadConversations(personaId: string): ConversationSummary[] {
    const path = this.conversationsPath(personaId);
    if (!existsSync(path)) return [];
    try {
      return JSON.parse(readFileSync(path, 'utf-8'));
    } catch {
      return [];
    }
  }

  private saveConversations(personaId: string, conversations: ConversationSummary[]): void {
    writeFileSync(this.conversationsPath(personaId), JSON.stringify(conversations, null, 2));
  }

  // ---- Facts / Preferences ----

  setFact(personaId: string, key: string, value: string): PersonalFact {
    const facts = this.loadFacts(personaId);
    const existing = facts.find((f) => f.key === key);
    const now = new Date().toISOString();

    if (existing) {
      existing.value = value;
      existing.updatedAt = now;
      this.saveFacts(personaId, facts);
      return existing;
    }

    const fact: PersonalFact = {
      id: crypto.randomUUID(),
      personaId,
      key,
      value,
      createdAt: now,
      updatedAt: now,
    };
    facts.push(fact);
    this.saveFacts(personaId, facts);
    return fact;
  }

  getFact(personaId: string, key: string): PersonalFact | undefined {
    return this.loadFacts(personaId).find((f) => f.key === key);
  }

  listFacts(personaId: string): PersonalFact[] {
    return this.loadFacts(personaId);
  }

  deleteFact(personaId: string, key: string): boolean {
    const facts = this.loadFacts(personaId);
    const idx = facts.findIndex((f) => f.key === key);
    if (idx === -1) return false;
    facts.splice(idx, 1);
    this.saveFacts(personaId, facts);
    return true;
  }

  // ---- Conversation Summaries ----

  addSummary(personaId: string, summary: Omit<ConversationSummary, 'id' | 'createdAt'>): ConversationSummary {
    const conversations = this.loadConversations(personaId);
    const full: ConversationSummary = {
      id: crypto.randomUUID(),
      ...summary,
      createdAt: new Date().toISOString(),
    };
    conversations.push(full);
    this.saveConversations(personaId, conversations);
    return full;
  }

  getSummaries(personaId: string, limit?: number): ConversationSummary[] {
    const conversations = this.loadConversations(personaId);
    // Return most recent first
    const sorted = conversations.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return limit ? sorted.slice(0, limit) : sorted;
  }
}

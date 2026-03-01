import { mkdirSync, existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import type { KnowledgeDocument } from '@synapse/shared';

interface IndexEntry {
  id: string;
  personaId: string;
  title: string;
  tags: string[];
}

export class KnowledgeBase {
  private dataDir: string;
  private indexPath: string;
  private index: IndexEntry[] = [];

  constructor(dataDir: string) {
    this.dataDir = dataDir;
    this.indexPath = join(dataDir, '_index.json');
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }
    this.loadIndex();
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

  private docPath(id: string): string {
    return join(this.dataDir, `${id}.json`);
  }

  importDocument(doc: Omit<KnowledgeDocument, 'id' | 'createdAt' | 'updatedAt'>): KnowledgeDocument {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const full: KnowledgeDocument = {
      id,
      ...doc,
      createdAt: now,
      updatedAt: now,
    };

    writeFileSync(this.docPath(id), JSON.stringify(full, null, 2));
    this.index.push({ id, personaId: full.personaId, title: full.title, tags: full.tags });
    this.saveIndex();

    return full;
  }

  get(id: string): KnowledgeDocument | undefined {
    const path = this.docPath(id);
    if (!existsSync(path)) return undefined;
    try {
      return JSON.parse(readFileSync(path, 'utf-8'));
    } catch {
      return undefined;
    }
  }

  delete(id: string): boolean {
    const path = this.docPath(id);
    if (!existsSync(path)) return false;
    unlinkSync(path);
    this.index = this.index.filter((e) => e.id !== id);
    this.saveIndex();
    return true;
  }

  list(personaId?: string): KnowledgeDocument[] {
    const filtered = personaId ? this.index.filter((e) => e.personaId === personaId) : this.index;
    return filtered
      .map((e) => this.get(e.id))
      .filter((e): e is KnowledgeDocument => e !== undefined);
  }

  search(query: string, personaId?: string): KnowledgeDocument[] {
    const q = query.toLowerCase();
    let candidates = personaId ? this.index.filter((e) => e.personaId === personaId) : this.index;

    // Fast filter on index (title + tags)
    const indexMatches = candidates.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q)),
    );

    const results: KnowledgeDocument[] = [];
    const matchedIds = new Set<string>();

    for (const m of indexMatches) {
      const doc = this.get(m.id);
      if (doc) {
        results.push(doc);
        matchedIds.add(m.id);
      }
    }

    // Also check content for remaining candidates
    const remaining = candidates.filter((e) => !matchedIds.has(e.id));
    for (const r of remaining) {
      const doc = this.get(r.id);
      if (doc && doc.content.toLowerCase().includes(q)) {
        results.push(doc);
      }
    }

    return results;
  }
}

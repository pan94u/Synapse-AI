import type { Tool } from '../types.js';
import type { MemoryToolDeps } from './memory-types.js';

export function createMemoryReadTool(deps: MemoryToolDeps): Tool {
  return {
    definition: {
      name: 'memory_read',
      description:
        'Read from memory. Use scope="personal" to read user preferences/facts (optionally specify "key" for a specific fact). Use scope="org" to search organization knowledge (optionally specify "query" and "category").',
      parameters: {
        type: 'object',
        properties: {
          scope: {
            type: 'string',
            enum: ['personal', 'org'],
            description: 'Whether to read personal memory or organization memory',
          },
          key: {
            type: 'string',
            description: 'For personal scope: specific fact key to retrieve',
          },
          query: {
            type: 'string',
            description: 'For org scope: search keyword',
          },
          category: {
            type: 'string',
            enum: ['policies', 'decisions', 'lessons', 'knowledge'],
            description: 'For org scope: filter by category',
          },
        },
        required: ['scope'],
      },
    },
    permission: 'always',

    async execute(args) {
      const scope = args.scope as string;

      if (scope === 'personal') {
        const key = args.key as string | undefined;
        if (key) {
          const fact = deps.personalMemory.getFact(deps.personaId, key);
          if (!fact) return JSON.stringify({ found: false, key });
          return JSON.stringify({ found: true, key: fact.key, value: fact.value });
        }
        const facts = deps.personalMemory.listFacts(deps.personaId);
        return JSON.stringify({ facts: facts.map((f) => ({ key: f.key, value: f.value })) });
      }

      if (scope === 'org') {
        const query = args.query as string | undefined;
        const category = args.category as string | undefined;

        if (query) {
          const results = deps.orgMemory.search(query, category);
          return JSON.stringify({
            results: results.map((r) => ({
              id: r.id,
              category: r.category,
              title: r.title,
              tags: r.tags,
              snippet: r.content.slice(0, 200),
            })),
          });
        }

        // No query — list entries filtered by access
        if (deps.orgMemoryAccess.length > 0) {
          const entries = deps.orgMemory.listByAccess(deps.orgMemoryAccess);
          const filtered = category ? entries.filter((e) => e.category === category) : entries;
          return JSON.stringify({
            entries: filtered.map((e) => ({
              id: e.id,
              category: e.category,
              title: e.title,
              tags: e.tags,
            })),
          });
        }

        // Fallback: list by category
        const entries = deps.orgMemory.list(category);
        return JSON.stringify({
          entries: entries.map((e) => ({
            id: e.id,
            category: e.category,
            title: e.title,
            tags: e.tags,
          })),
        });
      }

      return JSON.stringify({ error: 'Invalid scope. Use "personal" or "org".' });
    },
  };
}

import type { Tool } from '../types.js';
import type { MemoryToolDeps } from './memory-types.js';

export function createKnowledgeSearchTool(deps: MemoryToolDeps): Tool {
  return {
    definition: {
      name: 'knowledge_search',
      description:
        'Search the personal knowledge base for documents. Returns matching documents with title and content snippet.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search keyword to find relevant documents',
          },
        },
        required: ['query'],
      },
    },
    permission: 'always',

    async execute(args) {
      const query = args.query as string;
      if (!query) {
        return JSON.stringify({ error: 'Search requires a "query" parameter' });
      }

      const results = deps.knowledgeBase.search(query, deps.personaId);
      return JSON.stringify({
        results: results.map((doc) => ({
          id: doc.id,
          title: doc.title,
          tags: doc.tags,
          source: doc.source,
          snippet: doc.content.slice(0, 300),
        })),
      });
    },
  };
}

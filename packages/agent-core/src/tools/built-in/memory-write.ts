import type { Tool } from '../types.js';
import type { MemoryToolDeps } from './memory-types.js';

export function createMemoryWriteTool(deps: MemoryToolDeps): Tool {
  return {
    definition: {
      name: 'memory_write',
      description:
        'Write to memory. Use scope="personal" to save a user preference/fact (requires "key" and "value"). Use scope="org" to create an organization memory entry (requires "category", "title", "content").',
      parameters: {
        type: 'object',
        properties: {
          scope: {
            type: 'string',
            enum: ['personal', 'org'],
            description: 'Whether to write to personal memory or organization memory',
          },
          key: {
            type: 'string',
            description: 'For personal scope: the fact key',
          },
          value: {
            type: 'string',
            description: 'For personal scope: the fact value',
          },
          category: {
            type: 'string',
            enum: ['policies', 'decisions', 'lessons', 'knowledge'],
            description: 'For org scope: entry category',
          },
          title: {
            type: 'string',
            description: 'For org scope: entry title',
          },
          content: {
            type: 'string',
            description: 'For org scope: entry content (markdown)',
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'For org scope: entry tags',
          },
        },
        required: ['scope'],
      },
    },
    permission: 'ask',

    async execute(args) {
      const scope = args.scope as string;

      if (scope === 'personal') {
        const key = args.key as string | undefined;
        const value = args.value as string | undefined;
        if (!key || !value) {
          return JSON.stringify({ error: 'Personal memory write requires "key" and "value"' });
        }
        const fact = deps.personalMemory.setFact(deps.personaId, key, value);
        return JSON.stringify({ saved: true, key: fact.key, value: fact.value });
      }

      if (scope === 'org') {
        const category = args.category as 'policies' | 'decisions' | 'lessons' | 'knowledge' | undefined;
        const title = args.title as string | undefined;
        const content = args.content as string | undefined;
        const tags = (args.tags as string[] | undefined) ?? [];

        if (!category || !title || !content) {
          return JSON.stringify({ error: 'Org memory write requires "category", "title", and "content"' });
        }

        const entry = deps.orgMemory.create({
          category,
          title,
          content,
          tags,
          createdBy: deps.personaId,
        });

        return JSON.stringify({ saved: true, id: entry.id, title: entry.title, category: entry.category });
      }

      return JSON.stringify({ error: 'Invalid scope. Use "personal" or "org".' });
    },
  };
}

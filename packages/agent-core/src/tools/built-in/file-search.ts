import { Glob } from 'bun';
import { resolve } from 'node:path';
import type { Tool } from '../types.js';

const MAX_RESULTS = 100;

export const fileSearchTool: Tool = {
  definition: {
    name: 'file_search',
    description: 'Search for files matching a glob pattern. Returns a list of matching file paths.',
    parameters: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'Glob pattern to match files (e.g., "**/*.ts", "src/*.json")',
        },
        directory: {
          type: 'string',
          description: 'Base directory to search in (defaults to current working directory)',
        },
      },
      required: ['pattern'],
    },
  },
  permission: 'always',
  async execute(args) {
    const pattern = args.pattern as string;
    const directory = resolve((args.directory as string) || process.cwd());
    const glob = new Glob(pattern);
    const matches: string[] = [];

    for await (const path of glob.scan({ cwd: directory, absolute: true })) {
      matches.push(path);
      if (matches.length >= MAX_RESULTS) break;
    }

    if (matches.length === 0) {
      return 'No files found matching the pattern.';
    }

    return matches.join('\n');
  },
};

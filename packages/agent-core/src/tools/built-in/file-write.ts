import { writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import type { Tool } from '../types.js';

export const fileWriteTool: Tool = {
  definition: {
    name: 'file_write',
    description: 'Write content to a file at the given path. Creates parent directories if they do not exist. Overwrites existing files.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The absolute or relative path to the file to write',
        },
        content: {
          type: 'string',
          description: 'The content to write to the file',
        },
      },
      required: ['path', 'content'],
    },
  },
  permission: 'ask',
  async execute(args) {
    const path = resolve(args.path as string);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, args.content as string, 'utf-8');
    return `File written successfully: ${path}`;
  },
};

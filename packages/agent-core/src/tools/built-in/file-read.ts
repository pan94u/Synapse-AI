import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Tool } from '../types.js';

const MAX_SIZE = 100 * 1024; // 100KB

export const fileReadTool: Tool = {
  definition: {
    name: 'file_read',
    description: 'Read the contents of a file at the given path. Returns the file content as text. Maximum file size is 100KB.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The absolute or relative path to the file to read',
        },
      },
      required: ['path'],
    },
  },
  permission: 'always',
  async execute(args) {
    const path = resolve(args.path as string);
    const stat = await Bun.file(path).size;
    if (stat > MAX_SIZE) {
      throw new Error(`File size ${stat} bytes exceeds maximum ${MAX_SIZE} bytes`);
    }
    const content = await readFile(path, 'utf-8');
    return content;
  },
};

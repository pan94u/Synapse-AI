import type { ToolRegistry } from '../registry.js';
import { fileReadTool } from './file-read.js';
import { fileWriteTool } from './file-write.js';
import { fileSearchTool } from './file-search.js';
import { shellExecTool } from './shell-exec.js';
import { webFetchTool } from './web-fetch.js';

export function registerBuiltInTools(registry: ToolRegistry): void {
  registry.register(fileReadTool);
  registry.register(fileWriteTool);
  registry.register(fileSearchTool);
  registry.register(shellExecTool);
  registry.register(webFetchTool);
}

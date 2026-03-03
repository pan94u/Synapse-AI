import type { ToolRegistry } from '../registry.js';
import { fileReadTool } from './file-read.js';
import { fileWriteTool } from './file-write.js';
import { fileSearchTool } from './file-search.js';
import { shellExecTool } from './shell-exec.js';
import { webFetchTool } from './web-fetch.js';
import { createMemoryReadTool } from './memory-read.js';
import { createMemoryWriteTool } from './memory-write.js';
import { createKnowledgeSearchTool } from './knowledge-search.js';
import { createSkillExecuteTool } from './skill-execute.js';
import type { MemoryToolDeps } from './memory-types.js';
import type { SkillToolDeps } from './skill-execute.js';

export type { MemoryToolDeps } from './memory-types.js';
export type { SkillToolDeps } from './skill-execute.js';

export function registerBuiltInTools(registry: ToolRegistry): void {
  registry.register(fileReadTool);
  registry.register(fileWriteTool);
  registry.register(fileSearchTool);
  registry.register(shellExecTool);
  registry.register(webFetchTool);
}

/** Register memory-related tools (memory_read, memory_write, knowledge_search) */
export function registerMemoryTools(registry: ToolRegistry, deps: MemoryToolDeps): void {
  registry.register(createMemoryReadTool(deps));
  registry.register(createMemoryWriteTool(deps));
  registry.register(createKnowledgeSearchTool(deps));
}

/** Register skill_execute tool */
export function registerSkillTool(registry: ToolRegistry, deps: SkillToolDeps): void {
  registry.register(createSkillExecuteTool(deps));
}

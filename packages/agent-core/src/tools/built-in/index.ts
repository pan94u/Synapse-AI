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
import { createBrowserNavigateTool } from './browser-navigate.js';
import { createBrowserClickTool } from './browser-click.js';
import { createBrowserFillTool } from './browser-fill.js';
import { createBrowserScreenshotTool } from './browser-screenshot.js';
import { createBrowserExtractTool } from './browser-extract.js';
import { createBrowserEvaluateTool } from './browser-evaluate.js';
import { createBrowserWaitTool } from './browser-wait.js';
import type { MemoryToolDeps } from './memory-types.js';
import type { SkillToolDeps } from './skill-execute.js';
import type { BrowserToolDeps } from './browser-types.js';

export type { MemoryToolDeps } from './memory-types.js';
export type { SkillToolDeps } from './skill-execute.js';
export type { BrowserToolDeps } from './browser-types.js';

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

/** Register browser automation tools (navigate, click, fill, screenshot, extract, evaluate, wait) */
export function registerBrowserTools(registry: ToolRegistry, deps: BrowserToolDeps): void {
  registry.register(createBrowserNavigateTool(deps));
  registry.register(createBrowserClickTool(deps));
  registry.register(createBrowserFillTool(deps));
  registry.register(createBrowserScreenshotTool(deps));
  registry.register(createBrowserExtractTool(deps));
  registry.register(createBrowserEvaluateTool(deps));
  registry.register(createBrowserWaitTool(deps));
}

import type { ModelConfig, ToolDefinition, ToolPermission, PersonaContext } from '@synapse/shared';
import { MiniMaxProvider } from './models/provider-minimax.js';
import { ClaudeProvider } from './models/provider-claude.js';
import { ModelRouter } from './models/router.js';
import { ToolRegistry } from './tools/registry.js';
import { ToolExecutor } from './tools/executor.js';
import { registerBuiltInTools, registerMemoryTools, registerSkillTool, registerBrowserTools } from './tools/built-in/index.js';
import { Agent } from './agent/agent.js';
import type { Tool } from './tools/types.js';
import type { MemoryToolDeps } from './tools/built-in/memory-types.js';

// Models
export { ModelRouter } from './models/router.js';
export { MiniMaxProvider } from './models/provider-minimax.js';
export { ClaudeProvider } from './models/provider-claude.js';
export type { ModelProvider, CompletionParams, CompletionResult, StreamChunk } from './models/types.js';

// Tools
export { ToolRegistry } from './tools/registry.js';
export { ToolExecutor } from './tools/executor.js';
export type { ComplianceHooks } from './tools/executor.js';
export { registerBuiltInTools, registerMemoryTools, registerSkillTool, registerBrowserTools } from './tools/built-in/index.js';
export type { MemoryToolDeps, SkillToolDeps, BrowserToolDeps } from './tools/built-in/index.js';
export type { Tool } from './tools/types.js';
export { createMemoryReadTool } from './tools/built-in/memory-read.js';
export { createMemoryWriteTool } from './tools/built-in/memory-write.js';
export { createKnowledgeSearchTool } from './tools/built-in/knowledge-search.js';
export { createSkillExecuteTool } from './tools/built-in/skill-execute.js';

// Agent
export { Agent } from './agent/agent.js';
export type { AgentConfig, AgentResult, AgentStreamEvent } from './agent/types.js';

export function createDefaultRouter(): ModelRouter {
  const router = new ModelRouter('MiniMax-M2.5');

  const minimaxKey = process.env.MINIMAX_API_KEY;
  if (minimaxKey) {
    const provider = new MiniMaxProvider(minimaxKey);
    const models: ModelConfig[] = [
      {
        provider: 'minimax',
        modelId: 'MiniMax-M2.5',
        displayName: 'MiniMax M2.5',
        costTier: 1,
        qualityTier: 3,
        maxContextTokens: 1000000,
      },
      {
        provider: 'minimax',
        modelId: 'MiniMax-M1',
        displayName: 'MiniMax M1',
        costTier: 1,
        qualityTier: 2,
        maxContextTokens: 1000000,
      },
    ];
    router.registerProvider(provider, models);
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    const provider = new ClaudeProvider(anthropicKey);
    const models: ModelConfig[] = [
      {
        provider: 'claude',
        modelId: 'claude-sonnet-4-20250514',
        displayName: 'Claude Sonnet 4',
        costTier: 3,
        qualityTier: 4,
        maxContextTokens: 200000,
      },
      {
        provider: 'claude',
        modelId: 'claude-opus-4-20250514',
        displayName: 'Claude Opus 4',
        costTier: 5,
        qualityTier: 5,
        maxContextTokens: 200000,
      },
    ];
    router.registerProvider(provider, models);
  }

  return router;
}

/**
 * Create a fully configured Agent with default router and built-in tools.
 */
export function createDefaultAgent(): Agent {
  const router = createDefaultRouter();
  const registry = new ToolRegistry();
  registerBuiltInTools(registry);
  const executor = new ToolExecutor(registry);

  return new Agent({ router, registry, executor });
}

/**
 * MCP tool adapter interface — matches Tool but avoids importing @synapse/mcp-hub.
 */
export interface MCPToolAdapter {
  definition: ToolDefinition;
  permission: ToolPermission;
  execute(args: Record<string, unknown>): Promise<string>;
}

/**
 * Create an Agent with default router, built-in tools, and additional MCP tools.
 */
export function createAgentWithMCP(mcpTools: MCPToolAdapter[]): Agent {
  const router = createDefaultRouter();
  const registry = new ToolRegistry();
  registerBuiltInTools(registry);

  // Register MCP tools as standard Tool adapters
  for (const mcpTool of mcpTools) {
    registry.register(mcpTool as Tool);
  }

  const executor = new ToolExecutor(registry);

  return new Agent({ router, registry, executor });
}

/**
 * Options for creating an Agent with persona context and compliance hooks.
 */
export interface AgentWithComplianceOptions {
  mcpTools?: MCPToolAdapter[];
  personaContext?: PersonaContext;
  complianceHooks?: import('./tools/executor.js').ComplianceHooks;
  memoryToolDeps?: MemoryToolDeps;
  skillToolDeps?: import('./tools/built-in/skill-execute.js').SkillToolDeps;
  browserToolDeps?: import('./tools/built-in/browser-types.js').BrowserToolDeps;
}

/**
 * Create an Agent with default router, built-in tools, optional MCP tools,
 * persona context, compliance pre/post hooks, and optional memory tools.
 */
export function createAgentWithCompliance(options: AgentWithComplianceOptions): Agent {
  const router = createDefaultRouter();
  const registry = new ToolRegistry();
  registerBuiltInTools(registry);

  if (options.mcpTools) {
    for (const mcpTool of options.mcpTools) {
      registry.register(mcpTool as Tool);
    }
  }

  if (options.memoryToolDeps) {
    registerMemoryTools(registry, options.memoryToolDeps);
  }

  if (options.skillToolDeps) {
    registerSkillTool(registry, options.skillToolDeps);
  }

  if (options.browserToolDeps) {
    registerBrowserTools(registry, options.browserToolDeps);
  }

  const executor = new ToolExecutor(
    registry,
    options.complianceHooks,
    options.personaContext?.personaId,
  );

  return new Agent({
    router,
    registry,
    executor,
    personaContext: options.personaContext,
  });
}

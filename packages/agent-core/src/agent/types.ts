import type { ChatMessage, TokenUsage, ToolCall, ToolResult, PersonaContext } from '@synapse/shared';
import type { ModelRouter } from '../models/router.js';
import type { ToolRegistry } from '../tools/registry.js';
import type { ToolExecutor } from '../tools/executor.js';

export interface AgentConfig {
  router: ModelRouter;
  registry: ToolRegistry;
  executor: ToolExecutor;
  maxIterations?: number; // default 10
  personaContext?: PersonaContext;
}

export type AgentStreamEvent =
  | { type: 'text'; content: string; thinking?: string }
  | { type: 'tool_call'; call: ToolCall }
  | { type: 'tool_result'; result: ToolResult }
  | { type: 'done'; message: ChatMessage; model: string; usage?: TokenUsage };

export interface AgentResult {
  message: ChatMessage;
  model: string;
  usage?: TokenUsage;
  toolCallsExecuted: number;
}

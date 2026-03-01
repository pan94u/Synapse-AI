import type { ToolCall, ToolResult } from '@synapse/shared';
import type { ToolRegistry } from './registry.js';

export class ToolExecutor {
  private registry: ToolRegistry;

  constructor(registry: ToolRegistry) {
    this.registry = registry;
  }

  async execute(call: ToolCall): Promise<ToolResult> {
    const tool = this.registry.get(call.name);
    if (!tool) {
      return {
        callId: call.id,
        name: call.name,
        content: `Error: Tool "${call.name}" not found`,
        isError: true,
      };
    }

    const permission = this.registry.getPermission(call.name);
    if (permission === 'deny') {
      return {
        callId: call.id,
        name: call.name,
        content: `Error: Tool "${call.name}" is denied`,
        isError: true,
      };
    }

    // Phase 2: 'ask' is treated as 'always' (compliance engine in Phase 4)
    try {
      const content = await tool.execute(call.arguments);
      return {
        callId: call.id,
        name: call.name,
        content,
      };
    } catch (err) {
      return {
        callId: call.id,
        name: call.name,
        content: `Error: ${err instanceof Error ? err.message : String(err)}`,
        isError: true,
      };
    }
  }

  async executeBatch(calls: ToolCall[]): Promise<ToolResult[]> {
    return Promise.all(calls.map((call) => this.execute(call)));
  }
}

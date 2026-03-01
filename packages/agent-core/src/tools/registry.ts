import type { ToolDefinition, ToolPermission } from '@synapse/shared';
import type { Tool } from './types.js';

export class ToolRegistry {
  private tools = new Map<string, Tool>();

  register(tool: Tool): void {
    this.tools.set(tool.definition.name, tool);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  list(): ToolDefinition[] {
    return Array.from(this.tools.values()).map((t) => t.definition);
  }

  getPermission(name: string): ToolPermission {
    return this.tools.get(name)?.permission ?? 'deny';
  }
}

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

  listForPersona(allowedTools: string[]): ToolDefinition[] {
    if (!allowedTools || allowedTools.length === 0) return this.list();
    return this.list().filter((t) =>
      allowedTools.some((pattern) => {
        if (pattern === '*') return true;
        if (pattern.endsWith('*')) return t.name.startsWith(pattern.slice(0, -1));
        return pattern === t.name;
      }),
    );
  }
}

import type { ToolDefinition, ToolPermission } from '@synapse/shared';
import type { MCPRegistry } from './registry.js';
import type { MCPRateLimiter } from './rate-limiter.js';
import type { MCPAuditLogger } from './audit.js';

/**
 * Tool interface compatible with agent-core's Tool type.
 * Duplicated here to avoid circular dependency on @synapse/agent-core.
 */
export interface AgentTool {
  definition: ToolDefinition;
  permission: ToolPermission;
  execute(args: Record<string, unknown>): Promise<string>;
}

export class MCPAggregator {
  private registry: MCPRegistry;
  private rateLimiter: MCPRateLimiter;
  private auditLogger: MCPAuditLogger;

  constructor(
    registry: MCPRegistry,
    rateLimiter: MCPRateLimiter,
    auditLogger: MCPAuditLogger,
  ) {
    this.registry = registry;
    this.rateLimiter = rateLimiter;
    this.auditLogger = auditLogger;
  }

  /**
   * Return all MCP tools wrapped as agent-core Tool adapters.
   */
  async getTools(): Promise<AgentTool[]> {
    const tools: AgentTool[] = [];

    for (const instance of this.registry.list()) {
      if (instance.state !== 'connected' || !instance.client) continue;

      const serverId = instance.config.id;

      // Get full tool schemas from the MCP server
      let toolSchemas: Array<{ name: string; description: string; inputSchema: Record<string, unknown> }>;
      try {
        toolSchemas = await instance.client.listToolsWithSchemas();
      } catch {
        console.warn(`[mcp-hub] Failed to list tools for server "${serverId}"`);
        continue;
      }

      for (const schema of toolSchemas) {
        const toolName = schema.name;
        const prefixedName = `${serverId}_${toolName}`;
        const requireApproval = instance.config.permissions.requireApproval.some(
          (pattern) => {
            if (pattern.endsWith('*')) {
              return toolName.startsWith(pattern.slice(0, -1));
            }
            return toolName === pattern;
          },
        );

        const client = instance.client;
        const rateLimiter = this.rateLimiter;
        const auditLogger = this.auditLogger;

        tools.push({
          definition: {
            name: prefixedName,
            description: `[${instance.config.name}] ${schema.description}`,
            parameters: schema.inputSchema,
          },
          permission: requireApproval ? 'ask' : 'always',
          execute: async (args: Record<string, unknown>): Promise<string> => {
            if (!rateLimiter.tryAcquire(serverId)) {
              throw new Error(`Rate limit exceeded for server "${serverId}"`);
            }

            const start = Date.now();
            try {
              const result = await client.callTool(toolName, args);
              const latency = Date.now() - start;

              auditLogger.log({
                serverId,
                action: 'tool_call',
                target: toolName,
                input: args,
                output: { success: true, summary: result.slice(0, 200) },
                latencyMs: latency,
              });

              return result;
            } catch (err) {
              const latency = Date.now() - start;
              const message = err instanceof Error ? err.message : 'Unknown error';

              auditLogger.log({
                serverId,
                action: 'tool_call',
                target: toolName,
                input: args,
                output: { success: false, summary: message },
                latencyMs: latency,
              });

              throw err;
            }
          },
        });
      }
    }

    return tools;
  }

  async refreshTools(serverId: string): Promise<void> {
    const instance = this.registry.get(serverId);
    if (!instance?.client) return;

    try {
      instance.tools = await instance.client.refreshTools();
    } catch (err) {
      console.warn(`[mcp-hub] Failed to refresh tools for server "${serverId}":`, err);
    }
  }
}

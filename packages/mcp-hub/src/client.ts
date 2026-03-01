import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { MCPServerConfig, MCPToolInfo, MCPMetrics } from '@synapse/shared';

export class MCPClient {
  private client: Client;
  private transport?: StdioClientTransport;
  private config: MCPServerConfig;
  private connected = false;
  private cachedTools: MCPToolInfo[] = [];
  private metrics: MCPMetrics = {
    totalCalls: 0,
    successCalls: 0,
    avgLatencyMs: 0,
  };

  constructor(config: MCPServerConfig) {
    this.config = config;
    this.client = new Client(
      { name: `synapse-hub-${config.id}`, version: '0.1.0' },
      { capabilities: {} },
    );
  }

  async connect(): Promise<void> {
    if (this.config.transport !== 'stdio') {
      throw new Error(`Transport "${this.config.transport}" not yet supported`);
    }

    if (!this.config.command) {
      throw new Error(`No command specified for server "${this.config.id}"`);
    }

    this.transport = new StdioClientTransport({
      command: this.config.command,
      args: this.config.args,
      env: {
        ...process.env as Record<string, string>,
        ...this.config.env,
      },
    });

    await this.client.connect(this.transport);
    this.connected = true;

    // Cache initial tool list
    await this.refreshTools();
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      try {
        await this.client.close();
      } catch {
        // Ignore close errors
      }
      this.connected = false;
    }
  }

  async refreshTools(): Promise<MCPToolInfo[]> {
    const result = await this.client.listTools();
    this.cachedTools = result.tools.map((tool) => ({
      name: tool.name,
      description: tool.description ?? '',
      serverId: this.config.id,
      requireApproval: this.isRequireApproval(tool.name),
    }));
    return this.cachedTools;
  }

  getTools(): MCPToolInfo[] {
    return this.cachedTools;
  }

  getToolSchemas(): Array<{ name: string; description: string; inputSchema: Record<string, unknown> }> {
    // We need to re-fetch full schemas; for now return from cache
    return [];
  }

  async listToolsWithSchemas(): Promise<Array<{ name: string; description: string; inputSchema: Record<string, unknown> }>> {
    const result = await this.client.listTools();
    return result.tools.map((tool) => ({
      name: tool.name,
      description: tool.description ?? '',
      inputSchema: (tool.inputSchema ?? {}) as Record<string, unknown>,
    }));
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<string> {
    this.metrics.totalCalls++;
    const start = Date.now();

    try {
      const result = await this.client.callTool({ name, arguments: args });
      const latency = Date.now() - start;

      this.metrics.successCalls++;
      this.metrics.lastCallAt = new Date().toISOString();
      // Running average
      this.metrics.avgLatencyMs =
        (this.metrics.avgLatencyMs * (this.metrics.successCalls - 1) + latency) /
        this.metrics.successCalls;

      // Extract text content from result
      const content = result.content;
      if (Array.isArray(content)) {
        return content
          .map((c) => {
            if (typeof c === 'object' && c !== null && 'text' in c) {
              return (c as { text: string }).text;
            }
            return JSON.stringify(c);
          })
          .join('\n');
      }
      return typeof content === 'string' ? content : JSON.stringify(content);
    } catch (err) {
      const latency = Date.now() - start;
      this.metrics.lastCallAt = new Date().toISOString();
      // Still update avg latency for error calls
      this.metrics.avgLatencyMs =
        (this.metrics.avgLatencyMs * (this.metrics.totalCalls - 1) + latency) /
        this.metrics.totalCalls;

      throw err;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  getMetrics(): MCPMetrics {
    return { ...this.metrics };
  }

  private isRequireApproval(toolName: string): boolean {
    return this.config.permissions.requireApproval.some((pattern) => {
      if (pattern.endsWith('*')) {
        return toolName.startsWith(pattern.slice(0, -1));
      }
      return toolName === pattern;
    });
  }
}

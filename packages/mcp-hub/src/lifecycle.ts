import type { MCPRegistry } from './registry.js';
import { MCPClient } from './client.js';

export class MCPLifecycle {
  private registry: MCPRegistry;

  constructor(registry: MCPRegistry) {
    this.registry = registry;
  }

  async startServer(id: string): Promise<void> {
    const instance = this.registry.get(id);
    if (!instance) {
      throw new Error(`Server "${id}" not registered`);
    }

    if (instance.state === 'connected') {
      return; // Already running
    }

    this.registry.updateState(id, 'starting');

    try {
      const client = new MCPClient(instance.config);
      await client.connect();

      instance.client = client;
      instance.state = 'connected';
      instance.connectedAt = new Date();
      instance.error = undefined;
      instance.reconnectAttempts = 0;

      // Cache discovered tools
      instance.tools = client.getTools();

      console.log(`[mcp-hub] Server "${id}" connected with ${instance.tools.length} tools`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      instance.state = 'error';
      instance.error = message;
      console.error(`[mcp-hub] Failed to start server "${id}":`, message);
      throw err;
    }
  }

  async stopServer(id: string): Promise<void> {
    const instance = this.registry.get(id);
    if (!instance) {
      throw new Error(`Server "${id}" not registered`);
    }

    if (instance.client) {
      await instance.client.disconnect();
      instance.client = undefined;
    }

    instance.state = 'stopped';
    instance.tools = [];
    console.log(`[mcp-hub] Server "${id}" stopped`);
  }

  async restartServer(id: string): Promise<void> {
    await this.stopServer(id);
    await this.startServer(id);
  }

  async startAll(): Promise<void> {
    const servers = this.registry.list().filter((s) => s.config.autoStart);
    const results = await Promise.allSettled(
      servers.map((s) => this.startServer(s.config.id)),
    );

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'rejected') {
        console.error(
          `[mcp-hub] Failed to auto-start "${servers[i].config.id}":`,
          result.reason,
        );
      }
    }
  }

  async stopAll(): Promise<void> {
    const servers = this.registry.list().filter(
      (s) => s.state === 'connected' || s.state === 'starting',
    );
    await Promise.allSettled(
      servers.map((s) => this.stopServer(s.config.id)),
    );
  }
}

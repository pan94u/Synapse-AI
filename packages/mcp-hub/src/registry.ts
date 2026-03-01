import type { MCPServerConfig } from '@synapse/shared';
import type { MCPServerInstance, MCPServerState } from './types.js';
import { createInitialInstance } from './types.js';

export class MCPRegistry {
  private servers = new Map<string, MCPServerInstance>();

  register(config: MCPServerConfig): void {
    this.servers.set(config.id, createInitialInstance(config));
  }

  unregister(id: string): void {
    this.servers.delete(id);
  }

  get(id: string): MCPServerInstance | undefined {
    return this.servers.get(id);
  }

  list(): MCPServerInstance[] {
    return Array.from(this.servers.values());
  }

  getByStatus(status: MCPServerState): MCPServerInstance[] {
    return this.list().filter((s) => s.state === status);
  }

  updateState(id: string, state: MCPServerState, error?: string): void {
    const instance = this.servers.get(id);
    if (instance) {
      instance.state = state;
      instance.error = error;
    }
  }
}

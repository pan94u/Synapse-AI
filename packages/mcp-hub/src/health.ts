import type { MCPRegistry } from './registry.js';
import type { MCPLifecycle } from './lifecycle.js';

const MAX_BACKOFF_MS = 30_000;

export class MCPHealthMonitor {
  private registry: MCPRegistry;
  private lifecycle: MCPLifecycle;
  private timers = new Map<string, ReturnType<typeof setInterval>>();
  private running = false;

  constructor(registry: MCPRegistry, lifecycle: MCPLifecycle) {
    this.registry = registry;
    this.lifecycle = lifecycle;
  }

  start(): void {
    if (this.running) return;
    this.running = true;

    for (const instance of this.registry.list()) {
      if (instance.state === 'connected') {
        this.scheduleHealthCheck(instance.config.id);
      }
    }
  }

  stop(): void {
    this.running = false;
    for (const timer of this.timers.values()) {
      clearInterval(timer);
    }
    this.timers.clear();
  }

  scheduleHealthCheck(serverId: string): void {
    // Clear existing timer for this server
    const existing = this.timers.get(serverId);
    if (existing) clearInterval(existing);

    const instance = this.registry.get(serverId);
    if (!instance) return;

    const interval = instance.config.healthCheck.interval;
    const timer = setInterval(() => {
      this.checkServer(serverId).catch(() => {
        // Errors handled internally
      });
    }, interval);

    this.timers.set(serverId, timer);
  }

  stopHealthCheck(serverId: string): void {
    const timer = this.timers.get(serverId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(serverId);
    }
  }

  async checkServer(id: string): Promise<boolean> {
    const instance = this.registry.get(id);
    if (!instance || !instance.client) return false;

    try {
      // Ping by listing tools (lightweight operation)
      await instance.client.refreshTools();
      instance.lastHealthCheck = new Date();
      instance.reconnectAttempts = 0;

      if (instance.state !== 'connected') {
        instance.state = 'connected';
        instance.error = undefined;
      }
      return true;
    } catch {
      instance.lastHealthCheck = new Date();
      instance.reconnectAttempts++;

      const maxRetries = instance.config.healthCheck.retries;
      if (instance.reconnectAttempts >= maxRetries) {
        this.registry.updateState(id, 'error', `Health check failed after ${maxRetries} retries`);
        this.stopHealthCheck(id);
        console.error(`[mcp-hub] Server "${id}" marked as error after ${maxRetries} failed health checks`);
        return false;
      }

      // Attempt reconnect with exponential backoff
      const backoff = Math.min(
        1000 * Math.pow(2, instance.reconnectAttempts - 1),
        MAX_BACKOFF_MS,
      );
      console.warn(
        `[mcp-hub] Server "${id}" health check failed (attempt ${instance.reconnectAttempts}/${maxRetries}), retrying in ${backoff}ms`,
      );

      setTimeout(async () => {
        try {
          await this.lifecycle.restartServer(id);
          this.scheduleHealthCheck(id);
        } catch {
          // Will be handled by next health check cycle
        }
      }, backoff);

      return false;
    }
  }
}

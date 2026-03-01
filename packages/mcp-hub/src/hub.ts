import { join } from 'node:path';
import type { MCPServerStatus, MCPAuditEntry } from '@synapse/shared';
import { loadServerConfigs } from './config.js';
import { MCPRegistry } from './registry.js';
import { MCPLifecycle } from './lifecycle.js';
import { MCPHealthMonitor } from './health.js';
import { MCPRateLimiter } from './rate-limiter.js';
import { MCPAuditLogger } from './audit.js';
import { MCPAggregator, type AgentTool } from './aggregator.js';
import { instanceToStatus } from './types.js';

export class MCPHub {
  private configDir: string;
  private registry: MCPRegistry;
  private lifecycle: MCPLifecycle;
  private healthMonitor: MCPHealthMonitor;
  private rateLimiter: MCPRateLimiter;
  private auditLogger: MCPAuditLogger;
  private aggregator: MCPAggregator;
  private started = false;

  constructor(configDir?: string) {
    this.configDir = configDir ?? join(process.cwd(), 'config', 'mcp-servers');
    this.registry = new MCPRegistry();
    this.lifecycle = new MCPLifecycle(this.registry);
    this.healthMonitor = new MCPHealthMonitor(this.registry, this.lifecycle);
    this.rateLimiter = new MCPRateLimiter();
    this.auditLogger = new MCPAuditLogger();
    this.aggregator = new MCPAggregator(
      this.registry,
      this.rateLimiter,
      this.auditLogger,
    );
  }

  async start(): Promise<void> {
    if (this.started) return;

    console.log(`[mcp-hub] Loading configs from ${this.configDir}`);

    // 1. Load configurations
    const configs = await loadServerConfigs(this.configDir);
    console.log(`[mcp-hub] Found ${configs.length} enabled server(s)`);

    // 2. Register servers
    for (const config of configs) {
      this.registry.register(config);
      this.rateLimiter.configure(config.id, config.rateLimit);
    }

    // 3. Start autoStart servers
    await this.lifecycle.startAll();

    // 4. Start health monitoring for connected servers
    this.healthMonitor.start();

    this.started = true;
    console.log('[mcp-hub] Hub started');
  }

  async stop(): Promise<void> {
    if (!this.started) return;

    this.healthMonitor.stop();
    await this.lifecycle.stopAll();
    this.started = false;
    console.log('[mcp-hub] Hub stopped');
  }

  async getTools(): Promise<AgentTool[]> {
    return this.aggregator.getTools();
  }

  getServerStatus(): MCPServerStatus[] {
    return this.registry.list().map(instanceToStatus);
  }

  getServerStatusById(id: string): MCPServerStatus | undefined {
    const instance = this.registry.get(id);
    return instance ? instanceToStatus(instance) : undefined;
  }

  async restartServer(id: string): Promise<void> {
    await this.lifecycle.restartServer(id);
    this.healthMonitor.scheduleHealthCheck(id);
  }

  getAuditLog(filter?: {
    serverId?: string;
    limit?: number;
  }): MCPAuditEntry[] {
    if (filter?.serverId) {
      return this.auditLogger.query({ serverId: filter.serverId });
    }
    return this.auditLogger.getRecent(filter?.limit ?? 100);
  }
}

import type { MCPServerConfig, MCPServerStatus, MCPToolInfo, MCPMetrics } from '@synapse/shared';
import type { MCPClient } from './client.js';

export type MCPServerState =
  | 'registered'
  | 'starting'
  | 'connected'
  | 'error'
  | 'disconnected'
  | 'stopped';

export interface MCPServerInstance {
  config: MCPServerConfig;
  client?: MCPClient;
  state: MCPServerState;
  connectedAt?: Date;
  lastHealthCheck?: Date;
  error?: string;
  tools: MCPToolInfo[];
  metrics: MCPMetrics;
  reconnectAttempts: number;
}

export function createInitialInstance(config: MCPServerConfig): MCPServerInstance {
  return {
    config,
    state: 'registered',
    tools: [],
    metrics: { totalCalls: 0, successCalls: 0, avgLatencyMs: 0 },
    reconnectAttempts: 0,
  };
}

export function instanceToStatus(instance: MCPServerInstance): MCPServerStatus {
  return {
    id: instance.config.id,
    status: instance.state,
    connectedAt: instance.connectedAt?.toISOString(),
    lastHealthCheck: instance.lastHealthCheck?.toISOString(),
    error: instance.error,
    tools: instance.tools,
    metrics: instance.metrics,
  };
}

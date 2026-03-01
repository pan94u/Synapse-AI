export type MCPServerCategory =
  | 'infrastructure'
  | 'communication'
  | 'development'
  | 'hrm'
  | 'finance'
  | 'legal'
  | 'crm'
  | 'erp'
  | 'analytics'
  | 'document'
  | 'custom';

export interface MCPServerConfig {
  id: string;
  name: string;
  description: string;
  transport: 'stdio' | 'sse';
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
  enabled: boolean;
  autoStart: boolean;
  healthCheck: { interval: number; timeout: number; retries: number };
  rateLimit: { maxRequests: number; windowMs: number };
  permissions: {
    tools: string[];
    resources: string[];
    requireApproval: string[];
  };
  tags: string[];
  category: MCPServerCategory;
}

export interface MCPToolInfo {
  name: string;
  description: string;
  serverId: string;
  requireApproval: boolean;
}

export interface MCPMetrics {
  totalCalls: number;
  successCalls: number;
  avgLatencyMs: number;
  lastCallAt?: string;
}

export interface MCPServerStatus {
  id: string;
  status:
    | 'registered'
    | 'starting'
    | 'connected'
    | 'error'
    | 'disconnected'
    | 'stopped';
  connectedAt?: string;
  lastHealthCheck?: string;
  error?: string;
  tools: MCPToolInfo[];
  metrics: MCPMetrics;
}

export interface MCPAuditEntry {
  id: string;
  timestamp: string;
  serverId: string;
  action: string;
  target: string;
  input?: Record<string, unknown>;
  output?: { success: boolean; summary: string };
  latencyMs: number;
}

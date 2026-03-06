import type { MCPServerCategory, MCPServerConfig } from './mcp.js';

export type MCPListingStatus =
  | 'pending_review'
  | 'active'
  | 'deprecated'
  | 'suspended'
  | 'rejected';

/** MCP 市场条目 */
export interface MCPServerListing {
  // Static metadata
  id: string;
  name: string;
  description: string;
  category: MCPServerCategory;
  tags: string[];
  author: { id: string; name: string };
  version: string;
  transport: 'stdio' | 'sse';
  toolCount: number;
  toolNames: string[];
  serverConfig: MCPServerConfig;
  // Runtime (synced from MCPHub)
  uptimeRate: number;     // 0-1
  avgLatencyMs: number;
  errorRate: number;      // 0-1
  totalCalls: number;
  // Market data
  installs: number;
  rating: { average: number; count: number };
  status: MCPListingStatus;
  publishedAt: string;
  updatedAt: string;
}

/** 用户评价 */
export interface MCPServerReview {
  id: string;
  serverId: string;
  userId: string;
  userName: string;
  rating: number;   // 1-5
  comment: string;
  createdAt: string;
  updatedAt: string;
}

/** 安装记录 */
export interface MCPInstallRecord {
  serverId: string;
  version: string;
  installedAt: string;
}

/** 发布自动审核结果 */
export interface MCPPublishReviewResult {
  autoApprove: boolean;   // score >= 70
  score: number;          // 0-100
  checks: { name: string; pass: boolean; reason: string }[];
}

/** 质量检查结果 */
export interface MCPQualityCheckResult {
  serverId: string;
  action: 'none' | 'warn' | 'suspend' | 'deprecated';
  reasons: string[];
}

/** 排名分数 */
export interface MCPServerScore {
  serverId: string;
  score: number;
  breakdown: {
    reliability: number;
    performance: number;
    rating: number;
    recency: number;
  };
}

import type { SkillCategory } from './skill.js';

/** Marketplace 中发布的技能元数据 */
export interface MarketplaceSkill {
  id: string;                     // = skill name (kebab-case)
  name: string;
  version: string;                // semver
  author: { id: string; name: string };
  description: string;
  category: SkillCategory;
  tags: string[];
  downloads: number;
  rating: { average: number; count: number };
  successRate: number;
  publishedAt: string;
  updatedAt: string;
  size: number;                   // bytes (SKILL.md content length)
  dependencies: string[];
  compatibility: string;
  status: 'pending_review' | 'active' | 'deprecated' | 'suspended' | 'rejected';
  checksum: string;               // SHA256
  skillContent: string;           // 原始 SKILL.md 内容，安装时写入本地
}

/** 用户评价 */
export interface MarketplaceReview {
  id: string;
  skillId: string;
  userId: string;
  userName: string;
  rating: number;                 // 1-5
  comment: string;
  createdAt: string;
  updatedAt: string;
}

/** 安装记录 */
export interface InstallRecord {
  skillId: string;
  version: string;
  installedAt: string;
  updatedAt: string;
}

/** Marketplace 统计概览 */
export interface MarketplaceStats {
  totalPublished: number;
  totalInstalled: number;
  totalReviews: number;
  categoryCounts: Record<string, number>;
}

/** 发布自动审核结果 */
export interface PublishReviewResult {
  autoApprove: boolean;
  score: number;        // 0-100
  checks: { name: string; pass: boolean; reason: string }[];
}

/** 人工审核决定 */
export interface ReviewDecision {
  skillId: string;
  action: 'approve' | 'reject';
  reviewer: string;
  reason?: string;
  decidedAt: string;
}

/** 质量检查结果 */
export interface QualityCheckResult {
  skillId: string;
  action: 'none' | 'warn' | 'suspend' | 'deprecated';
  reasons: string[];
}

/** 发布输入 */
export interface PublishInput {
  skillId: string;                // 已存在的 custom/built-in skill name
  author: { id: string; name: string };
  tags?: string[];
  version?: string;
  dependencies?: string[];
  compatibility?: string;
}

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
  status: 'active' | 'deprecated' | 'suspended';
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

/** 质量检查结果 */
export interface QualityCheckResult {
  skillId: string;
  action: 'none' | 'warn' | 'suspend';
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

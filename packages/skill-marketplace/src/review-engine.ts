import type { SkillDefinition, MarketplaceSkill, QualityCheckResult } from '@synapse/shared';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Review Engine — 发布审核 + 质量管控
 */

/** 发布前审核: 校验技能是否满足 marketplace 发布要求 */
export function validateForPublish(skill: SkillDefinition): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 必填字段
  if (!skill.name) errors.push('Missing required field: name');
  if (!skill.description) errors.push('Missing required field: description');
  if (!skill.instructions || skill.instructions.trim().length === 0) {
    errors.push('Missing required field: instructions (SKILL.md body)');
  }
  if (!skill.category) errors.push('Missing required field: category');

  // Name 合法性 (kebab-case)
  if (skill.name) {
    const namePattern = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
    if (skill.name.length === 1) {
      if (!/^[a-z0-9]$/.test(skill.name)) {
        errors.push('Skill name must be lowercase alphanumeric with hyphens');
      }
    } else if (!namePattern.test(skill.name)) {
      errors.push('Skill name must be kebab-case (lowercase alphanumeric with hyphens, no leading/trailing hyphen)');
    }
    if (skill.name.length > 64) {
      errors.push('Skill name must be 64 characters or less');
    }
  }

  // Description 长度
  if (skill.description && skill.description.length > 1024) {
    warnings.push('Description exceeds 1024 characters, consider shortening');
  }

  // 安全检查: shell_exec + file_write 同时存在时警告
  if (skill.allowedTools.includes('shell_exec') && skill.allowedTools.includes('file_write')) {
    warnings.push('Skill uses both shell_exec and file_write — potential security risk');
  }

  // 技能状态检查
  if (skill.status === 'draft') {
    warnings.push('Skill is in draft status; consider setting to active before publishing');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/** 质量检查: 基于评分和执行数据判断是否需要下架或警告 */
export function qualityCheck(
  skill: MarketplaceSkill,
  executionStats?: { totalExecutions: number; failureCount: number },
): QualityCheckResult {
  const reasons: string[] = [];
  let action: QualityCheckResult['action'] = 'none';

  // 低评分 + 足够的评价数量 → suspend
  if (skill.rating.average < 2.0 && skill.rating.count >= 3) {
    action = 'suspend';
    reasons.push(`Low rating: ${skill.rating.average}/5 with ${skill.rating.count} reviews`);
  }

  // 高失败率 + 足够的执行数量 → suspend
  if (executionStats) {
    const failureRate =
      executionStats.totalExecutions > 0
        ? executionStats.failureCount / executionStats.totalExecutions
        : 0;
    if (failureRate > 0.5 && executionStats.totalExecutions >= 10) {
      action = 'suspend';
      reasons.push(
        `High failure rate: ${Math.round(failureRate * 100)}% (${executionStats.failureCount}/${executionStats.totalExecutions})`,
      );
    }
  }

  // 长时间无更新 → warn (stale)
  const daysSinceUpdate =
    (Date.now() - new Date(skill.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceUpdate >= 180) {
    if (action === 'none') action = 'warn';
    reasons.push(`Stale: no updates for ${Math.round(daysSinceUpdate)} days`);
  }

  return { skillId: skill.id, action, reasons };
}

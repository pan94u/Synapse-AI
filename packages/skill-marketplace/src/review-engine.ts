import type {
  SkillDefinition,
  MarketplaceSkill,
  QualityCheckResult,
  PublishReviewResult,
} from '@synapse/shared';

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

/**
 * 发布自动审核: 基于 4 个维度评分，决定是否自动上架
 *
 * | 维度           | 权重 | 自动通过条件                                    | 自动拒绝条件                   |
 * |----------------|------|------------------------------------------------|-------------------------------|
 * | 功能完整性 (30%)| 30   | instructions 包含"任务说明"+"执行步骤"+"输出格式" | instructions < 50 字           |
 * | 工具合理性 (25%)| 25   | allowedTools 1-10 个且无高危组合                 | 0 个工具或 >15 个             |
 * | 安全合规 (25%)  | 25   | 无 shell_exec+file_write 同时存在               | 仅含 shell_exec 且无描述       |
 * | 用户体验 (20%)  | 20   | description ≤200 字 + parameters 有 description | 无 description                 |
 */
export function publishReview(skill: SkillDefinition): PublishReviewResult {
  const checks: PublishReviewResult['checks'] = [];
  let totalScore = 0;

  // --- 1. 功能完整性 (30%) ---
  const instructions = skill.instructions || '';
  const hasTaskDesc = /任务说明|task\s*description/i.test(instructions);
  const hasSteps = /执行步骤|execution\s*steps/i.test(instructions);
  const hasOutputFormat = /输出格式|output\s*format/i.test(instructions);

  if (instructions.length < 50) {
    checks.push({ name: '功能完整性', pass: false, reason: 'instructions 不足 50 字' });
    // score: 0
  } else if (hasTaskDesc && hasSteps && hasOutputFormat) {
    checks.push({ name: '功能完整性', pass: true, reason: '包含任务说明、执行步骤、输出格式三个章节' });
    totalScore += 30;
  } else {
    const missing: string[] = [];
    if (!hasTaskDesc) missing.push('任务说明');
    if (!hasSteps) missing.push('执行步骤');
    if (!hasOutputFormat) missing.push('输出格式');
    checks.push({ name: '功能完整性', pass: false, reason: `缺少章节: ${missing.join(', ')}` });
    // Partial credit: 10 per section present
    const present = 3 - missing.length;
    totalScore += present * 10;
  }

  // --- 2. 工具合理性 (25%) ---
  const toolCount = skill.allowedTools.length;
  const hasHighRiskCombo =
    skill.allowedTools.includes('shell_exec') && skill.allowedTools.includes('file_write');

  if (toolCount === 0 || toolCount > 15) {
    checks.push({
      name: '工具合理性',
      pass: false,
      reason: toolCount === 0 ? '未声明任何工具' : `工具数量过多 (${toolCount} > 15)`,
    });
    // score: 0
  } else if (toolCount >= 1 && toolCount <= 10 && !hasHighRiskCombo) {
    checks.push({ name: '工具合理性', pass: true, reason: `${toolCount} 个工具，无高危组合` });
    totalScore += 25;
  } else {
    const reasons: string[] = [];
    if (toolCount > 10) reasons.push(`工具数量较多 (${toolCount})`);
    if (hasHighRiskCombo) reasons.push('存在 shell_exec+file_write 高危组合');
    checks.push({ name: '工具合理性', pass: false, reason: reasons.join('; ') });
    totalScore += 12; // partial
  }

  // --- 3. 安全合规 (25%) ---
  const onlyShellExec =
    skill.allowedTools.length === 1 && skill.allowedTools[0] === 'shell_exec';
  const hasShellAndFileWrite = hasHighRiskCombo;

  if (onlyShellExec && !skill.description) {
    checks.push({ name: '安全合规', pass: false, reason: '仅含 shell_exec 且无描述' });
    // score: 0
  } else if (!hasShellAndFileWrite) {
    checks.push({ name: '安全合规', pass: true, reason: '无 shell_exec+file_write 同时存在' });
    totalScore += 25;
  } else {
    checks.push({ name: '安全合规', pass: false, reason: 'shell_exec 与 file_write 同时存在，存在安全风险' });
    totalScore += 10; // partial
  }

  // --- 4. 用户体验 (20%) ---
  const descLen = (skill.description || '').length;
  const paramsHaveDesc = skill.parameters.length === 0 ||
    skill.parameters.every((p) => p.description && p.description.length > 0);

  if (!skill.description) {
    checks.push({ name: '用户体验', pass: false, reason: '缺少 description' });
    // score: 0
  } else if (descLen <= 200 && paramsHaveDesc) {
    checks.push({ name: '用户体验', pass: true, reason: 'description 简洁，参数描述完整' });
    totalScore += 20;
  } else {
    const reasons: string[] = [];
    if (descLen > 200) reasons.push(`description 过长 (${descLen} 字)`);
    if (!paramsHaveDesc) reasons.push('部分参数缺少 description');
    checks.push({ name: '用户体验', pass: false, reason: reasons.join('; ') });
    totalScore += 10; // partial
  }

  return {
    autoApprove: totalScore >= 70,
    score: totalScore,
    checks,
  };
}

/** 质量检查: 基于评分和执行数据判断是否需要下架或警告 */
export function qualityCheck(
  skill: MarketplaceSkill,
  executionStats?: { totalExecutions: number; failureCount: number },
  reportCount?: number,
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

  // 零下载 + 180 天 → deprecated
  if (skill.downloads === 0 && daysSinceUpdate >= 180) {
    action = 'deprecated';
    reasons.push(`Zero downloads for ${Math.round(daysSinceUpdate)} days — auto deprecated`);
  }

  // 被举报 ≥ 3 次 → suspended（预留，通过 reportCount 字段判断）
  if (reportCount !== undefined && reportCount >= 3) {
    action = 'suspend';
    reasons.push(`Reported ${reportCount} times — auto suspended`);
  }

  return { skillId: skill.id, action, reasons };
}

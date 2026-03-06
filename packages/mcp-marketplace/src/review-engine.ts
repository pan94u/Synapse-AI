import type {
  MCPServerConfig,
  MCPServerListing,
  MCPPublishReviewResult,
  MCPQualityCheckResult,
} from '@synapse/shared';

/**
 * 发布自动审核: 4 维度 100 分
 *
 * | 维度           | 权重 |
 * |----------------|------|
 * | 文档质量  (30%) | 30   |
 * | 工具覆盖  (25%) | 25   |
 * | 安全配置  (25%) | 25   |
 * | 配置完整性(20%) | 20   |
 *
 * score >= 70 → autoApprove; 30-69 → pending_review; <30 → rejected
 */
export function publishReview(
  config: MCPServerConfig,
  toolNames: string[],
): MCPPublishReviewResult {
  const checks: MCPPublishReviewResult['checks'] = [];
  let totalScore = 0;

  // --- 1. 文档质量 (30%) ---
  const hasDescription = !!(config.description && config.description.trim().length > 0);
  const hasTags = config.tags && config.tags.length >= 1;
  const nameValid = /^[a-z0-9][a-z0-9-]*$/.test(config.id);

  if (hasDescription && hasTags && nameValid) {
    checks.push({ name: '文档质量', pass: true, reason: 'description 完整，tags 已配置，ID 格式合法' });
    totalScore += 30;
  } else {
    const missing: string[] = [];
    if (!hasDescription) missing.push('description 为空');
    if (!hasTags) missing.push('tags 不足');
    if (!nameValid) missing.push('ID 格式不合法');
    checks.push({ name: '文档质量', pass: false, reason: missing.join('; ') });
    // Partial: 10 per passing criterion
    if (hasDescription) totalScore += 10;
    if (hasTags) totalScore += 10;
    if (nameValid) totalScore += 10;
  }

  // --- 2. 工具覆盖 (25%) ---
  const toolCount = toolNames.length;

  if (toolCount >= 1 && toolNames.every((n) => n.trim().length > 0)) {
    checks.push({ name: '工具覆盖', pass: true, reason: `已声明 ${toolCount} 个工具` });
    totalScore += 25;
  } else {
    checks.push({
      name: '工具覆盖',
      pass: false,
      reason: toolCount === 0 ? '无工具声明' : '工具名称包含空值',
    });
  }

  // --- 3. 安全配置 (25%) ---
  const hasRequireApproval = Array.isArray(config.permissions?.requireApproval);

  if (hasRequireApproval) {
    checks.push({ name: '安全配置', pass: true, reason: 'requireApproval 已配置' });
    totalScore += 25;
  } else {
    checks.push({ name: '安全配置', pass: false, reason: 'permissions.requireApproval 未配置' });
  }

  // --- 4. 配置完整性 (20%) ---
  const hasHealthCheck =
    config.healthCheck &&
    typeof config.healthCheck.interval === 'number' &&
    typeof config.healthCheck.timeout === 'number';
  const hasRateLimit =
    config.rateLimit &&
    typeof config.rateLimit.maxRequests === 'number' &&
    typeof config.rateLimit.windowMs === 'number';

  if (hasHealthCheck && hasRateLimit) {
    checks.push({ name: '配置完整性', pass: true, reason: 'healthCheck 和 rateLimit 字段完整' });
    totalScore += 20;
  } else {
    const missing: string[] = [];
    if (!hasHealthCheck) missing.push('healthCheck 不完整');
    if (!hasRateLimit) missing.push('rateLimit 不完整');
    checks.push({ name: '配置完整性', pass: false, reason: missing.join('; ') });
    if (hasHealthCheck) totalScore += 10;
    if (hasRateLimit) totalScore += 10;
  }

  return {
    autoApprove: totalScore >= 70,
    score: totalScore,
    checks,
  };
}

/** 质量检查: 基于运行时指标判断是否需要下架或警告 */
export function qualityCheck(
  listing: MCPServerListing,
  reportCount?: number,
): MCPQualityCheckResult {
  const reasons: string[] = [];
  let action: MCPQualityCheckResult['action'] = 'none';

  // errorRate > 0.3 && totalCalls >= 20 → suspend
  if (listing.errorRate > 0.3 && listing.totalCalls >= 20) {
    action = 'suspend';
    reasons.push(
      `高错误率: ${Math.round(listing.errorRate * 100)}% (${listing.totalCalls} 次调用)`,
    );
  }

  // uptimeRate < 0.7 && totalCalls >= 10 → suspend
  if (listing.uptimeRate < 0.7 && listing.totalCalls >= 10) {
    action = 'suspend';
    reasons.push(`低可用率: ${Math.round(listing.uptimeRate * 100)}%`);
  }

  // avgLatencyMs > 5000 → warn
  if (listing.avgLatencyMs > 5000) {
    if (action === 'none') action = 'warn';
    reasons.push(`高延迟: ${listing.avgLatencyMs}ms`);
  }

  // 90 天无调用 → deprecated
  const daysSinceUpdate =
    (Date.now() - new Date(listing.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceUpdate >= 90 && listing.totalCalls === 0) {
    action = 'deprecated';
    reasons.push(`90 天无调用 — 自动废弃`);
  }

  // rating.average < 2.0 && rating.count >= 3 → suspend
  if (listing.rating.average < 2.0 && listing.rating.count >= 3) {
    action = 'suspend';
    reasons.push(
      `低评分: ${listing.rating.average}/5 (${listing.rating.count} 条评价)`,
    );
  }

  // reportCount >= 3 → suspend
  if (reportCount !== undefined && reportCount >= 3) {
    action = 'suspend';
    reasons.push(`被举报 ${reportCount} 次 — 自动下架`);
  }

  return { serverId: listing.id, action, reasons };
}

import type { MarketplaceSkill } from '@synapse/shared';

interface SkillScore {
  skillId: string;
  score: number;
  breakdown: {
    downloads: number;
    rating: number;
    successRate: number;
    recency: number;
  };
}

/**
 * Ranking Engine — 纯函数，计算技能排名分数
 *
 * 公式: score = (downloads_norm × 0.3) + (avg_rating/5 × 0.3) + (success_rate × 0.2) + (recency × 0.2)
 *   - downloads_norm: min(downloads / max(allDownloads), 1.0)
 *   - recency: 2^(-daysSinceUpdate / 90) — 半衰期 90 天
 */
export function computeScore(skill: MarketplaceSkill, maxDownloads: number): SkillScore {
  const downloadsNorm = maxDownloads > 0 ? Math.min(skill.downloads / maxDownloads, 1.0) : 0;
  const ratingNorm = skill.rating.count > 0 ? skill.rating.average / 5 : 0.5;
  const successRate = skill.successRate;

  const daysSinceUpdate =
    (Date.now() - new Date(skill.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
  const recency = Math.pow(2, -daysSinceUpdate / 90);

  const breakdown = {
    downloads: downloadsNorm * 0.3,
    rating: ratingNorm * 0.3,
    successRate: successRate * 0.2,
    recency: recency * 0.2,
  };

  return {
    skillId: skill.id,
    score: breakdown.downloads + breakdown.rating + breakdown.successRate + breakdown.recency,
    breakdown,
  };
}

export function rank(skills: MarketplaceSkill[]): MarketplaceSkill[] {
  if (skills.length === 0) return [];

  const maxDownloads = Math.max(...skills.map((s) => s.downloads), 1);

  const scored = skills.map((skill) => ({
    skill,
    ...computeScore(skill, maxDownloads),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.map((s) => s.skill);
}

export function rankWithScores(skills: MarketplaceSkill[]): (SkillScore & { skill: MarketplaceSkill })[] {
  if (skills.length === 0) return [];

  const maxDownloads = Math.max(...skills.map((s) => s.downloads), 1);

  const scored = skills.map((skill) => ({
    skill,
    ...computeScore(skill, maxDownloads),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored;
}

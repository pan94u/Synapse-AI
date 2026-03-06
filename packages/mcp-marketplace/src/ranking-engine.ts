import type { MCPServerListing, MCPServerScore } from '@synapse/shared';

/**
 * Ranking Engine — 纯函数，计算 MCP Server 排名分数
 *
 * 公式: score = reliability×0.35 + performance×0.25 + rating×0.25 + recency×0.15
 *   - reliability = uptimeRate × (1 - errorRate)
 *   - performance = 1 - clamp(avgLatencyMs / 5000, 0, 1)
 *   - rating = count===0 ? 0.5 : average/5
 *   - recency = 2^(-daysSinceUpdate / 90)  — 90天半衰期
 */
export function computeScore(listing: MCPServerListing): MCPServerScore {
  const reliability = listing.uptimeRate * (1 - listing.errorRate);
  const performance = 1 - Math.min(listing.avgLatencyMs / 5000, 1);
  const ratingNorm = listing.rating.count === 0 ? 0.5 : listing.rating.average / 5;

  const daysSinceUpdate =
    (Date.now() - new Date(listing.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
  const recency = Math.pow(2, -daysSinceUpdate / 90);

  const breakdown = {
    reliability: reliability * 0.35,
    performance: performance * 0.25,
    rating: ratingNorm * 0.25,
    recency: recency * 0.15,
  };

  return {
    serverId: listing.id,
    score: breakdown.reliability + breakdown.performance + breakdown.rating + breakdown.recency,
    breakdown,
  };
}

export function rank(listings: MCPServerListing[]): MCPServerListing[] {
  if (listings.length === 0) return [];

  const scored = listings.map((listing) => ({
    listing,
    ...computeScore(listing),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.listing);
}

export function rankWithScores(
  listings: MCPServerListing[],
): (MCPServerScore & { listing: MCPServerListing })[] {
  if (listings.length === 0) return [];

  const scored = listings.map((listing) => ({
    listing,
    ...computeScore(listing),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

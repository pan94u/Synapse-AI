import { Hono } from 'hono';
import type { SkillMarketplace } from '@synapse/skill-marketplace';

export function createMarketplaceRoutes(marketplace: SkillMarketplace): Hono {
  const routes = new Hono();

  // 1. GET /api/marketplace/status — 市场统计
  routes.get('/marketplace/status', (c) => {
    return c.json(marketplace.getStats());
  });

  // 2. GET /api/marketplace/search — 搜索 (?q=&category=&tag=)
  routes.get('/marketplace/search', (c) => {
    const q = c.req.query('q') ?? undefined;
    const category = c.req.query('category') ?? undefined;
    const tag = c.req.query('tag') ?? undefined;

    const skills = marketplace.search({ q, category, tag });
    return c.json({ skills, count: skills.length });
  });

  // 3. GET /api/marketplace/browse — 浏览 (?category=&sort=ranking|recent|downloads)
  routes.get('/marketplace/browse', (c) => {
    const category = c.req.query('category') ?? undefined;
    const sort = (c.req.query('sort') as 'ranking' | 'recent' | 'downloads') ?? 'ranking';

    const skills = marketplace.browse({ category, sort });
    return c.json({ skills, count: skills.length });
  });

  // 4. GET /api/marketplace/top — 排行榜 (?limit=10)
  routes.get('/marketplace/top', (c) => {
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!, 10) : 10;
    const skills = marketplace.top(limit);
    return c.json({ skills, count: skills.length });
  });

  // 5. GET /api/marketplace/skills/:skillId — 详情 + 评分 + 评价
  routes.get('/marketplace/skills/:skillId', (c) => {
    const { skillId } = c.req.param();
    const skill = marketplace.getSkill(skillId);
    if (!skill) {
      return c.json({ error: `Skill "${skillId}" not found in marketplace` }, 404);
    }

    const reviews = marketplace.getReviews(skillId);
    return c.json({ skill, reviews });
  });

  // 6. POST /api/marketplace/publish — 发布技能
  routes.post('/marketplace/publish', async (c) => {
    const body = await c.req.json();

    if (!body.skillId || !body.author?.id || !body.author?.name) {
      return c.json({ error: 'skillId and author (id, name) are required' }, 400);
    }

    try {
      const result = marketplace.publish({
        skillId: body.skillId,
        author: body.author,
        tags: body.tags,
        version: body.version,
        dependencies: body.dependencies,
        compatibility: body.compatibility,
      });
      return c.json(result, 201);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return c.json({ error: message }, 400);
    }
  });

  // 7. PUT /api/marketplace/skills/:skillId — 更新元数据 (tags, status)
  routes.put('/marketplace/skills/:skillId', async (c) => {
    const { skillId } = c.req.param();
    const body = await c.req.json();

    const updated = marketplace.updateMetadata(skillId, {
      tags: body.tags,
      status: body.status,
    });

    if (!updated) {
      return c.json({ error: `Skill "${skillId}" not found in marketplace` }, 404);
    }

    return c.json({ skill: updated });
  });

  // 8. DELETE /api/marketplace/skills/:skillId — 下架
  routes.delete('/marketplace/skills/:skillId', (c) => {
    const { skillId } = c.req.param();
    const deleted = marketplace.unpublish(skillId);

    if (!deleted) {
      return c.json({ error: `Skill "${skillId}" not found in marketplace` }, 404);
    }

    return c.json({ deleted: true, skillId });
  });

  // 9. POST /api/marketplace/skills/:skillId/install — 安装
  routes.post('/marketplace/skills/:skillId/install', (c) => {
    const { skillId } = c.req.param();

    try {
      const record = marketplace.install(skillId);
      return c.json({ installed: true, record });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return c.json({ error: message }, 400);
    }
  });

  // 10. DELETE /api/marketplace/installed/:skillId — 卸载
  routes.delete('/marketplace/installed/:skillId', (c) => {
    const { skillId } = c.req.param();
    const uninstalled = marketplace.uninstall(skillId);

    if (!uninstalled) {
      return c.json({ error: `Skill "${skillId}" is not installed` }, 404);
    }

    return c.json({ uninstalled: true, skillId });
  });

  // 11. GET /api/marketplace/installed — 已安装列表
  routes.get('/marketplace/installed', (c) => {
    const records = marketplace.listInstalled();
    return c.json({ installed: records, count: records.length });
  });

  // 12. GET /api/marketplace/installed/updates — 检查更新
  routes.get('/marketplace/installed/updates', (c) => {
    const updates = marketplace.checkUpdates();
    return c.json({ updates, count: updates.length });
  });

  // 13. POST /api/marketplace/installed/:skillId/update — 更新已安装技能
  routes.post('/marketplace/installed/:skillId/update', (c) => {
    const { skillId } = c.req.param();

    try {
      const record = marketplace.updateInstalled(skillId);
      if (!record) {
        return c.json({ error: `Skill "${skillId}" is not installed` }, 404);
      }
      return c.json({ updated: true, record });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return c.json({ error: message }, 400);
    }
  });

  // 14. POST /api/marketplace/skills/:skillId/reviews — 提交评价
  routes.post('/marketplace/skills/:skillId/reviews', async (c) => {
    const { skillId } = c.req.param();
    const body = await c.req.json();

    if (!body.userId || !body.userName || body.rating === undefined || !body.comment) {
      return c.json({ error: 'userId, userName, rating, and comment are required' }, 400);
    }

    try {
      const result = marketplace.addReview({
        skillId,
        userId: body.userId,
        userName: body.userName,
        rating: body.rating,
        comment: body.comment,
      });
      return c.json(result, 201);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return c.json({ error: message }, 400);
    }
  });

  // 15. GET /api/marketplace/skills/:skillId/reviews — 获取评价列表
  routes.get('/marketplace/skills/:skillId/reviews', (c) => {
    const { skillId } = c.req.param();
    const reviews = marketplace.getReviews(skillId);
    return c.json({ reviews, count: reviews.length });
  });

  // 16. PUT /api/marketplace/reviews/:reviewId — 修改评价
  routes.put('/marketplace/reviews/:reviewId', async (c) => {
    const { reviewId } = c.req.param();
    const body = await c.req.json();

    try {
      const updated = marketplace.updateReview(reviewId, {
        rating: body.rating,
        comment: body.comment,
      });

      if (!updated) {
        return c.json({ error: `Review "${reviewId}" not found` }, 404);
      }

      return c.json({ review: updated });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return c.json({ error: message }, 400);
    }
  });

  // 17. DELETE /api/marketplace/reviews/:reviewId — 删除评价
  routes.delete('/marketplace/reviews/:reviewId', (c) => {
    const { reviewId } = c.req.param();
    const deleted = marketplace.deleteReview(reviewId);

    if (!deleted) {
      return c.json({ error: `Review "${reviewId}" not found` }, 404);
    }

    return c.json({ deleted: true, reviewId });
  });

  return routes;
}

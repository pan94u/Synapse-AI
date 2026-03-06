import { Hono } from 'hono';
import type { MCPMarketplace } from '@synapse/mcp-marketplace';

export function createMCPMarketplaceRoutes(marketplace: MCPMarketplace): Hono {
  const routes = new Hono();

  // 1. GET /api/mcp-marketplace/status — 市场统计
  routes.get('/mcp-marketplace/status', (c) => {
    return c.json(marketplace.getStats());
  });

  // 2. GET /api/mcp-marketplace/browse — 浏览 (?category=&sort=ranking|recent|installs)
  routes.get('/mcp-marketplace/browse', (c) => {
    const category = c.req.query('category') ?? undefined;
    const sort = (c.req.query('sort') as 'ranking' | 'recent' | 'installs') ?? 'ranking';

    const servers = marketplace.browse({ category, sort });
    return c.json({ servers, count: servers.length });
  });

  // 3. GET /api/mcp-marketplace/top — 排行榜 (?limit=10)
  routes.get('/mcp-marketplace/top', (c) => {
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!, 10) : 10;
    const servers = marketplace.top(limit);
    return c.json({ servers, count: servers.length });
  });

  // 4. GET /api/mcp-marketplace/search — 搜索 (?q=&category=&tag=)
  routes.get('/mcp-marketplace/search', (c) => {
    const q = c.req.query('q') ?? undefined;
    const category = c.req.query('category') ?? undefined;
    const tag = c.req.query('tag') ?? undefined;

    const servers = marketplace.search({ q, category, tag });
    return c.json({ servers, count: servers.length });
  });

  // 5. GET /api/mcp-marketplace/pending — 待审核列表
  routes.get('/mcp-marketplace/pending', (c) => {
    const servers = marketplace.listPendingReview();
    return c.json({ servers, count: servers.length });
  });

  // 6. POST /api/mcp-marketplace/publish — 发布 MCP Server
  routes.post('/mcp-marketplace/publish', async (c) => {
    const body = await c.req.json();

    if (!body.serverId && !body.config) {
      return c.json({ error: 'serverId or config is required' }, 400);
    }
    if (!body.author?.id || !body.author?.name) {
      return c.json({ error: 'author (id, name) is required' }, 400);
    }

    try {
      // If serverId is given, fetch config from hub adapter
      let config = body.config;
      if (!config && body.serverId) {
        config = marketplace['adapter']?.getServerConfig?.(body.serverId);
        if (!config) {
          return c.json({ error: `Server "${body.serverId}" not found in MCPHub` }, 404);
        }
      }

      const result = marketplace.publish(config, body.author, body.tags);
      return c.json(result, 201);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return c.json({ error: message }, 400);
    }
  });

  // 7. GET /api/mcp-marketplace/servers/:id — 详情 + 评价
  routes.get('/mcp-marketplace/servers/:id', (c) => {
    const { id } = c.req.param();

    // Sync metrics before returning
    try { marketplace.syncMetrics(id); } catch {}

    const listing = marketplace.getListing(id);
    if (!listing) {
      return c.json({ error: `Server "${id}" not found in marketplace` }, 404);
    }

    const reviews = marketplace.getReviews(id);
    return c.json({ listing, reviews });
  });

  // 8. PUT /api/mcp-marketplace/servers/:id — 更新元数据
  routes.put('/mcp-marketplace/servers/:id', async (c) => {
    const { id } = c.req.param();
    const body = await c.req.json();

    const updated = marketplace.updateMetadata(id, {
      tags: body.tags,
      status: body.status,
      description: body.description,
    });

    if (!updated) {
      return c.json({ error: `Server "${id}" not found in marketplace` }, 404);
    }

    return c.json({ listing: updated });
  });

  // 9. DELETE /api/mcp-marketplace/servers/:id — 下架
  routes.delete('/mcp-marketplace/servers/:id', (c) => {
    const { id } = c.req.param();
    const deleted = marketplace.unpublish(id);

    if (!deleted) {
      return c.json({ error: `Server "${id}" not found in marketplace` }, 404);
    }

    return c.json({ deleted: true, serverId: id });
  });

  // 10. POST /api/mcp-marketplace/servers/:id/install — 安装到 MCP Hub
  routes.post('/mcp-marketplace/servers/:id/install', async (c) => {
    const { id } = c.req.param();

    try {
      const record = await marketplace.install(id);
      return c.json({ success: true, record });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return c.json({ error: message }, 400);
    }
  });

  // 11. DELETE /api/mcp-marketplace/servers/:id/install — 卸载
  routes.delete('/mcp-marketplace/servers/:id/install', async (c) => {
    const { id } = c.req.param();

    try {
      const uninstalled = await marketplace.uninstall(id);
      if (!uninstalled) {
        return c.json({ error: `Server "${id}" is not installed` }, 404);
      }
      return c.json({ success: true, serverId: id });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return c.json({ error: message }, 400);
    }
  });

  // 12. POST /api/mcp-marketplace/servers/:id/review — 审核决定 (approve/reject)
  routes.post('/mcp-marketplace/servers/:id/review', async (c) => {
    const { id } = c.req.param();
    const body = await c.req.json();

    if (!body.action || !['approve', 'reject'].includes(body.action)) {
      return c.json({ error: 'action must be "approve" or "reject"' }, 400);
    }
    if (!body.reviewer) {
      return c.json({ error: 'reviewer is required' }, 400);
    }

    try {
      const listing = marketplace.reviewServer(id, {
        action: body.action,
        reviewer: body.reviewer,
        reason: body.reason,
      });
      return c.json({ listing, decision: body.action });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return c.json({ error: message }, 400);
    }
  });

  // 13. POST /api/mcp-marketplace/servers/:id/reviews — 提交评价
  routes.post('/mcp-marketplace/servers/:id/reviews', async (c) => {
    const { id } = c.req.param();
    const body = await c.req.json();

    if (!body.userId || !body.userName || body.rating === undefined || !body.comment) {
      return c.json({ error: 'userId, userName, rating, and comment are required' }, 400);
    }

    try {
      const result = marketplace.addReview({
        serverId: id,
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

  // 14. GET /api/mcp-marketplace/servers/:id/reviews — 评价列表
  routes.get('/mcp-marketplace/servers/:id/reviews', (c) => {
    const { id } = c.req.param();
    const reviews = marketplace.getReviews(id);
    return c.json({ reviews, count: reviews.length });
  });

  // 15. GET /api/mcp-marketplace/installed — 已安装列表
  routes.get('/mcp-marketplace/installed', (c) => {
    const records = marketplace.listInstalled();
    return c.json({ installed: records, count: records.length });
  });

  // 16. POST /api/mcp-marketplace/sync/:id — 同步运行时指标
  routes.post('/mcp-marketplace/sync/:id', (c) => {
    const { id } = c.req.param();
    try {
      marketplace.syncMetrics(id);
      const listing = marketplace.getListing(id);
      return c.json({ success: true, listing });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return c.json({ error: message }, 400);
    }
  });

  return routes;
}

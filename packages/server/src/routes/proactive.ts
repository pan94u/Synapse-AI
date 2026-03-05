import { Hono } from 'hono';
import type { ProactiveTaskManager } from '@synapse/proactive';

export function createProactiveRoutes(manager: ProactiveTaskManager): Hono {
  const routes = new Hono();

  // GET /api/proactive/status — 调度器状态
  routes.get('/proactive/status', (c) => {
    return c.json(manager.getStatus());
  });

  // GET /api/proactive/actions — 列出所有 action
  routes.get('/proactive/actions', (c) => {
    const actions = manager.getActionRegistry().list();
    return c.json({ actions });
  });

  // POST /api/proactive/actions/:actionId/execute — 手动执行 action
  routes.post('/proactive/actions/:actionId/execute', async (c) => {
    const { actionId } = c.req.param();
    let body: { personaId?: string; variables?: Record<string, string> } = {};
    try {
      body = await c.req.json();
    } catch {
      // empty body is fine for manual execution
    }

    const personaId = body.personaId || 'ceo';

    const action = manager.getActionRegistry().get(actionId);
    if (!action) {
      return c.json({ error: `Action "${actionId}" not found` }, 404);
    }

    try {
      const execution = await manager.executeAction(
        actionId,
        personaId,
        'schedule',
        'manual',
        body.variables,
      );
      return c.json({ execution });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return c.json({ error: message }, 500);
    }
  });

  // POST /api/proactive/events — 发射事件
  routes.post('/proactive/events', async (c) => {
    const body = await c.req.json<{
      name: string;
      source?: string;
      payload?: Record<string, unknown>;
    }>();

    if (!body.name) {
      return c.json({ error: 'name is required' }, 400);
    }

    const event = manager.emitEvent(
      body.name,
      body.source ?? 'api',
      body.payload ?? {},
    );
    return c.json({ event });
  });

  // GET /api/proactive/history — 查询执行历史
  routes.get('/proactive/history', (c) => {
    const personaId = c.req.query('personaId');
    const taskId = c.req.query('taskId');
    const status = c.req.query('status') as 'running' | 'success' | 'error' | undefined;
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!, 10) : 20;

    const history = manager.getTaskHistory().query({
      personaId: personaId ?? undefined,
      taskId: taskId ?? undefined,
      status: status ?? undefined,
      limit,
    });

    return c.json({ history });
  });

  // GET /api/proactive/notifications — 查询通知
  routes.get('/proactive/notifications', (c) => {
    const personaId = c.req.query('personaId');
    const unreadOnly = c.req.query('unreadOnly') === 'true';
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!, 10) : 20;

    if (personaId) {
      const notifications = manager.getNotificationStore().getForPersona(personaId, {
        unreadOnly,
        limit,
      });
      return c.json({ notifications, unreadCount: manager.getNotificationStore().getUnreadCount(personaId) });
    }

    const notifications = manager.getNotificationStore().getRecent(limit);
    return c.json({ notifications });
  });

  // POST /api/proactive/notifications/:id/read — 标记已读
  routes.post('/proactive/notifications/:id/read', (c) => {
    const { id } = c.req.param();
    const success = manager.getNotificationStore().markRead(id);
    return c.json({ success });
  });

  // POST /api/proactive/notifications/read-all — 全部标记已读
  routes.post('/proactive/notifications/read-all', async (c) => {
    const body = await c.req.json<{ personaId: string }>();
    if (!body.personaId) {
      return c.json({ error: 'personaId is required' }, 400);
    }

    const count = manager.getNotificationStore().markAllRead(body.personaId);
    return c.json({ success: true, count });
  });

  return routes;
}

import { Hono } from 'hono';
import type { DecisionEngine } from '@synapse/decision-engine';

export function createDecisionRoutes(engine: DecisionEngine): Hono {
  const routes = new Hono();

  // GET /api/decision/status — 引擎状态
  routes.get('/decision/status', (c) => {
    return c.json(engine.getStatus());
  });

  // GET /api/decision/metrics — 列出指标定义
  routes.get('/decision/metrics', (c) => {
    const metrics = engine.getCollector().listMetrics();
    return c.json({ metrics });
  });

  // GET /api/decision/metrics/:id/snapshots — 指标历史快照
  routes.get('/decision/metrics/:id/snapshots', (c) => {
    const { id } = c.req.param();
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!, 10) : 50;
    const periodType = c.req.query('periodType') as 'daily' | 'weekly' | 'monthly' | undefined;

    const snapshots = engine.getMetricStore().getHistory(id, { periodType, limit });
    const latest = engine.getMetricStore().getLatest(id);

    return c.json({ metricId: id, latest, snapshots, count: snapshots.length });
  });

  // POST /api/decision/metrics/:id/collect — 手动采集指标
  routes.post('/decision/metrics/:id/collect', async (c) => {
    const { id } = c.req.param();
    const def = engine.getCollector().getDefinition(id);
    if (!def) {
      return c.json({ error: `Metric "${id}" not found` }, 404);
    }

    try {
      const snapshot = await engine.getCollector().collectMetric(id);
      if (!snapshot) {
        return c.json({ error: 'Failed to collect metric data' }, 500);
      }
      return c.json({ snapshot });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return c.json({ error: message }, 500);
    }
  });

  // GET /api/decision/insights — 查询洞察
  routes.get('/decision/insights', (c) => {
    const type = c.req.query('type') as 'trend' | 'anomaly' | 'attribution' | 'prediction' | 'correlation' | 'benchmark' | undefined;
    const severity = c.req.query('severity') as 'info' | 'warning' | 'critical' | undefined;
    const personaId = c.req.query('personaId') ?? undefined;
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!, 10) : 20;

    const insights = engine.getInsightEngine().query({ type, severity, personaId, limit });
    return c.json({ insights, count: insights.length });
  });

  // POST /api/decision/insights/analyze — 手动触发洞察分析
  routes.post('/decision/insights/analyze', async (c) => {
    const body = await c.req.json<{ personaId: string; metricIds?: string[] }>();

    if (!body.personaId) {
      return c.json({ error: 'personaId is required' }, 400);
    }

    try {
      const insights = await engine.getInsightEngine().analyze(body.personaId, body.metricIds);
      return c.json({ insights, count: insights.length });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return c.json({ error: message }, 500);
    }
  });

  // GET /api/decision/strategy — 战略目标概览
  routes.get('/decision/strategy', (c) => {
    const objectives = engine.getStrategyTracker().getObjectives();
    const overallStatus = engine.getStrategyTracker().getOverallStatus();
    return c.json({ objectives, overallStatus });
  });

  // GET /api/decision/strategy/:id — 单个目标详情
  routes.get('/decision/strategy/:id', (c) => {
    const { id } = c.req.param();
    const objective = engine.getStrategyTracker().getObjective(id);
    if (!objective) {
      return c.json({ error: `Objective "${id}" not found` }, 404);
    }
    return c.json({ objective });
  });

  // POST /api/decision/strategy/refresh — 刷新战略进度
  routes.post('/decision/strategy/refresh', (c) => {
    engine.getStrategyTracker().updateProgress();
    const objectives = engine.getStrategyTracker().getObjectives();
    const overallStatus = engine.getStrategyTracker().getOverallStatus();
    return c.json({ objectives, overallStatus, refreshedAt: new Date().toISOString() });
  });

  // GET /api/decision/journal — 决策记录列表
  routes.get('/decision/journal', (c) => {
    const deciderId = c.req.query('deciderId') ?? undefined;
    const status = c.req.query('status') as 'pending' | 'executing' | 'reviewing' | 'closed' | undefined;
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!, 10) : 20;

    const records = engine.getDecisionJournal().query({ deciderId, status, limit });
    return c.json({ records, count: records.length });
  });

  // POST /api/decision/journal — 创建决策记录
  routes.post('/decision/journal', async (c) => {
    const body = await c.req.json();

    if (!body.deciderId || !body.context?.question) {
      return c.json({ error: 'deciderId and context.question are required' }, 400);
    }

    // Ensure required structure
    const record = engine.getDecisionJournal().create({
      deciderId: body.deciderId,
      deciderRole: body.deciderRole ?? 'unknown',
      context: {
        question: body.context.question,
        background: body.context.background ?? '',
        insightIds: body.context.insightIds ?? [],
        dataSnapshot: body.context.dataSnapshot ?? {},
      },
      options: body.options ?? [],
      decision: body.decision ?? {
        selectedOptionId: '',
        rationale: '',
        expectedOutcome: '',
        reviewDate: '',
      },
      tracking: body.tracking ?? { status: 'pending' },
    });

    return c.json({ record }, 201);
  });

  // GET /api/decision/journal/:id — 决策详情
  routes.get('/decision/journal/:id', (c) => {
    const { id } = c.req.param();
    const record = engine.getDecisionJournal().get(id);
    if (!record) {
      return c.json({ error: `Decision record "${id}" not found` }, 404);
    }
    return c.json({ record });
  });

  // PUT /api/decision/journal/:id — 更新决策（追踪/回顾）
  routes.put('/decision/journal/:id', async (c) => {
    const { id } = c.req.param();
    const body = await c.req.json<{
      decision?: Record<string, unknown>;
      tracking?: Record<string, unknown>;
    }>();

    const updated = engine.getDecisionJournal().update(id, {
      decision: body.decision as any,
      tracking: body.tracking as any,
    });

    if (!updated) {
      return c.json({ error: `Decision record "${id}" not found` }, 404);
    }

    return c.json({ record: updated });
  });

  // GET /api/decision/reports — 报告列表
  routes.get('/decision/reports', (c) => {
    const type = c.req.query('type') as 'daily' | 'weekly' | 'monthly' | 'thematic' | undefined;
    const personaId = c.req.query('personaId') ?? undefined;
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!, 10) : 20;

    const reports = engine.getReportGenerator().query({ type, personaId, limit });
    return c.json({ reports, count: reports.length });
  });

  // POST /api/decision/reports/generate — 生成报告
  routes.post('/decision/reports/generate', async (c) => {
    const body = await c.req.json<{
      type: 'daily' | 'weekly' | 'monthly' | 'thematic';
      personaId: string;
      title?: string;
      metricIds?: string[];
      period?: string;
    }>();

    if (!body.type || !body.personaId) {
      return c.json({ error: 'type and personaId are required' }, 400);
    }

    try {
      const report = await engine.getReportGenerator().generate({
        type: body.type,
        personaId: body.personaId,
        title: body.title,
        metricIds: body.metricIds,
        period: body.period,
      });
      return c.json({ report });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return c.json({ error: message }, 500);
    }
  });

  // GET /api/decision/reports/:id — 报告详情
  routes.get('/decision/reports/:id', (c) => {
    const { id } = c.req.param();
    const report = engine.getReportGenerator().get(id);
    if (!report) {
      return c.json({ error: `Report "${id}" not found` }, 404);
    }
    return c.json({ report });
  });

  return routes;
}

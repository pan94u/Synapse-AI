import { Hono } from 'hono';
import type { ComplianceEngine, ComplianceAuditTrail, ApprovalManager } from '@synapse/compliance';

export function createComplianceRoutes(
  engine: ComplianceEngine,
  auditTrail: ComplianceAuditTrail,
  approvalManager: ApprovalManager,
): Hono {
  const routes = new Hono();

  // GET /compliance/rules — list all rule sets
  routes.get('/compliance/rules', (c) => {
    const ruleSets = engine.getRuleSets();
    const result = Array.from(ruleSets.entries()).map(([id, rs]) => ({
      id,
      ruleCount: rs.rules.length,
      rules: rs.rules.map((r) => ({
        id: r.id,
        name: r.name,
        phase: r.phase,
        tool: r.when.tool,
      })),
    }));
    return c.json({ ruleSets: result });
  });

  // GET /compliance/rules/:id — single rule set details
  routes.get('/compliance/rules/:id', (c) => {
    const id = c.req.param('id');
    const ruleSet = engine.getRuleSets().get(id);
    if (!ruleSet) {
      return c.json({ error: `Rule set "${id}" not found` }, 404);
    }
    return c.json(ruleSet);
  });

  // GET /compliance/audit — query audit trail
  routes.get('/compliance/audit', (c) => {
    const personaId = c.req.query('personaId');
    const toolName = c.req.query('toolName');
    const limit = Number(c.req.query('limit')) || 50;

    if (personaId || toolName) {
      const entries = auditTrail.query({ personaId, toolName });
      return c.json({ entries: entries.slice(0, limit) });
    }
    return c.json({ entries: auditTrail.getRecent(limit) });
  });

  // GET /compliance/approvals — list pending approvals
  routes.get('/compliance/approvals', (c) => {
    const approverId = c.req.query('approverId');
    const pending = approvalManager.getPending(approverId);
    return c.json({ approvals: pending });
  });

  // POST /compliance/approvals/:id/approve — approve a request
  routes.post('/compliance/approvals/:id/approve', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json<{ by: string }>().catch(() => ({ by: 'unknown' }));
    const result = approvalManager.approve(id, body.by);
    if (!result) {
      return c.json({ error: `Approval request "${id}" not found or not pending` }, 404);
    }
    return c.json(result);
  });

  // POST /compliance/approvals/:id/deny — deny a request
  routes.post('/compliance/approvals/:id/deny', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json<{ by: string; reason?: string }>().catch(() => ({ by: 'unknown' } as { by: string; reason?: string }));
    const result = approvalManager.deny(id, body.by, body.reason);
    if (!result) {
      return c.json({ error: `Approval request "${id}" not found or not pending` }, 404);
    }
    return c.json(result);
  });

  return routes;
}

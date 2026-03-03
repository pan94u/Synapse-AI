import { Hono } from 'hono';
import type { SkillManager } from '@synapse/skill-manager';
import type { PersonaRegistry } from '@synapse/personas';
import type { SkillCategory, SkillSource } from '@synapse/shared';

export function createSkillRoutes(skillManager: SkillManager, personaRegistry: PersonaRegistry): Hono {
  const routes = new Hono();

  // GET /api/skills — 列出技能
  routes.get('/skills', (c) => {
    const category = c.req.query('category') as SkillCategory | undefined;
    const source = c.req.query('source') as SkillSource | undefined;
    const personaId = c.req.query('personaId') ?? undefined;

    let defaultSkillPatterns: string[] | undefined;
    if (personaId) {
      const persona = personaRegistry.get(personaId);
      if (!persona) {
        return c.json({ error: `Persona "${personaId}" not found` }, 404);
      }
      defaultSkillPatterns = persona.defaultSkills ?? [];
    }

    const skills = skillManager.listSkills({ category, source, defaultSkillPatterns });
    return c.json({ skills, count: skills.length });
  });

  // GET /api/skills/status — 技能系统状态
  routes.get('/skills/status', (c) => {
    return c.json(skillManager.getStatus());
  });

  // GET /api/skills/categories — 分类列表 + 数量
  routes.get('/skills/categories', (c) => {
    const all = skillManager.listSkills();
    const categories: Record<string, number> = {};
    for (const skill of all) {
      categories[skill.category] = (categories[skill.category] ?? 0) + 1;
    }
    return c.json({ categories });
  });

  // GET /api/skills/history — 执行历史
  routes.get('/skills/history', (c) => {
    const skillId = c.req.query('skillId') ?? undefined;
    const personaId = c.req.query('personaId') ?? undefined;
    const status = c.req.query('status') as 'running' | 'success' | 'error' | undefined;
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!, 10) : 20;

    const executions = skillManager.getHistory().query({ skillId, personaId, status, limit });
    return c.json({ executions, count: executions.length });
  });

  // GET /api/skills/:skillId — 技能详情
  routes.get('/skills/:skillId', (c) => {
    const { skillId } = c.req.param();
    const skill = skillManager.getSkill(skillId);
    if (!skill) {
      return c.json({ error: `Skill "${skillId}" not found` }, 404);
    }
    return c.json({ skill });
  });

  // POST /api/skills/:skillId/execute — 执行技能
  routes.post('/skills/:skillId/execute', async (c) => {
    const { skillId } = c.req.param();
    const body = await c.req.json<{ personaId: string; parameters?: Record<string, string> }>();

    if (!body.personaId) {
      return c.json({ error: 'personaId is required' }, 400);
    }

    try {
      const execution = await skillManager.executeSkill(
        skillId,
        body.personaId,
        body.parameters ?? {},
        'manual',
      );
      return c.json({ execution });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return c.json({ error: message }, 500);
    }
  });

  // POST /api/skills/:skillId/status — 启用/禁用
  routes.post('/skills/:skillId/status', async (c) => {
    const { skillId } = c.req.param();
    const body = await c.req.json<{ status: 'draft' | 'active' | 'disabled' }>();

    if (!body.status || !['draft', 'active', 'disabled'].includes(body.status)) {
      return c.json({ error: 'status must be "draft", "active", or "disabled"' }, 400);
    }

    const success = skillManager.setSkillStatus(skillId, body.status);
    if (!success) {
      return c.json({ error: `Skill "${skillId}" not found` }, 404);
    }

    return c.json({ skillId, status: body.status });
  });

  // POST /api/skills/custom — 创建自定义技能
  routes.post('/skills/custom', async (c) => {
    const body = await c.req.json();

    if (!body.name || !body.description || !body.instructions) {
      return c.json({ error: 'name, description, and instructions are required' }, 400);
    }

    try {
      const skill = skillManager.createCustomSkill({
        name: body.name,
        description: body.description,
        category: body.category ?? 'custom',
        allowedTools: body.allowedTools ?? [],
        parameters: body.parameters ?? [],
        instructions: body.instructions,
        metadata: body.metadata,
      });
      return c.json({ skill }, 201);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return c.json({ error: message }, 400);
    }
  });

  // PUT /api/skills/custom/:skillId — 更新自定义技能
  routes.put('/skills/custom/:skillId', async (c) => {
    const { skillId } = c.req.param();
    const body = await c.req.json();

    const updated = skillManager.updateCustomSkill(skillId, {
      description: body.description,
      category: body.category,
      allowedTools: body.allowedTools,
      parameters: body.parameters,
      instructions: body.instructions,
      metadata: body.metadata,
    });

    if (!updated) {
      return c.json({ error: `Custom skill "${skillId}" not found` }, 404);
    }

    return c.json({ skill: updated });
  });

  // DELETE /api/skills/custom/:skillId — 删除自定义技能
  routes.delete('/skills/custom/:skillId', (c) => {
    const { skillId } = c.req.param();
    const deleted = skillManager.deleteCustomSkill(skillId);

    if (!deleted) {
      return c.json({ error: `Custom skill "${skillId}" not found or not a custom skill` }, 404);
    }

    return c.json({ deleted: true, skillId });
  });

  return routes;
}

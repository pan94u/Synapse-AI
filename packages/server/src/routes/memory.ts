import { Hono } from 'hono';
import type { PersonalMemoryStore } from '@synapse/memory';

export function createMemoryRoutes(personalMemory: PersonalMemoryStore): Hono {
  const routes = new Hono();

  // GET /memory/:personaId/facts — list all facts
  routes.get('/memory/:personaId/facts', (c) => {
    const personaId = c.req.param('personaId');
    const facts = personalMemory.listFacts(personaId);
    return c.json({ facts });
  });

  // GET /memory/:personaId/facts/:key — get specific fact
  routes.get('/memory/:personaId/facts/:key', (c) => {
    const personaId = c.req.param('personaId');
    const key = c.req.param('key');
    const fact = personalMemory.getFact(personaId, key);
    if (!fact) {
      return c.json({ error: `Fact "${key}" not found for persona "${personaId}"` }, 404);
    }
    return c.json(fact);
  });

  // PUT /memory/:personaId/facts/:key — set fact
  routes.put('/memory/:personaId/facts/:key', async (c) => {
    const personaId = c.req.param('personaId');
    const key = c.req.param('key');
    const body = await c.req.json();
    const { value } = body;

    if (value === undefined || value === null) {
      return c.json({ error: '"value" is required' }, 400);
    }

    const fact = personalMemory.setFact(personaId, key, String(value));
    return c.json(fact);
  });

  // DELETE /memory/:personaId/facts/:key — delete fact
  routes.delete('/memory/:personaId/facts/:key', (c) => {
    const personaId = c.req.param('personaId');
    const key = c.req.param('key');
    const deleted = personalMemory.deleteFact(personaId, key);
    if (!deleted) {
      return c.json({ error: `Fact "${key}" not found for persona "${personaId}"` }, 404);
    }
    return c.json({ deleted: true });
  });

  // GET /memory/:personaId/conversations — list conversation summaries
  routes.get('/memory/:personaId/conversations', (c) => {
    const personaId = c.req.param('personaId');
    const limit = Number(c.req.query('limit')) || undefined;
    const summaries = personalMemory.getSummaries(personaId, limit);
    return c.json({ summaries });
  });

  // POST /memory/:personaId/conversations — add conversation summary
  routes.post('/memory/:personaId/conversations', async (c) => {
    const personaId = c.req.param('personaId');
    const body = await c.req.json();
    const { date, summary, topics = [] } = body;

    if (!date || !summary) {
      return c.json({ error: '"date" and "summary" are required' }, 400);
    }

    const entry = personalMemory.addSummary(personaId, { personaId, date, summary, topics });
    return c.json(entry, 201);
  });

  return routes;
}

import { Hono } from 'hono';
import type { KnowledgeBase } from '@synapse/memory';

export function createKnowledgeRoutes(knowledgeBase: KnowledgeBase): Hono {
  const routes = new Hono();

  // GET /knowledge — list documents (optional query: personaId)
  routes.get('/knowledge', (c) => {
    const personaId = c.req.query('personaId');
    const docs = knowledgeBase.list(personaId);
    return c.json({ documents: docs });
  });

  // GET /knowledge/search — search (query: q, personaId)
  routes.get('/knowledge/search', (c) => {
    const q = c.req.query('q');
    const personaId = c.req.query('personaId');
    if (!q) {
      return c.json({ error: 'Query parameter "q" is required' }, 400);
    }
    const results = knowledgeBase.search(q, personaId);
    return c.json({ results });
  });

  // POST /knowledge — import document
  routes.post('/knowledge', async (c) => {
    const body = await c.req.json();
    const { personaId, title, content, source, tags = [] } = body;

    if (!personaId || !title || !content) {
      return c.json({ error: '"personaId", "title", and "content" are required' }, 400);
    }

    const doc = knowledgeBase.importDocument({ personaId, title, content, source, tags });
    return c.json(doc, 201);
  });

  // GET /knowledge/:id — get document
  routes.get('/knowledge/:id', (c) => {
    const id = c.req.param('id');
    const doc = knowledgeBase.get(id);
    if (!doc) {
      return c.json({ error: `Document "${id}" not found` }, 404);
    }
    return c.json(doc);
  });

  // DELETE /knowledge/:id — delete document
  routes.delete('/knowledge/:id', (c) => {
    const id = c.req.param('id');
    const deleted = knowledgeBase.delete(id);
    if (!deleted) {
      return c.json({ error: `Document "${id}" not found` }, 404);
    }
    return c.json({ deleted: true });
  });

  return routes;
}

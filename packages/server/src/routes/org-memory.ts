import { Hono } from 'hono';
import type { OrgMemoryStore } from '@synapse/memory';

export function createOrgMemoryRoutes(orgMemory: OrgMemoryStore): Hono {
  const routes = new Hono();

  // GET /org-memory — list entries (optional query: category)
  routes.get('/org-memory', (c) => {
    const category = c.req.query('category');
    const entries = orgMemory.list(category);
    return c.json({ entries });
  });

  // GET /org-memory/search — search (query: q, category)
  routes.get('/org-memory/search', (c) => {
    const q = c.req.query('q');
    const category = c.req.query('category');
    if (!q) {
      return c.json({ error: 'Query parameter "q" is required' }, 400);
    }
    const results = orgMemory.search(q, category);
    return c.json({ results });
  });

  // GET /org-memory/:id — get single entry
  routes.get('/org-memory/:id', (c) => {
    const id = c.req.param('id');
    const entry = orgMemory.get(id);
    if (!entry) {
      return c.json({ error: `Entry "${id}" not found` }, 404);
    }
    return c.json(entry);
  });

  // POST /org-memory — create entry
  routes.post('/org-memory', async (c) => {
    const body = await c.req.json();
    const { category, title, content, tags = [], createdBy = 'api' } = body;

    if (!category || !title || !content) {
      return c.json({ error: '"category", "title", and "content" are required' }, 400);
    }

    const entry = orgMemory.create({ category, title, content, tags, createdBy });
    return c.json(entry, 201);
  });

  // PUT /org-memory/:id — update entry
  routes.put('/org-memory/:id', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    const updates: Record<string, unknown> = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.content !== undefined) updates.content = body.content;
    if (body.tags !== undefined) updates.tags = body.tags;

    const updated = orgMemory.update(id, updates as Partial<Pick<import('@synapse/shared').OrgMemoryEntry, 'title' | 'content' | 'tags'>>);
    if (!updated) {
      return c.json({ error: `Entry "${id}" not found` }, 404);
    }
    return c.json(updated);
  });

  // DELETE /org-memory/:id — delete entry
  routes.delete('/org-memory/:id', (c) => {
    const id = c.req.param('id');
    const deleted = orgMemory.delete(id);
    if (!deleted) {
      return c.json({ error: `Entry "${id}" not found` }, 404);
    }
    return c.json({ deleted: true });
  });

  return routes;
}

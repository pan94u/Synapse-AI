import { Hono } from 'hono';
import type { PersonaRegistry } from '@synapse/personas';
import type { ToolRegistry } from '@synapse/agent-core';

export function createPersonaRoutes(personaRegistry: PersonaRegistry, toolRegistry?: ToolRegistry): Hono {
  const routes = new Hono();

  // GET /personas — list all personas
  routes.get('/personas', (c) => {
    const personas = personaRegistry.list();
    return c.json({
      personas: personas.map((p) => ({
        id: p.id,
        name: p.name,
        tagline: p.tagline,
        description: p.description,
        personality: p.personality,
        complianceRuleset: p.complianceRuleset,
      })),
    });
  });

  // GET /personas/:id — single persona details
  routes.get('/personas/:id', (c) => {
    const id = c.req.param('id');
    const persona = personaRegistry.get(id);
    if (!persona) {
      return c.json({ error: `Persona "${id}" not found` }, 404);
    }
    return c.json(persona);
  });

  // GET /personas/:id/tools — tools available for this persona
  routes.get('/personas/:id/tools', (c) => {
    const id = c.req.param('id');
    const persona = personaRegistry.get(id);
    if (!persona) {
      return c.json({ error: `Persona "${id}" not found` }, 404);
    }

    if (!toolRegistry) {
      return c.json({ tools: [], message: 'No tool registry available' });
    }

    const allowedTools = persona.allowedTools ?? [];
    const tools = toolRegistry.listForPersona(allowedTools);
    return c.json({
      personaId: id,
      tools: tools.map((t) => ({
        name: t.name,
        description: t.description,
      })),
    });
  });

  return routes;
}

import { Hono } from 'hono';
import type { MCPHub } from '@synapse/mcp-hub';
import type { MCPServerConfig } from '@synapse/shared';

export function createMCPRoutes(hub: MCPHub): Hono {
  const routes = new Hono();

  // GET /mcp/servers — list all MCP server statuses
  routes.get('/mcp/servers', (c) => {
    const servers = hub.getServerStatus();
    return c.json({ servers });
  });

  // GET /mcp/servers/:id — single server details
  routes.get('/mcp/servers/:id', (c) => {
    const id = c.req.param('id');
    const status = hub.getServerStatusById(id);
    if (!status) {
      return c.json({ error: `Server "${id}" not found` }, 404);
    }
    return c.json(status);
  });

  // POST /mcp/servers — add a new MCP server dynamically
  routes.post('/mcp/servers', async (c) => {
    try {
      const config = (await c.req.json()) as MCPServerConfig;
      if (!config.id || !config.name) {
        return c.json({ error: 'id and name are required' }, 400);
      }
      await hub.addServer(config);
      const status = hub.getServerStatusById(config.id);
      return c.json({ success: true, status }, 201);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return c.json({ error: message }, 500);
    }
  });

  // DELETE /mcp/servers/:id — remove an MCP server
  routes.delete('/mcp/servers/:id', async (c) => {
    const id = c.req.param('id');
    try {
      await hub.removeServer(id);
      return c.json({ success: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return c.json({ error: message }, 500);
    }
  });

  // POST /mcp/servers/:id/restart — restart a server
  routes.post('/mcp/servers/:id/restart', async (c) => {
    const id = c.req.param('id');
    try {
      await hub.restartServer(id);
      const status = hub.getServerStatusById(id);
      return c.json({ success: true, status });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return c.json({ error: message }, 500);
    }
  });

  // GET /mcp/tools — list all aggregated MCP tools
  routes.get('/mcp/tools', async (c) => {
    try {
      const tools = await hub.getTools();
      return c.json({
        tools: tools.map((t) => {
          // Extract serverId from prefixed tool name (format: {serverId}_{toolName})
          const underscoreIdx = t.definition.name.indexOf('_');
          const server = underscoreIdx > 0
            ? t.definition.name.slice(0, underscoreIdx)
            : '';
          return {
            name: t.definition.name,
            description: t.definition.description,
            server,
            permission: t.permission,
          };
        }),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return c.json({ error: message }, 500);
    }
  });

  // GET /mcp/audit — query audit log
  routes.get('/mcp/audit', (c) => {
    const serverId = c.req.query('serverId');
    const limit = Number(c.req.query('limit')) || 100;
    const entries = hub.getAuditLog({ serverId, limit });
    return c.json({ entries });
  });

  return routes;
}

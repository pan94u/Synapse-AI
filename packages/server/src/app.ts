import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { MCPHub } from '@synapse/mcp-hub';
import { createDefaultAgent, createAgentWithMCP } from '@synapse/agent-core';
import { chatRoutes } from './routes/chat.js';
import { createAgentRoutes } from './routes/agent.js';
import { createMCPRoutes } from './routes/mcp.js';

export async function createApp(): Promise<{ app: Hono; hub: MCPHub }> {
  const app = new Hono();
  const hub = new MCPHub();

  app.use('*', logger());
  app.use('*', cors());

  app.get('/health', (c) => c.json({ status: 'ok' }));

  // Chat routes (model router only, no tools)
  app.route('/api', chatRoutes);

  // MCP management routes (always available)
  app.route('/api', createMCPRoutes(hub));

  // Initialize MCP Hub and create agent
  try {
    await hub.start();
    const mcpTools = await hub.getTools();
    const agent = createAgentWithMCP(mcpTools);
    app.route('/api', createAgentRoutes(agent));
    console.log('[server] MCP Hub initialized, agent has MCP tools');
  } catch (err) {
    console.warn('[server] MCP Hub init failed, using default agent:', err);
    const agent = createDefaultAgent();
    app.route('/api', createAgentRoutes(agent));
  }

  return { app, hub };
}

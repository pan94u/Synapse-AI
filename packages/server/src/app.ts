import { resolve } from 'node:path';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { MCPHub } from '@synapse/mcp-hub';
import { PersonaRegistry, loadAllPersonas } from '@synapse/personas';
import { ComplianceEngine, ComplianceAuditTrail, ApprovalManager } from '@synapse/compliance';
import { chatRoutes } from './routes/chat.js';
import { createAgentRoutes } from './routes/agent.js';
import { createMCPRoutes } from './routes/mcp.js';
import { createPersonaRoutes } from './routes/personas.js';
import { createComplianceRoutes } from './routes/compliance.js';

export async function createApp(): Promise<{ app: Hono; hub: MCPHub }> {
  const app = new Hono();
  const hub = new MCPHub();

  app.use('*', logger());
  app.use('*', cors());

  app.get('/health', (c) => c.json({ status: 'ok' }));

  // Initialize Persona Registry
  const personaRegistry = new PersonaRegistry();
  try {
    const personas = loadAllPersonas(resolve(process.cwd(), 'config/personas'));
    for (const p of personas) personaRegistry.register(p);
    console.log(`[server] Loaded ${personas.length} personas: ${personas.map((p) => p.id).join(', ')}`);
  } catch (err) {
    console.warn('[server] Failed to load personas:', err);
  }

  // Initialize Compliance Engine
  const complianceEngine = new ComplianceEngine(resolve(process.cwd(), 'config/compliance/rules'));
  await complianceEngine.initialize();
  const auditTrail = new ComplianceAuditTrail();
  const approvalManager = new ApprovalManager();

  // Chat routes (model router only, no tools)
  app.route('/api', chatRoutes);

  // MCP management routes (always available)
  app.route('/api', createMCPRoutes(hub));

  // Persona routes
  let toolRegistry: import('@synapse/agent-core').ToolRegistry | undefined;

  // Compliance routes
  app.route('/api', createComplianceRoutes(complianceEngine, auditTrail, approvalManager));

  // Initialize MCP Hub and create agent
  try {
    await hub.start();
    const mcpTools = await hub.getTools();

    // Create a tool registry for persona tool listing
    const { ToolRegistry, registerBuiltInTools } = await import('@synapse/agent-core');
    toolRegistry = new ToolRegistry();
    registerBuiltInTools(toolRegistry);
    for (const t of mcpTools) {
      toolRegistry.register(t as import('@synapse/agent-core').Tool);
    }

    app.route('/api', createPersonaRoutes(personaRegistry, toolRegistry));
    app.route('/api', createAgentRoutes({
      mcpTools,
      personaRegistry,
      complianceEngine,
      auditTrail,
    }));
    console.log('[server] MCP Hub initialized, agent has MCP tools');
  } catch (err) {
    console.warn('[server] MCP Hub init failed, using default agent:', err);

    // Still create tool registry with built-in tools for persona listing
    const { ToolRegistry, registerBuiltInTools } = await import('@synapse/agent-core');
    toolRegistry = new ToolRegistry();
    registerBuiltInTools(toolRegistry);

    app.route('/api', createPersonaRoutes(personaRegistry, toolRegistry));
    app.route('/api', createAgentRoutes({
      personaRegistry,
      complianceEngine,
      auditTrail,
    }));
  }

  return { app, hub };
}

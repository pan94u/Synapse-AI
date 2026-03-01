import { resolve } from 'node:path';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { MCPHub } from '@synapse/mcp-hub';
import { PersonaRegistry, loadAllPersonas } from '@synapse/personas';
import { ComplianceEngine, ComplianceAuditTrail, ApprovalManager } from '@synapse/compliance';
import { OrgMemoryStore, PersonalMemoryStore, KnowledgeBase } from '@synapse/memory';
import { ProactiveTaskManager } from '@synapse/proactive';
import { DecisionEngine } from '@synapse/decision-engine';
import type { ProactiveTaskConfig } from '@synapse/shared';
import { chatRoutes } from './routes/chat.js';
import { createAgentRoutes } from './routes/agent.js';
import { createMCPRoutes } from './routes/mcp.js';
import { createPersonaRoutes } from './routes/personas.js';
import { createComplianceRoutes } from './routes/compliance.js';
import { createOrgMemoryRoutes } from './routes/org-memory.js';
import { createMemoryRoutes } from './routes/memory.js';
import { createKnowledgeRoutes } from './routes/knowledge.js';
import { createProactiveRoutes } from './routes/proactive.js';
import { createDecisionRoutes } from './routes/decision.js';

export async function createApp(): Promise<{ app: Hono; hub: MCPHub; proactiveManager?: ProactiveTaskManager; decisionEngine?: DecisionEngine }> {
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

  // Initialize Memory stores
  const orgMemory = new OrgMemoryStore(resolve(process.cwd(), 'data/org-memory'));
  const personalMemory = new PersonalMemoryStore(resolve(process.cwd(), 'data/memory'));
  const knowledgeBase = new KnowledgeBase(resolve(process.cwd(), 'data/knowledge'));
  console.log('[server] Memory stores initialized');

  // Chat routes (model router only, no tools)
  app.route('/api', chatRoutes);

  // MCP management routes (always available)
  app.route('/api', createMCPRoutes(hub));

  // Persona routes
  let toolRegistry: import('@synapse/agent-core').ToolRegistry | undefined;

  // Compliance routes
  app.route('/api', createComplianceRoutes(complianceEngine, auditTrail, approvalManager));

  // Memory routes
  app.route('/api', createOrgMemoryRoutes(orgMemory));
  app.route('/api', createMemoryRoutes(personalMemory));
  app.route('/api', createKnowledgeRoutes(knowledgeBase));

  // Initialize MCP Hub and create agent
  let agentRouteDeps: {
    mcpTools?: import('@synapse/agent-core').MCPToolAdapter[];
    personaRegistry: PersonaRegistry;
    complianceEngine: ComplianceEngine;
    auditTrail: ComplianceAuditTrail;
    orgMemory: OrgMemoryStore;
    personalMemory: PersonalMemoryStore;
    knowledgeBase: KnowledgeBase;
  } = { personaRegistry, complianceEngine, auditTrail, orgMemory, personalMemory, knowledgeBase };

  try {
    await hub.start();
    const mcpTools = await hub.getTools();
    agentRouteDeps = { ...agentRouteDeps, mcpTools };

    // Create a tool registry for persona tool listing
    const { ToolRegistry, registerBuiltInTools, registerMemoryTools } = await import('@synapse/agent-core');
    toolRegistry = new ToolRegistry();
    registerBuiltInTools(toolRegistry);
    for (const t of mcpTools) {
      toolRegistry.register(t as import('@synapse/agent-core').Tool);
    }
    // Register memory tools for persona tool listing
    registerMemoryTools(toolRegistry, {
      orgMemory, personalMemory, knowledgeBase,
      personaId: '_listing', orgMemoryAccess: [],
    });

    app.route('/api', createPersonaRoutes(personaRegistry, toolRegistry));
    app.route('/api', createAgentRoutes(agentRouteDeps));
    console.log('[server] MCP Hub initialized, agent has MCP tools');
  } catch (err) {
    console.warn('[server] MCP Hub init failed, using default agent:', err);

    // Still create tool registry with built-in tools for persona listing
    const { ToolRegistry, registerBuiltInTools, registerMemoryTools } = await import('@synapse/agent-core');
    toolRegistry = new ToolRegistry();
    registerBuiltInTools(toolRegistry);
    registerMemoryTools(toolRegistry, {
      orgMemory, personalMemory, knowledgeBase,
      personaId: '_listing', orgMemoryAccess: [],
    });

    app.route('/api', createPersonaRoutes(personaRegistry, toolRegistry));
    app.route('/api', createAgentRoutes(agentRouteDeps));
  }

  // Initialize Proactive Task Manager
  let proactiveManager: ProactiveTaskManager | undefined;
  try {
    const { createAgentWithCompliance } = await import('@synapse/agent-core');
    const mcpTools = agentRouteDeps.mcpTools;

    // agentExecutor callback — reuses Agent creation logic from agent routes
    const agentExecutor = async (personaId: string, userMessage: string) => {
      const allToolNames = [
        ...(mcpTools ? mcpTools.map((t) => t.definition.name) : []),
        'file_read', 'file_write', 'file_search', 'shell_exec', 'web_fetch',
        ...(orgMemory ? ['memory_read', 'memory_write', 'knowledge_search'] : []),
      ];
      const personaContext = personaRegistry.buildContext(personaId, allToolNames);
      if (!personaContext) {
        throw new Error(`Persona "${personaId}" not found`);
      }

      let complianceHooks: import('@synapse/agent-core').ComplianceHooks | undefined;
      if (complianceEngine && auditTrail) {
        const rulesetId = personaContext.complianceRuleset;
        complianceHooks = {
          preCheck: (params) => complianceEngine.preCheck({ ...params, rulesetId }),
          postCheck: (params) => complianceEngine.postCheck({ ...params, rulesetId }),
          recordAudit: (entry) => auditTrail.record(entry),
        };
      }

      let memoryToolDeps: import('@synapse/agent-core').MemoryToolDeps | undefined;
      if (orgMemory && personalMemory && knowledgeBase) {
        const personaConfig = personaRegistry.get(personaId);
        memoryToolDeps = {
          orgMemory, personalMemory, knowledgeBase,
          personaId,
          orgMemoryAccess: personaConfig?.orgMemoryAccess ?? [],
        };
      }

      const agent = createAgentWithCompliance({
        mcpTools,
        personaContext,
        complianceHooks,
        memoryToolDeps,
      });

      const result = await agent.run([{ role: 'user', content: userMessage }]);
      return {
        content: result.message.content,
        model: result.model,
        toolCallsExecuted: result.toolCallsExecuted,
      };
    };

    // getProactiveTasks callback — extracts from PersonaRegistry
    const getProactiveTasks = (): ProactiveTaskConfig[] => {
      const tasks: ProactiveTaskConfig[] = [];
      for (const persona of personaRegistry.list()) {
        for (const task of persona.proactiveTasks ?? []) {
          tasks.push({
            id: `${persona.id}:${task.action}`,
            personaId: persona.id,
            schedule: task.schedule,
            trigger: task.trigger,
            action: task.action,
          });
        }
      }
      return tasks;
    };

    proactiveManager = new ProactiveTaskManager({
      agentExecutor,
      getProactiveTasks,
      actionConfigDir: resolve(process.cwd(), 'config/proactive/actions'),
      monitorConfigDir: resolve(process.cwd(), 'config/proactive/monitors'),
      historyDataDir: resolve(process.cwd(), 'data/proactive/history'),
      notificationDataDir: resolve(process.cwd(), 'data/proactive/notifications'),
    });

    proactiveManager.initialize();
    proactiveManager.start();

    app.route('/api', createProactiveRoutes(proactiveManager));
    console.log('[server] Proactive Task Manager initialized and started');
  } catch (err) {
    console.warn('[server] Failed to initialize Proactive Task Manager:', err);
  }

  // Initialize Decision Engine
  let decisionEngine: DecisionEngine | undefined;
  try {
    const { createAgentWithCompliance } = await import('@synapse/agent-core');
    const mcpTools = agentRouteDeps.mcpTools;

    // Reuse same agentExecutor pattern
    const decisionAgentExecutor = async (personaId: string, userMessage: string) => {
      const allToolNames = [
        ...(mcpTools ? mcpTools.map((t) => t.definition.name) : []),
        'file_read', 'file_write', 'file_search', 'shell_exec', 'web_fetch',
        ...(orgMemory ? ['memory_read', 'memory_write', 'knowledge_search'] : []),
      ];
      const personaContext = personaRegistry.buildContext(personaId, allToolNames);
      if (!personaContext) {
        throw new Error(`Persona "${personaId}" not found`);
      }

      let complianceHooks: import('@synapse/agent-core').ComplianceHooks | undefined;
      if (complianceEngine && auditTrail) {
        const rulesetId = personaContext.complianceRuleset;
        complianceHooks = {
          preCheck: (params) => complianceEngine.preCheck({ ...params, rulesetId }),
          postCheck: (params) => complianceEngine.postCheck({ ...params, rulesetId }),
          recordAudit: (entry) => auditTrail.record(entry),
        };
      }

      let memoryToolDeps: import('@synapse/agent-core').MemoryToolDeps | undefined;
      if (orgMemory && personalMemory && knowledgeBase) {
        const personaConfig = personaRegistry.get(personaId);
        memoryToolDeps = {
          orgMemory, personalMemory, knowledgeBase,
          personaId,
          orgMemoryAccess: personaConfig?.orgMemoryAccess ?? [],
        };
      }

      const agent = createAgentWithCompliance({
        mcpTools,
        personaContext,
        complianceHooks,
        memoryToolDeps,
      });

      const result = await agent.run([{ role: 'user', content: userMessage }]);
      return {
        content: result.message.content,
        model: result.model,
        toolCallsExecuted: result.toolCallsExecuted,
      };
    };

    // Optional: connect insights to proactive notification system
    const notifyCallback = proactiveManager
      ? (personaId: string, title: string, content: string, severity: string) => {
          proactiveManager!.getNotificationStore().create({
            personaId,
            title,
            content,
            source: 'decision-engine',
            severity: severity as 'info' | 'warning' | 'critical',
          });
        }
      : undefined;

    decisionEngine = new DecisionEngine({
      agentExecutor: decisionAgentExecutor,
      metricsConfigDir: resolve(process.cwd(), 'config/decision'),
      strategyConfigDir: resolve(process.cwd(), 'config/decision'),
      dataDir: resolve(process.cwd(), 'data/decision'),
      notifyCallback,
    });

    decisionEngine.initialize();
    decisionEngine.start();

    app.route('/api', createDecisionRoutes(decisionEngine));
    console.log('[server] Decision Engine initialized and started');
  } catch (err) {
    console.warn('[server] Failed to initialize Decision Engine:', err);
  }

  return { app, hub, proactiveManager, decisionEngine };
}

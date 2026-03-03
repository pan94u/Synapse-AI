import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import type { ChatRequest } from '@synapse/shared';
import {
  Agent,
  createAgentWithCompliance,
  createDefaultAgent,
  registerSkillTool,
  type MCPToolAdapter,
  type ComplianceHooks,
  type MemoryToolDeps,
  type SkillToolDeps,
} from '@synapse/agent-core';
import type { PersonaRegistry } from '@synapse/personas';
import type { ComplianceEngine, ComplianceAuditTrail } from '@synapse/compliance';
import type { OrgMemoryStore, PersonalMemoryStore, KnowledgeBase } from '@synapse/memory';

interface AgentRouteDeps {
  mcpTools?: MCPToolAdapter[];
  personaRegistry?: PersonaRegistry;
  complianceEngine?: ComplianceEngine;
  auditTrail?: ComplianceAuditTrail;
  orgMemory?: OrgMemoryStore;
  personalMemory?: PersonalMemoryStore;
  knowledgeBase?: KnowledgeBase;
  skillToolDeps?: SkillToolDeps;
}

interface AgentRequest extends ChatRequest {
  personaId?: string;
}

export function createAgentRoutes(deps: AgentRouteDeps): Hono {
  const routes = new Hono();

  routes.post('/agent', async (c) => {
    const body = await c.req.json<AgentRequest>();
    const { messages, model, routingStrategy, stream = true, personaId } = body;

    if (!messages || messages.length === 0) {
      return c.json({ error: 'messages is required and must not be empty' }, 400);
    }

    const strategy = routingStrategy ?? 'default';

    // Build agent per request — supports persona and compliance
    let agent: Agent;
    if (personaId && deps.personaRegistry) {
      const allToolNames = [
        ...(deps.mcpTools ? deps.mcpTools.map((t) => t.definition.name) : []),
        // Built-in tools
        'file_read', 'file_write', 'file_search', 'shell_exec', 'web_fetch',
        // Memory tools (always available when memory stores exist)
        ...(deps.orgMemory ? ['memory_read', 'memory_write', 'knowledge_search'] : []),
        // Skill tool
        ...(deps.skillToolDeps ? ['skill_execute'] : []),
      ];

      const personaContext = deps.personaRegistry.buildContext(personaId, allToolNames);
      if (!personaContext) {
        return c.json({ error: `Persona "${personaId}" not found` }, 404);
      }

      let complianceHooks: ComplianceHooks | undefined;
      if (deps.complianceEngine && deps.auditTrail) {
        const engine = deps.complianceEngine;
        const auditTrail = deps.auditTrail;
        const rulesetId = personaContext.complianceRuleset;

        complianceHooks = {
          preCheck: (params) =>
            engine.preCheck({ ...params, rulesetId }),
          postCheck: (params) =>
            engine.postCheck({ ...params, rulesetId }),
          recordAudit: (entry) => auditTrail.record(entry),
        };
      }

      // Build memory tool deps if stores are available
      let memoryToolDeps: MemoryToolDeps | undefined;
      if (deps.orgMemory && deps.personalMemory && deps.knowledgeBase) {
        const personaConfig = deps.personaRegistry.get(personaId);
        memoryToolDeps = {
          orgMemory: deps.orgMemory,
          personalMemory: deps.personalMemory,
          knowledgeBase: deps.knowledgeBase,
          personaId,
          orgMemoryAccess: personaConfig?.orgMemoryAccess ?? [],
        };
      }

      // Build skill tool deps scoped to this persona
      let skillToolDeps: SkillToolDeps | undefined;
      if (deps.skillToolDeps) {
        skillToolDeps = { ...deps.skillToolDeps, currentPersonaId: personaId };
      }

      agent = createAgentWithCompliance({
        mcpTools: deps.mcpTools,
        personaContext,
        complianceHooks,
        memoryToolDeps,
        skillToolDeps,
      });
    } else if (deps.mcpTools && deps.mcpTools.length > 0) {
      const { createAgentWithMCP } = await import('@synapse/agent-core');
      agent = createAgentWithMCP(deps.mcpTools);
    } else {
      agent = createDefaultAgent();
    }

    try {
      if (!stream) {
        const result = await agent.run(messages, strategy, model);
        return c.json(result);
      }

      return streamSSE(c, async (sseStream) => {
        try {
          for await (const event of agent.runStream(messages, strategy, model)) {
            await sseStream.writeSSE({
              data: JSON.stringify(event),
              event: event.type,
            });
          }

          await sseStream.writeSSE({ data: '[DONE]', event: 'message' });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown streaming error';
          console.error('Agent stream error:', err);
          await sseStream.writeSSE({
            data: JSON.stringify({ error: message }),
            event: 'error',
          });
        }
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Agent error:', err);
      return c.json({ error: message }, 500);
    }
  });

  return routes;
}

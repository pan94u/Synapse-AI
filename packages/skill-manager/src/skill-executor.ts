import type { SkillExecution } from '@synapse/shared';
import type { SkillRegistry } from './skill-registry.js';
import type { ExecutionHistory } from './execution-history.js';

/** Server 层提供的 Agent 执行回调，支持工具域限定 */
export type ScopedAgentExecutor = (
  personaId: string,
  userMessage: string,
  allowedTools?: string[],
) => Promise<{ content: string; model: string; toolCallsExecuted: number }>;

export class SkillExecutor {
  private executor: ScopedAgentExecutor;
  private registry: SkillRegistry;
  private history: ExecutionHistory;

  constructor(executor: ScopedAgentExecutor, registry: SkillRegistry, history: ExecutionHistory) {
    this.executor = executor;
    this.registry = registry;
    this.history = history;
  }

  async execute(
    skillId: string,
    personaId: string,
    parameters: Record<string, string>,
    triggerType: SkillExecution['triggerType'] = 'manual',
  ): Promise<SkillExecution> {
    // 1. Get skill definition
    const skill = this.registry.get(skillId);
    if (!skill) {
      return this.history.recordStart({
        skillId,
        personaId,
        triggerType,
        parameters,
        status: 'error',
        error: `Skill "${skillId}" not found`,
        startedAt: new Date().toISOString(),
      });
    }

    if (skill.status !== 'active') {
      return this.history.recordStart({
        skillId,
        personaId,
        triggerType,
        parameters,
        status: 'error',
        error: `Skill "${skillId}" is ${skill.status}, not active`,
        startedAt: new Date().toISOString(),
      });
    }

    // 2. Validate required parameters
    for (const param of skill.parameters) {
      if (param.required && !(param.name in parameters)) {
        return this.history.recordStart({
          skillId,
          personaId,
          triggerType,
          parameters,
          status: 'error',
          error: `Missing required parameter: "${param.name}"`,
          startedAt: new Date().toISOString(),
        });
    }
    }

    // 3. Build execution prompt
    const prompt = buildExecutionPrompt(skill.instructions, skill.parameters, parameters);

    // 4. Record start
    const execution = this.history.recordStart({
      skillId,
      personaId,
      triggerType,
      parameters,
      status: 'running',
      startedAt: new Date().toISOString(),
    });

    try {
      // 5. Execute via scoped agent (with tool domain restriction)
      const agentResult = await this.executor(
        personaId,
        prompt,
        skill.allowedTools.length > 0 ? skill.allowedTools : undefined,
      );

      // 6. Record completion
      const completed = this.history.recordComplete(execution.id, {
        status: 'success',
        result: agentResult.content,
        model: agentResult.model,
        toolCallsExecuted: agentResult.toolCallsExecuted,
      });

      return completed ?? execution;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[SkillExecutor] Skill "${skillId}" failed:`, err);

      const completed = this.history.recordComplete(execution.id, {
        status: 'error',
        error: errorMessage,
      });

      return completed ?? execution;
    }
  }
}

/** Build the execution prompt from skill instructions + parameters */
function buildExecutionPrompt(
  instructions: string,
  paramDefs: { name: string; description: string; default?: string | number | boolean }[],
  parameters: Record<string, string>,
): string {
  const parts: string[] = [];

  parts.push('## 技能指令\n');
  parts.push(instructions);

  // Append parameter values
  if (paramDefs.length > 0) {
    parts.push('\n\n## 参数\n');
    for (const def of paramDefs) {
      const value = parameters[def.name] ?? def.default ?? '(未提供)';
      parts.push(`- **${def.name}** (${def.description}): ${value}`);
    }
  }

  parts.push('\n\n请根据上述指令和参数执行任务，并返回结果。');

  return parts.join('\n');
}

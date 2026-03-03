import type { Tool } from '../types.js';

/** Structure-typed deps to avoid importing @synapse/skill-manager */
export interface SkillToolDeps {
  executeSkill: (
    skillId: string,
    personaId: string,
    parameters: Record<string, string>,
  ) => Promise<{ status: string; result?: string; error?: string }>;
  listSkills: (
    personaId: string,
  ) => Array<{ id: string; name: string; description: string; category: string }>;
  currentPersonaId: string;
}

export function createSkillExecuteTool(deps: SkillToolDeps): Tool {
  // Build dynamic description with available skills
  const availableSkills = deps.listSkills(deps.currentPersonaId);
  const skillListText = availableSkills.length > 0
    ? availableSkills.map((s) => `- ${s.id}: ${s.description}`).join('\n')
    : '(无可用技能)';

  return {
    definition: {
      name: 'skill_execute',
      description:
        `执行一个预定义的业务技能（Skill）。技能是可复用的业务流程模板，包含预设的指令和工具域限定。\n\n当前可用技能:\n${skillListText}`,
      parameters: {
        type: 'object',
        properties: {
          skill_id: {
            type: 'string',
            description: '要执行的技能 ID (kebab-case)',
          },
          parameters: {
            type: 'object',
            description: '技能参数（key-value 形式）',
            additionalProperties: { type: 'string' },
          },
        },
        required: ['skill_id'],
      },
    },
    permission: 'ask',

    async execute(args) {
      const skillId = args.skill_id as string;
      const parameters = (args.parameters as Record<string, string>) ?? {};

      try {
        const result = await deps.executeSkill(skillId, deps.currentPersonaId, parameters);

        if (result.status === 'success') {
          return result.result ?? '技能执行成功';
        }
        return JSON.stringify({ error: result.error ?? '技能执行失败' });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return JSON.stringify({ error: message });
      }
    },
  };
}

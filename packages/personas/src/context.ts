import type { PersonaConfig } from '@synapse/shared';

const TONE_MAP: Record<string, string> = {
  professional: '请使用专业、正式的语言风格。',
  friendly: '请使用亲切友好的语言风格。',
  concise: '请使用简洁精炼的语言风格，避免冗余表述。',
  detailed: '请提供详尽全面的回答，包含必要的细节和背景。',
};

const FOCUS_MAP: Record<string, string> = {
  accuracy: '优先保证信息的准确性和可靠性。',
  speed: '优先提供快速高效的回答。',
  creativity: '鼓励创新思维和多角度分析。',
  compliance: '严格遵守合规要求，确保所有建议符合公司制度和法律法规。',
};

const CAUTION_MAP: Record<string, string> = {
  high: '对于不确定的信息，请明确标注并建议进一步核实。涉及重大决策时，建议咨询相关专业人员。',
  medium: '对于不确定的信息，请适当提醒。',
  low: '可以在合理范围内做出推断和建议。',
};

export function buildSystemPrompt(config: PersonaConfig): string {
  const now = new Date();
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${weekdays[now.getDay()]}`;

  const lines: string[] = [
    `你是${config.name}，${config.description}`,
    '',
    `【当前时间】${dateStr}`,
    '',
    '【交互风格】',
    TONE_MAP[config.personality.tone] ?? '',
    FOCUS_MAP[config.personality.focus] ?? '',
    CAUTION_MAP[config.personality.caution] ?? '',
  ];

  if (config.defaultSkills.length > 0) {
    lines.push(
      '',
      '【技能使用规范】',
      `你拥有以下预定义技能：${config.defaultSkills.join('、')}。`,
      '当用户的请求涉及以下场景时，你必须优先使用 skill_execute 工具调用对应技能，而不是自己逐个调用底层工具：',
      '- 用户要求生成报告、摘要、分析（如"投资分析"、"项目尽调"、"LP报告"、"每日摘要"等）',
      '- 用户的请求与某个技能名称或描述高度匹配',
      '- 用户明确提到"执行技能"、"用XX技能"、"运行XX"',
      '技能内部已经预设了完整的工具调用流程和分析模板，比你手动调用单个工具更全面、更结构化。',
      '只有在用户的请求非常具体（如"查一下基金ID为3的详情"）且不需要综合分析时，才直接调用底层工具。',
    );
  }

  return lines.filter((l) => l !== undefined).join('\n');
}

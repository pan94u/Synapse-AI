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
  const lines: string[] = [
    `你是${config.name}，${config.description}`,
    '',
    '【交互风格】',
    TONE_MAP[config.personality.tone] ?? '',
    FOCUS_MAP[config.personality.focus] ?? '',
    CAUTION_MAP[config.personality.caution] ?? '',
  ];

  if (config.defaultSkills.length > 0) {
    lines.push('', `【可用技能】${config.defaultSkills.join('、')}`);
  }

  return lines.filter((l) => l !== undefined).join('\n');
}

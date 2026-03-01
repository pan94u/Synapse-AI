import type { PersonaConfig, PersonaContext } from '@synapse/shared';
import { buildSystemPrompt } from './context.js';

function matchGlob(pattern: string, name: string): boolean {
  if (pattern === '*') return true;
  if (pattern.endsWith('*')) {
    return name.startsWith(pattern.slice(0, -1));
  }
  return pattern === name;
}

function filterToolsByPatterns(patterns: string[], availableTools: string[]): string[] {
  if (!patterns || patterns.length === 0) return availableTools;
  return availableTools.filter((tool) => patterns.some((p) => matchGlob(p, tool)));
}

export class PersonaRegistry {
  private personas = new Map<string, PersonaConfig>();

  register(config: PersonaConfig): void {
    this.personas.set(config.id, config);
  }

  get(id: string): PersonaConfig | undefined {
    return this.personas.get(id);
  }

  list(): PersonaConfig[] {
    return Array.from(this.personas.values());
  }

  buildContext(id: string, availableTools: string[]): PersonaContext | undefined {
    const config = this.personas.get(id);
    if (!config) return undefined;

    const allowedTools = config.allowedTools
      ? filterToolsByPatterns(config.allowedTools, availableTools)
      : availableTools;

    return {
      personaId: config.id,
      personaName: config.name,
      systemPromptAddition: buildSystemPrompt(config),
      allowedTools,
      complianceRuleset: config.complianceRuleset,
    };
  }
}

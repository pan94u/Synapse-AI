import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import type { ActionDefinition } from '@synapse/shared';

interface RawAction {
  id: string;
  name: string;
  description: string;
  type?: 'schedule' | 'event' | 'threshold';
  schedule?: string;
  enabled?: boolean;
  prompt_template: string;
  variables?: Record<string, string>;
  target_model?: string;
  max_iterations?: number;
}

export function loadAllActions(configDir: string): Map<string, ActionDefinition> {
  const actions = new Map<string, ActionDefinition>();

  if (!existsSync(configDir)) return actions;

  const files = readdirSync(configDir).filter(
    (f) => f.endsWith('.yaml') || f.endsWith('.yml'),
  );

  for (const file of files) {
    try {
      const content = readFileSync(join(configDir, file), 'utf-8');
      const raw = parseYaml(content) as RawAction;

      const action: ActionDefinition = {
        id: raw.id,
        name: raw.name,
        description: raw.description,
        type: raw.type ?? 'schedule',
        schedule: raw.schedule,
        enabled: raw.enabled ?? true,
        promptTemplate: raw.prompt_template,
        variables: raw.variables,
        targetModel: raw.target_model,
        maxIterations: raw.max_iterations,
      };

      actions.set(action.id, action);
    } catch (err) {
      console.warn(`[ActionLoader] Failed to load ${file}:`, err);
    }
  }

  return actions;
}

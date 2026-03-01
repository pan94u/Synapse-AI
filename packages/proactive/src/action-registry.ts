import type { ActionDefinition } from '@synapse/shared';
import { loadAllActions } from './action-loader.js';

export class ActionRegistry {
  private actions = new Map<string, ActionDefinition>();

  loadFromDir(configDir: string): void {
    const loaded = loadAllActions(configDir);
    for (const [id, action] of loaded) {
      this.actions.set(id, action);
    }
  }

  register(action: ActionDefinition): void {
    this.actions.set(action.id, action);
  }

  get(id: string): ActionDefinition | undefined {
    return this.actions.get(id);
  }

  list(): ActionDefinition[] {
    return Array.from(this.actions.values());
  }

  renderPrompt(actionId: string, variables?: Record<string, string>): string | undefined {
    const action = this.actions.get(actionId);
    if (!action) return undefined;

    const mergedVars: Record<string, string> = {
      ...action.variables,
      ...variables,
      CURRENT_DATE: new Date().toISOString().split('T')[0],
    };

    let prompt = action.promptTemplate;
    for (const [key, value] of Object.entries(mergedVars)) {
      prompt = prompt.replaceAll(`{{${key}}}`, value);
    }

    return prompt;
  }
}

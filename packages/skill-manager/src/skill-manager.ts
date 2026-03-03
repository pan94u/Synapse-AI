import type { SkillDefinition, SkillExecution, SkillCategory, SkillSource, SkillStatus } from '@synapse/shared';
import { SkillRegistry } from './skill-registry.js';
import { SkillStore, type CreateSkillInput, type UpdateSkillInput } from './skill-store.js';
import { ExecutionHistory } from './execution-history.js';
import { SkillExecutor, type ScopedAgentExecutor } from './skill-executor.js';

export interface SkillManagerConfig {
  agentExecutor: ScopedAgentExecutor;
  builtInSkillsDir: string;     // config/skills/
  customSkillsDir: string;      // data/skills/
  historyDataDir: string;       // data/skill-history/
}

export class SkillManager {
  private registry: SkillRegistry;
  private store: SkillStore;
  private history: ExecutionHistory;
  private executor: SkillExecutor;

  constructor(config: SkillManagerConfig) {
    this.registry = new SkillRegistry();
    this.store = new SkillStore(config.customSkillsDir);
    this.history = new ExecutionHistory(config.historyDataDir);
    this.executor = new SkillExecutor(config.agentExecutor, this.registry, this.history);

    // Load built-in skills
    this.registry.loadFromDir(config.builtInSkillsDir, 'built-in');

    // Load custom skills
    const customSkills = this.store.list();
    for (const skill of customSkills) {
      this.registry.register(skill);
    }
  }

  initialize(): void {
    const builtIn = this.registry.listBySource('built-in').length;
    const custom = this.registry.listBySource('custom').length;
    console.log(`[SkillManager] Initialized: ${builtIn} built-in, ${custom} custom skills`);
  }

  // === Execution ===

  async executeSkill(
    skillId: string,
    personaId: string,
    parameters: Record<string, string>,
    triggerType?: SkillExecution['triggerType'],
  ): Promise<SkillExecution> {
    return this.executor.execute(skillId, personaId, parameters, triggerType);
  }

  // === Custom Skill CRUD ===

  createCustomSkill(input: CreateSkillInput): SkillDefinition {
    const skill = this.store.create(input);
    this.registry.register(skill);
    return skill;
  }

  updateCustomSkill(id: string, updates: UpdateSkillInput): SkillDefinition | undefined {
    const updated = this.store.update(id, updates);
    if (updated) {
      this.registry.register(updated); // overwrite in registry
    }
    return updated;
  }

  deleteCustomSkill(id: string): boolean {
    const skill = this.registry.get(id);
    if (!skill || skill.source !== 'custom') return false;

    const deleted = this.store.delete(id);
    if (deleted) {
      this.registry.unregister(id);
    }
    return deleted;
  }

  setSkillStatus(id: string, status: SkillStatus): boolean {
    const skill = this.registry.get(id);
    if (!skill) return false;

    if (skill.source === 'custom') {
      const success = this.store.setStatus(id, status);
      if (success) {
        const updated = this.store.get(id);
        if (updated) this.registry.register(updated);
      }
      return success;
    }

    // For built-in skills, update in-memory only
    skill.status = status;
    this.registry.register(skill);
    return true;
  }

  // === Query ===

  listSkills(filter?: {
    category?: SkillCategory;
    source?: SkillSource;
    personaId?: string;
    defaultSkillPatterns?: string[];
  }): SkillDefinition[] {
    let skills: SkillDefinition[];

    if (filter?.defaultSkillPatterns && filter.defaultSkillPatterns.length > 0) {
      skills = this.registry.listForPersona(filter.defaultSkillPatterns);
    } else {
      skills = this.registry.list();
    }

    if (filter?.category) {
      skills = skills.filter((s) => s.category === filter.category);
    }
    if (filter?.source) {
      skills = skills.filter((s) => s.source === filter.source);
    }

    return skills;
  }

  getSkill(id: string): SkillDefinition | undefined {
    return this.registry.get(id);
  }

  getStatus(): {
    totalSkills: number;
    builtIn: number;
    custom: number;
    active: number;
    disabled: number;
    draft: number;
    recentExecutions: number;
  } {
    const all = this.registry.list();
    return {
      totalSkills: all.length,
      builtIn: all.filter((s) => s.source === 'built-in').length,
      custom: all.filter((s) => s.source === 'custom').length,
      active: all.filter((s) => s.status === 'active').length,
      disabled: all.filter((s) => s.status === 'disabled').length,
      draft: all.filter((s) => s.status === 'draft').length,
      recentExecutions: this.history.getRecent(100).length,
    };
  }

  // === Sub-component access ===

  getRegistry(): SkillRegistry {
    return this.registry;
  }

  getHistory(): ExecutionHistory {
    return this.history;
  }

  getStore(): SkillStore {
    return this.store;
  }
}

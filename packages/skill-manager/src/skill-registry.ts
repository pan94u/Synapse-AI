import type { SkillDefinition, SkillCategory, SkillSource } from '@synapse/shared';
import { loadSkillsFromDir } from './skill-loader.js';

export class SkillRegistry {
  private skills = new Map<string, SkillDefinition>();

  register(skill: SkillDefinition): void {
    this.skills.set(skill.id, skill);
  }

  unregister(skillId: string): void {
    this.skills.delete(skillId);
  }

  get(id: string): SkillDefinition | undefined {
    return this.skills.get(id);
  }

  list(): SkillDefinition[] {
    return Array.from(this.skills.values());
  }

  listByCategory(category: SkillCategory): SkillDefinition[] {
    return this.list().filter((s) => s.category === category);
  }

  listBySource(source: SkillSource): SkillDefinition[] {
    return this.list().filter((s) => s.source === source);
  }

  /** Match skills against persona's defaultSkills patterns (exact match or glob with *) */
  listForPersona(defaultSkillPatterns: string[]): SkillDefinition[] {
    if (!defaultSkillPatterns.length) return [];

    return this.list().filter((skill) => {
      if (skill.status !== 'active') return false;
      return defaultSkillPatterns.some((pattern) => matchPattern(pattern, skill.id));
    });
  }

  loadFromDir(baseDir: string, source: SkillSource): void {
    const loaded = loadSkillsFromDir(baseDir, source);
    for (const [id, skill] of loaded) {
      this.skills.set(id, skill);
    }
  }

  getCount(): number {
    return this.skills.size;
  }
}

/** Simple glob match: exact match or trailing * wildcard */
function matchPattern(pattern: string, skillId: string): boolean {
  if (pattern === '*') return true;
  if (pattern.endsWith('*')) {
    const prefix = pattern.slice(0, -1);
    return skillId.startsWith(prefix);
  }
  return pattern === skillId;
}

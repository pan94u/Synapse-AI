import { mkdirSync, existsSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { stringify as stringifyYaml } from 'yaml';
import type { SkillDefinition, SkillCategory, SkillParameter } from '@synapse/shared';
import { parseSkillDir, validateSkillName } from './skill-parser.js';
import { loadSkillsFromDir } from './skill-loader.js';

export interface CreateSkillInput {
  name: string;
  description: string;
  category: SkillCategory;
  allowedTools?: string[];
  parameters?: SkillParameter[];
  instructions: string;
  metadata?: Record<string, string>;
}

export interface UpdateSkillInput {
  description?: string;
  category?: SkillCategory;
  allowedTools?: string[];
  parameters?: SkillParameter[];
  instructions?: string;
  metadata?: Record<string, string>;
}

export class SkillStore {
  private dataDir: string;

  constructor(dataDir: string) {
    this.dataDir = dataDir;
    if (!existsSync(this.dataDir)) {
      mkdirSync(this.dataDir, { recursive: true });
    }
  }

  create(input: CreateSkillInput): SkillDefinition {
    if (!validateSkillName(input.name)) {
      throw new Error(`Invalid skill name: "${input.name}". Must be lowercase + digits + hyphens, max 64 chars.`);
    }

    const skillDir = join(this.dataDir, input.name);
    if (existsSync(skillDir)) {
      throw new Error(`Skill "${input.name}" already exists`);
    }

    mkdirSync(skillDir, { recursive: true });

    const now = new Date().toISOString();
    const skillMd = buildSkillMd({
      name: input.name,
      description: input.description,
      category: input.category,
      status: 'active',
      allowedTools: input.allowedTools ?? [],
      parameters: input.parameters ?? [],
      instructions: input.instructions,
      metadata: input.metadata,
      createdAt: now,
      updatedAt: now,
    });

    writeFileSync(join(skillDir, 'SKILL.md'), skillMd, 'utf-8');

    const skill = parseSkillDir(skillDir, 'custom');
    if (!skill) throw new Error('Failed to parse created SKILL.md');
    return skill;
  }

  update(id: string, updates: UpdateSkillInput): SkillDefinition | undefined {
    const existing = this.get(id);
    if (!existing) return undefined;

    const now = new Date().toISOString();
    const skillMd = buildSkillMd({
      name: existing.name,
      description: updates.description ?? existing.description,
      category: updates.category ?? existing.category,
      status: existing.status,
      allowedTools: updates.allowedTools ?? existing.allowedTools,
      parameters: updates.parameters ?? existing.parameters,
      instructions: updates.instructions ?? existing.instructions,
      metadata: updates.metadata ?? existing.metadata,
      createdAt: existing.createdAt,
      updatedAt: now,
    });

    writeFileSync(join(this.dataDir, id, 'SKILL.md'), skillMd, 'utf-8');

    return parseSkillDir(join(this.dataDir, id), 'custom') ?? undefined;
  }

  delete(id: string): boolean {
    const skillDir = join(this.dataDir, id);
    if (!existsSync(skillDir)) return false;

    rmSync(skillDir, { recursive: true, force: true });
    return true;
  }

  get(id: string): SkillDefinition | undefined {
    const skillDir = join(this.dataDir, id);
    return parseSkillDir(skillDir, 'custom') ?? undefined;
  }

  list(): SkillDefinition[] {
    const skills = loadSkillsFromDir(this.dataDir, 'custom');
    return Array.from(skills.values());
  }

  /** Update just the status field of a custom skill */
  setStatus(id: string, status: 'draft' | 'active' | 'disabled'): boolean {
    const existing = this.get(id);
    if (!existing) return false;

    const skillMd = buildSkillMd({
      name: existing.name,
      description: existing.description,
      category: existing.category,
      status,
      allowedTools: existing.allowedTools,
      parameters: existing.parameters,
      instructions: existing.instructions,
      metadata: existing.metadata,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    });

    writeFileSync(join(this.dataDir, id, 'SKILL.md'), skillMd, 'utf-8');
    return true;
  }
}

/** Build SKILL.md content from structured data */
function buildSkillMd(data: {
  name: string;
  description: string;
  category: SkillCategory;
  status: string;
  allowedTools: string[];
  parameters: SkillParameter[];
  instructions: string;
  metadata?: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
}): string {
  const frontmatter: Record<string, unknown> = {
    name: data.name,
    description: data.description,
    'allowed-tools': data.allowedTools,
    category: data.category,
    status: data.status,
  };

  if (data.metadata && Object.keys(data.metadata).length > 0) {
    frontmatter.metadata = data.metadata;
  }

  if (data.parameters.length > 0) {
    frontmatter.parameters = data.parameters.map((p) => {
      const param: Record<string, unknown> = {
        name: p.name,
        type: p.type,
        description: p.description,
        required: p.required,
      };
      if (p.default !== undefined) param.default = p.default;
      if (p.options) param.options = p.options;
      return param;
    });
  }

  if (data.createdAt) frontmatter.createdAt = data.createdAt;
  if (data.updatedAt) frontmatter.updatedAt = data.updatedAt;

  const yamlStr = stringifyYaml(frontmatter, { lineWidth: 120 });
  return `---\n${yamlStr}---\n\n${data.instructions}\n`;
}

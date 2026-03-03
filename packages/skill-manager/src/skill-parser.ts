import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import type { SkillDefinition, SkillSource, SkillCategory, SkillStatus, SkillParameter } from '@synapse/shared';

interface ParsedSkill {
  frontmatter: Record<string, unknown>;
  body: string;
}

const NAME_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
const MAX_NAME_LENGTH = 64;

/** Parse SKILL.md content: extract YAML frontmatter + Markdown body */
export function parseSkillMd(content: string): ParsedSkill {
  const trimmed = content.trim();

  if (!trimmed.startsWith('---')) {
    return { frontmatter: {}, body: trimmed };
  }

  const endIndex = trimmed.indexOf('---', 3);
  if (endIndex === -1) {
    return { frontmatter: {}, body: trimmed };
  }

  const yamlStr = trimmed.substring(3, endIndex).trim();
  const body = trimmed.substring(endIndex + 3).trim();

  let frontmatter: Record<string, unknown> = {};
  try {
    frontmatter = parseYaml(yamlStr) ?? {};
  } catch {
    frontmatter = {};
  }

  return { frontmatter, body };
}

/** Validate skill name: lowercase + digits + hyphens, max 64 chars, no leading/trailing hyphen */
export function validateSkillName(name: string): boolean {
  if (!name || name.length > MAX_NAME_LENGTH) return false;
  // Single char names
  if (name.length === 1) return /^[a-z0-9]$/.test(name);
  return NAME_PATTERN.test(name);
}

/** Parse a skill directory containing SKILL.md → SkillDefinition */
export function parseSkillDir(skillDir: string, source: SkillSource): SkillDefinition | null {
  const skillMdPath = join(skillDir, 'SKILL.md');
  if (!existsSync(skillMdPath)) return null;

  let content: string;
  try {
    content = readFileSync(skillMdPath, 'utf-8');
  } catch {
    return null;
  }

  const { frontmatter, body } = parseSkillMd(content);

  const name = (frontmatter.name as string) ?? '';
  if (!validateSkillName(name)) return null;

  // Parse allowed-tools (support both hyphenated YAML key and array)
  let allowedTools: string[] = [];
  const rawTools = frontmatter['allowed-tools'] ?? frontmatter.allowedTools;
  if (Array.isArray(rawTools)) {
    allowedTools = rawTools.map(String);
  } else if (typeof rawTools === 'string') {
    allowedTools = rawTools.split(/\s+/).filter(Boolean);
  }

  // Parse parameters
  let parameters: SkillParameter[] = [];
  const rawParams = frontmatter.parameters;
  if (Array.isArray(rawParams)) {
    parameters = rawParams.map((p: Record<string, unknown>) => ({
      name: String(p.name ?? ''),
      type: (p.type as SkillParameter['type']) ?? 'string',
      description: String(p.description ?? ''),
      required: Boolean(p.required ?? false),
      default: p.default as string | number | boolean | undefined,
      options: Array.isArray(p.options) ? p.options.map(String) : undefined,
    }));
  }

  // Parse metadata
  let metadata: Record<string, string> | undefined;
  const rawMeta = frontmatter.metadata;
  if (rawMeta && typeof rawMeta === 'object') {
    metadata = {};
    for (const [k, v] of Object.entries(rawMeta as Record<string, unknown>)) {
      metadata[k] = String(v);
    }
  }

  const category = (frontmatter.category as SkillCategory) ?? 'custom';
  const status = (frontmatter.status as SkillStatus) ?? 'active';

  return {
    id: name,
    name,
    description: String(frontmatter.description ?? ''),
    category,
    status,
    source,
    allowedTools,
    parameters,
    instructions: body,
    license: frontmatter.license as string | undefined,
    compatibility: frontmatter.compatibility as string | undefined,
    metadata,
    skillDir,
    createdAt: frontmatter.createdAt as string | undefined,
    updatedAt: frontmatter.updatedAt as string | undefined,
  };
}

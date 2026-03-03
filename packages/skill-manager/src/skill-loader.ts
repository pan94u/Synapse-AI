import { readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { SkillDefinition, SkillSource } from '@synapse/shared';
import { parseSkillDir } from './skill-parser.js';

/** Recursively scan a directory, each subdirectory with SKILL.md is parsed as a skill */
export function loadSkillsFromDir(baseDir: string, source: SkillSource): Map<string, SkillDefinition> {
  const skills = new Map<string, SkillDefinition>();

  if (!existsSync(baseDir)) return skills;

  let entries: string[];
  try {
    entries = readdirSync(baseDir);
  } catch {
    return skills;
  }

  for (const entry of entries) {
    // Skip hidden dirs and _index files
    if (entry.startsWith('.') || entry.startsWith('_')) continue;

    const dirPath = join(baseDir, entry);

    try {
      const stat = statSync(dirPath);
      if (!stat.isDirectory()) continue;
    } catch {
      continue;
    }

    const skill = parseSkillDir(dirPath, source);
    if (skill) {
      skills.set(skill.id, skill);
    }
  }

  return skills;
}

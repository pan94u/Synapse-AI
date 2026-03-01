import { readFileSync, readdirSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { parse as parseYaml } from 'yaml';
import type { PersonaConfig } from '@synapse/shared';

interface RawPersonaYaml {
  id: string;
  name: string;
  description: string;
  personality: {
    tone: string;
    focus: string;
    caution: string;
  };
  default_skills?: string[];
  allowed_mcp_servers?: string[];
  allowed_tools?: string[];
  compliance_ruleset: string;
  proactive_tasks?: Array<{
    schedule?: string;
    trigger?: string;
    action: string;
  }>;
  org_memory_access?: string[];
}

function toPersonaConfig(raw: RawPersonaYaml): PersonaConfig {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    personality: {
      tone: raw.personality.tone as PersonaConfig['personality']['tone'],
      focus: raw.personality.focus as PersonaConfig['personality']['focus'],
      caution: raw.personality.caution as PersonaConfig['personality']['caution'],
    },
    defaultSkills: raw.default_skills ?? [],
    allowedMcpServers: raw.allowed_mcp_servers ?? [],
    allowedTools: raw.allowed_tools,
    complianceRuleset: raw.compliance_ruleset,
    proactiveTasks: raw.proactive_tasks,
    orgMemoryAccess: raw.org_memory_access,
  };
}

export function loadPersonaConfig(filePath: string): PersonaConfig {
  const content = readFileSync(filePath, 'utf-8');
  const raw = parseYaml(content) as RawPersonaYaml;
  return toPersonaConfig(raw);
}

export function loadAllPersonas(configDir: string): PersonaConfig[] {
  const files = readdirSync(configDir).filter(
    (f) => (extname(f) === '.yaml' || extname(f) === '.yml') && !basename(f).startsWith('_'),
  );
  return files.map((f) => loadPersonaConfig(join(configDir, f)));
}

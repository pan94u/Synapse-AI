import { readFileSync, readdirSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { parse as parseYaml } from 'yaml';
import type { ComplianceRule, ComplianceRuleSet } from '@synapse/shared';

interface RawRule {
  id: string;
  name: string;
  phase: 'pre' | 'post';
  when: {
    tool: string;
    action_type?: 'read' | 'write';
    condition?: string;
  };
  conditions?: Array<{
    if: string;
    then: string;
    approver?: string;
    reason?: string;
  }>;
  actions?: Array<Record<string, unknown>>;
  audit: string;
}

interface RawRuleSet {
  id: string;
  rules: RawRule[];
}

function toComplianceRule(raw: RawRule): ComplianceRule {
  return {
    id: raw.id,
    name: raw.name,
    phase: raw.phase,
    when: {
      tool: raw.when.tool,
      actionType: raw.when.action_type,
      condition: raw.when.condition,
    },
    conditions: raw.conditions?.map((c) => ({
      if: c.if,
      then: c.then as ComplianceRule['conditions'] extends Array<infer T> ? T extends { then: infer A } ? A : never : never,
      approver: c.approver,
      reason: c.reason,
    })),
    actions: raw.actions,
    audit: raw.audit as ComplianceRule['audit'],
  };
}

export function loadRuleSet(filePath: string): ComplianceRuleSet {
  const content = readFileSync(filePath, 'utf-8');
  const raw = parseYaml(content) as RawRuleSet;
  return {
    id: raw.id,
    rules: raw.rules.map(toComplianceRule),
  };
}

export function loadAllRuleSets(configDir: string): Map<string, ComplianceRuleSet> {
  const map = new Map<string, ComplianceRuleSet>();
  let files: string[];
  try {
    files = readdirSync(configDir).filter(
      (f) => (extname(f) === '.yaml' || extname(f) === '.yml') && !basename(f).startsWith('_'),
    );
  } catch {
    return map;
  }
  for (const f of files) {
    const ruleSet = loadRuleSet(join(configDir, f));
    map.set(ruleSet.id, ruleSet);
  }
  return map;
}

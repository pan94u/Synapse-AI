import type { ComplianceRuleSet, PreHookResult, PreHookAction } from '@synapse/shared';
import { matchToolPattern } from './matcher.js';
import { evaluate } from './evaluator.js';

export interface PreHookParams {
  toolName: string;
  toolInput: Record<string, unknown>;
  personaId: string;
  rulesetId: string;
}

export class PreHook {
  private ruleSets: Map<string, ComplianceRuleSet>;

  constructor(ruleSets: Map<string, ComplianceRuleSet>) {
    this.ruleSets = ruleSets;
  }

  evaluate(params: PreHookParams): PreHookResult {
    const ruleSet = this.ruleSets.get(params.rulesetId);
    if (!ruleSet) return { action: 'allow' };

    const preRules = ruleSet.rules.filter((r) => r.phase === 'pre');

    for (const rule of preRules) {
      if (!matchToolPattern(rule.when.tool, params.toolName)) continue;

      // Check additional when.condition if present
      if (rule.when.condition) {
        const ctx = {
          input: params.toolInput,
          persona: { id: params.personaId },
        };
        if (!evaluate(rule.when.condition, ctx)) continue;
      }

      // Evaluate conditions in order, return first match
      if (rule.conditions) {
        const ctx = {
          input: params.toolInput,
          persona: { id: params.personaId },
        };

        for (const cond of rule.conditions) {
          if (evaluate(cond.if, ctx)) {
            const action = cond.then as PreHookAction;
            switch (action) {
              case 'allow':
                return { action: 'allow' };
              case 'deny':
                return { action: 'deny', reason: cond.reason ?? `Denied by rule: ${rule.name}` };
              case 'require_approval':
                return {
                  action: 'require_approval',
                  approver: cond.approver ?? 'ceo',
                  reason: cond.reason ?? `Requires approval per rule: ${rule.name}`,
                };
              case 'modify':
                return {
                  action: 'modify',
                  modifiedInput: params.toolInput,
                  reason: cond.reason ?? `Modified by rule: ${rule.name}`,
                };
            }
          }
        }
      }
    }

    return { action: 'allow' };
  }
}

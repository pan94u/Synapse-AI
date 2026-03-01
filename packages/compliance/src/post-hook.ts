import type {
  ComplianceRuleSet,
  PostHookResult,
  ComplianceAlert,
  ComplianceNotification,
} from '@synapse/shared';
import { matchToolPattern } from './matcher.js';
import { evaluate } from './evaluator.js';
import type { DataMasker, MaskConfig } from './masker.js';

export interface PostHookParams {
  toolName: string;
  toolInput: Record<string, unknown>;
  toolOutput: string;
  personaId: string;
  rulesetId: string;
}

export class PostHook {
  private ruleSets: Map<string, ComplianceRuleSet>;
  private masker: DataMasker;

  constructor(ruleSets: Map<string, ComplianceRuleSet>, masker: DataMasker) {
    this.ruleSets = ruleSets;
    this.masker = masker;
  }

  evaluate(params: PostHookParams): PostHookResult {
    const ruleSet = this.ruleSets.get(params.rulesetId);
    if (!ruleSet) return { action: 'pass', output: params.toolOutput };

    const postRules = ruleSet.rules.filter((r) => r.phase === 'post');
    let output = params.toolOutput;
    let allMaskedFields: string[] = [];
    const allAlerts: ComplianceAlert[] = [];
    const allNotifications: ComplianceNotification[] = [];
    let shouldMask = false;
    let shouldFlag = false;
    let shouldNotify = false;

    for (const rule of postRules) {
      if (!matchToolPattern(rule.when.tool, params.toolName)) continue;

      if (!rule.actions) continue;

      const ctx = {
        input: params.toolInput,
        output: this.tryParseOutput(params.toolOutput),
        persona: { id: params.personaId },
      };

      // Check additional when.condition
      if (rule.when.condition && !evaluate(rule.when.condition, ctx)) continue;

      for (const action of rule.actions) {
        // mask_fields action
        if (action['mask_fields']) {
          const maskFieldsConfig = action['mask_fields'] as Array<{ field: string; method: string }>;
          const extraConfigs: MaskConfig[] = maskFieldsConfig.map((f) => ({
            pattern: f.field,
            method: f.method as MaskConfig['method'],
          }));
          const result = this.masker.mask(output, extraConfigs, params.personaId);
          if (result.maskedFields.length > 0) {
            output = result.masked;
            allMaskedFields = [...allMaskedFields, ...result.maskedFields];
            shouldMask = true;
          }
        }

        // auto_mask action (use default masker)
        if (action['auto_mask'] === true) {
          const result = this.masker.mask(output, undefined, params.personaId);
          if (result.maskedFields.length > 0) {
            output = result.masked;
            allMaskedFields = [...allMaskedFields, ...result.maskedFields];
            shouldMask = true;
          }
        }

        // flag_if action
        if (action['flag_if']) {
          const flagConfig = action['flag_if'] as { condition: string; severity: string; message: string };
          if (evaluate(flagConfig.condition, ctx)) {
            allAlerts.push({
              severity: (flagConfig.severity ?? 'warning') as ComplianceAlert['severity'],
              message: flagConfig.message ?? `Flagged by rule: ${rule.name}`,
            });
            shouldFlag = true;
          }
        }

        // notify action
        if (action['notify']) {
          const notifyConfig = action['notify'] as { targets: string[]; message: string };
          allNotifications.push({
            targets: notifyConfig.targets ?? [],
            channel: 'system',
            message: notifyConfig.message ?? `Notification from rule: ${rule.name}`,
          });
          shouldNotify = true;
        }

        // revoke action
        if (action['revoke']) {
          const revokeConfig = action['revoke'] as { condition?: string; reason: string };
          if (!revokeConfig.condition || evaluate(revokeConfig.condition, ctx)) {
            return { action: 'revoke', reason: revokeConfig.reason ?? `Revoked by rule: ${rule.name}` };
          }
        }
      }
    }

    // Priority: mask > flag > notify > pass
    if (shouldMask) {
      return { action: 'mask', output, maskedFields: allMaskedFields };
    }
    if (shouldFlag) {
      return { action: 'flag', output, alerts: allAlerts };
    }
    if (shouldNotify) {
      return { action: 'notify', output, notifications: allNotifications };
    }
    return { action: 'pass', output };
  }

  private tryParseOutput(output: string): unknown {
    try {
      return JSON.parse(output);
    } catch {
      return { raw: output };
    }
  }
}

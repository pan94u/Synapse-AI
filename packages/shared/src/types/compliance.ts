export type PreHookAction = 'allow' | 'deny' | 'require_approval' | 'modify';

export type PreHookResult =
  | { action: 'allow' }
  | { action: 'deny'; reason: string }
  | { action: 'require_approval'; approver: string; reason: string }
  | { action: 'modify'; modifiedInput: Record<string, unknown>; reason: string };

export type PostHookAction = 'pass' | 'mask' | 'flag' | 'notify' | 'revoke';

export interface ComplianceAlert {
  severity: 'info' | 'warning' | 'critical';
  message: string;
  target?: string;
}

export interface ComplianceNotification {
  targets: string[];
  channel?: string;
  message: string;
}

export type PostHookResult =
  | { action: 'pass'; output: string }
  | { action: 'mask'; output: string; maskedFields: string[] }
  | { action: 'flag'; output: string; alerts: ComplianceAlert[] }
  | { action: 'notify'; output: string; notifications: ComplianceNotification[] }
  | { action: 'revoke'; reason: string };

export interface ComplianceRule {
  id: string;
  name: string;
  phase: 'pre' | 'post';
  when: {
    tool: string;
    actionType?: 'read' | 'write';
    condition?: string;
  };
  conditions?: Array<{
    if: string;
    then: PreHookAction;
    approver?: string;
    reason?: string;
  }>;
  actions?: Array<Record<string, unknown>>;
  audit: 'always' | 'on_deny' | 'never';
}

export interface ComplianceRuleSet {
  id: string;
  rules: ComplianceRule[];
}

export interface AuditTrailEntry {
  id: string;
  timestamp: string;
  personaId: string;
  toolName: string;
  toolInput: Record<string, unknown>;
  preHookResult: PreHookResult;
  executionResult?: { success: boolean; output: string };
  postHookResult?: PostHookResult;
  latencyMs: number;
}

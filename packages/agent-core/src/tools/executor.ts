import type { ToolCall, ToolResult, PreHookResult, PostHookResult, AuditTrailEntry } from '@synapse/shared';
import type { ToolRegistry } from './registry.js';

export interface ComplianceHooks {
  preCheck?(params: {
    toolName: string;
    toolInput: Record<string, unknown>;
    personaId: string;
  }): PreHookResult;

  postCheck?(params: {
    toolName: string;
    toolInput: Record<string, unknown>;
    toolOutput: string;
    personaId: string;
  }): PostHookResult;

  recordAudit?(entry: Omit<AuditTrailEntry, 'id' | 'timestamp'>): void;
}

export class ToolExecutor {
  private registry: ToolRegistry;
  private hooks?: ComplianceHooks;
  private personaId?: string;

  constructor(registry: ToolRegistry, hooks?: ComplianceHooks, personaId?: string) {
    this.registry = registry;
    this.hooks = hooks;
    this.personaId = personaId;
  }

  async execute(call: ToolCall): Promise<ToolResult> {
    const startTime = Date.now();
    let preResult: PreHookResult = { action: 'allow' };

    const tool = this.registry.get(call.name);
    if (!tool) {
      return {
        callId: call.id,
        name: call.name,
        content: `Error: Tool "${call.name}" not found`,
        isError: true,
      };
    }

    const permission = this.registry.getPermission(call.name);
    if (permission === 'deny') {
      return {
        callId: call.id,
        name: call.name,
        content: `Error: Tool "${call.name}" is denied`,
        isError: true,
      };
    }

    // 1. Pre-Hook
    let effectiveCall = call;
    if (this.hooks?.preCheck && this.personaId) {
      preResult = this.hooks.preCheck({
        toolName: call.name,
        toolInput: call.arguments,
        personaId: this.personaId,
      });

      if (preResult.action === 'deny') {
        this.recordAudit(call, preResult, undefined, undefined, startTime);
        return {
          callId: call.id,
          name: call.name,
          content: `Denied: ${preResult.reason}`,
          isError: true,
        };
      }
      if (preResult.action === 'require_approval') {
        this.recordAudit(call, preResult, undefined, undefined, startTime);
        return {
          callId: call.id,
          name: call.name,
          content: `Requires approval from ${preResult.approver}: ${preResult.reason}`,
          isError: true,
        };
      }
      if (preResult.action === 'modify') {
        effectiveCall = { ...call, arguments: preResult.modifiedInput };
      }
    }

    // 2. Execute tool
    let content: string;
    let success = true;
    try {
      content = await tool.execute(effectiveCall.arguments);
    } catch (err) {
      content = `Error: ${err instanceof Error ? err.message : String(err)}`;
      success = false;
      this.recordAudit(call, preResult, { success: false, output: content }, undefined, startTime);
      return { callId: call.id, name: call.name, content, isError: true };
    }

    // 3. Post-Hook
    let postResult: PostHookResult | undefined;
    let finalContent = content;
    if (this.hooks?.postCheck && this.personaId) {
      postResult = this.hooks.postCheck({
        toolName: call.name,
        toolInput: call.arguments,
        toolOutput: content,
        personaId: this.personaId,
      });

      if (postResult.action === 'mask') {
        finalContent = postResult.output;
      } else if (postResult.action === 'flag') {
        finalContent = postResult.output + '\n[ALERT] ' + postResult.alerts.map((a) => a.message).join('; ');
      } else if (postResult.action === 'revoke') {
        this.recordAudit(call, preResult, { success: true, output: content }, postResult, startTime);
        return {
          callId: call.id,
          name: call.name,
          content: `Revoked: ${postResult.reason}`,
          isError: true,
        };
      } else if (postResult.action === 'notify') {
        finalContent = postResult.output;
        // Phase 4: just log notifications to console
        for (const n of postResult.notifications) {
          console.log(`[compliance/notify] ${n.message} → ${n.targets.join(', ')}`);
        }
      } else {
        finalContent = postResult.output;
      }
    }

    // 4. Audit
    this.recordAudit(call, preResult, { success, output: content }, postResult, startTime);

    return { callId: call.id, name: call.name, content: finalContent };
  }

  async executeBatch(calls: ToolCall[]): Promise<ToolResult[]> {
    return Promise.all(calls.map((call) => this.execute(call)));
  }

  private recordAudit(
    call: ToolCall,
    preResult: PreHookResult,
    executionResult: { success: boolean; output: string } | undefined,
    postResult: PostHookResult | undefined,
    startTime: number,
  ): void {
    if (this.hooks?.recordAudit && this.personaId) {
      this.hooks.recordAudit({
        personaId: this.personaId,
        toolName: call.name,
        toolInput: call.arguments,
        preHookResult: preResult,
        executionResult,
        postHookResult: postResult,
        latencyMs: Date.now() - startTime,
      });
    }
  }
}

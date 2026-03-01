export type ApprovalStatus = 'pending' | 'approved' | 'denied' | 'expired';

export interface ApprovalRequest {
  id: string;
  toolName: string;
  toolInput: Record<string, unknown>;
  requesterId: string;
  approverId: string;
  reason: string;
  status: ApprovalStatus;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

let nextId = 1;

export class ApprovalManager {
  private requests = new Map<string, ApprovalRequest>();

  createRequest(params: {
    toolName: string;
    toolInput: Record<string, unknown>;
    requesterId: string;
    approverId: string;
    reason: string;
  }): ApprovalRequest {
    const request: ApprovalRequest = {
      id: `approval-${nextId++}`,
      toolName: params.toolName,
      toolInput: params.toolInput,
      requesterId: params.requesterId,
      approverId: params.approverId,
      reason: params.reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    this.requests.set(request.id, request);
    console.log(`[approval] Created request ${request.id}: ${params.toolName} by ${params.requesterId}, approver: ${params.approverId}`);
    return request;
  }

  approve(requestId: string, by: string): ApprovalRequest | undefined {
    const request = this.requests.get(requestId);
    if (!request || request.status !== 'pending') return undefined;
    request.status = 'approved';
    request.resolvedAt = new Date().toISOString();
    request.resolvedBy = by;
    console.log(`[approval] Request ${requestId} approved by ${by}`);
    return request;
  }

  deny(requestId: string, by: string, reason?: string): ApprovalRequest | undefined {
    const request = this.requests.get(requestId);
    if (!request || request.status !== 'pending') return undefined;
    request.status = 'denied';
    request.resolvedAt = new Date().toISOString();
    request.resolvedBy = by;
    if (reason) request.reason = reason;
    console.log(`[approval] Request ${requestId} denied by ${by}`);
    return request;
  }

  getPending(approverId?: string): ApprovalRequest[] {
    const all = Array.from(this.requests.values()).filter((r) => r.status === 'pending');
    if (approverId) return all.filter((r) => r.approverId === approverId);
    return all;
  }

  getRequest(id: string): ApprovalRequest | undefined {
    return this.requests.get(id);
  }

  listAll(): ApprovalRequest[] {
    return Array.from(this.requests.values());
  }
}

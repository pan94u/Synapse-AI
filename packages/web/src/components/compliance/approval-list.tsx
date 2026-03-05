'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { zh } from '@/messages/zh';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, X } from 'lucide-react';

interface Approval {
  id: string;
  type: string;
  requester: string;
  reason: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'denied';
}

export function ApprovalList() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<{ approvals: Approval[] }>('/compliance/approvals');
      setApprovals(data.approvals);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : zh.common.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'deny') => {
    try {
      await apiFetch(`/compliance/approvals/${id}/${action}`, { method: 'POST' });
      await fetchApprovals();
    } catch {}
  };

  if (loading) {
    return (
      <div className="space-y-3 mt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <p>{zh.common.error}: {error}</p>
      </div>
    );
  }

  if (approvals.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <p>{zh.compliance.empty.approvals}</p>
      </div>
    );
  }

  const statusVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary' as const;
      case 'approved': return 'default' as const;
      case 'denied': return 'destructive' as const;
      default: return 'outline' as const;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'pending': return zh.compliance.approval.pending;
      case 'approved': return zh.compliance.approval.approved;
      case 'denied': return zh.compliance.approval.denied;
      default: return status;
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{zh.compliance.approval.id}</TableHead>
          <TableHead>{zh.compliance.approval.type}</TableHead>
          <TableHead>{zh.compliance.approval.requester}</TableHead>
          <TableHead>{zh.compliance.approval.reason}</TableHead>
          <TableHead>{zh.compliance.approval.time}</TableHead>
          <TableHead>{zh.common.actions}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {approvals.map((approval) => (
          <TableRow key={approval.id}>
            <TableCell className="font-mono text-xs">{approval.id.slice(0, 8)}</TableCell>
            <TableCell>{approval.type}</TableCell>
            <TableCell>{approval.requester}</TableCell>
            <TableCell className="max-w-xs truncate">{approval.reason}</TableCell>
            <TableCell className="text-muted-foreground text-xs">
              {new Date(approval.timestamp).toLocaleString('zh-CN')}
            </TableCell>
            <TableCell>
              {approval.status === 'pending' ? (
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAction(approval.id, 'approve')}
                  >
                    <Check className="h-3.5 w-3.5" />
                    {zh.compliance.approval.approve}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAction(approval.id, 'deny')}
                  >
                    <X className="h-3.5 w-3.5" />
                    {zh.compliance.approval.deny}
                  </Button>
                </div>
              ) : (
                <Badge variant={statusVariant(approval.status)}>
                  {statusLabel(approval.status)}
                </Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

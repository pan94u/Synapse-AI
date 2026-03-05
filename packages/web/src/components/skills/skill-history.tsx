'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { zh } from '@/messages/zh';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface SkillExecution {
  id: string;
  skillId: string;
  personaId: string;
  triggerType: string;
  parameters: Record<string, string>;
  status: 'success' | 'error' | 'running';
  startedAt: string;
  completedAt?: string;
  result?: string;
  error?: string;
  model?: string;
  toolCallsExecuted?: number;
}

function computeDurationMs(startedAt: string, completedAt?: string): number | null {
  if (!completedAt) return null;
  return new Date(completedAt).getTime() - new Date(startedAt).getTime();
}

export function SkillHistory() {
  const [executions, setExecutions] = useState<SkillExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchHistory() {
      try {
        setLoading(true);
        const data = await apiFetch<{ executions: SkillExecution[] }>('/skills/history');
        if (!cancelled) {
          setExecutions(data.executions);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : zh.common.error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchHistory();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="space-y-3 mt-4">
        {Array.from({ length: 5 }).map((_, i) => (
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

  if (executions.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <p>{zh.skills.empty.history}</p>
      </div>
    );
  }

  const statusVariant = (status: string) => {
    switch (status) {
      case 'success': return 'default' as const;
      case 'error': return 'destructive' as const;
      case 'running': return 'secondary' as const;
      default: return 'outline' as const;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'success': return zh.skills.history.success;
      case 'error': return zh.skills.history.failure;
      case 'running': return zh.skills.history.running;
      default: return status;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms} ${zh.common.ms}`;
    return `${(ms / 1000).toFixed(1)} s`;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{zh.skills.history.time}</TableHead>
          <TableHead>{zh.skills.history.skill}</TableHead>
          <TableHead>{zh.skills.history.status}</TableHead>
          <TableHead>{zh.skills.history.duration}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {executions.map((exec) => {
          const durationMs = computeDurationMs(exec.startedAt, exec.completedAt);
          return (
            <TableRow key={exec.id}>
              <TableCell className="text-muted-foreground text-xs">
                {new Date(exec.startedAt).toLocaleString('zh-CN')}
              </TableCell>
              <TableCell className="font-medium">{exec.skillId}</TableCell>
              <TableCell>
                <Badge variant={statusVariant(exec.status)}>
                  {statusLabel(exec.status)}
                </Badge>
              </TableCell>
              <TableCell>
                {durationMs != null ? formatDuration(durationMs) : '-'}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { zh } from '@/messages/zh';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Play } from 'lucide-react';

interface ProactiveAction {
  id: string;
  name: string;
  description: string;
  type: 'schedule' | 'event' | 'threshold';
  schedule?: string;
  enabled: boolean;
}

export function ActionList() {
  const [actions, setActions] = useState<ProactiveAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [executingId, setExecutingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchActions() {
      try {
        setLoading(true);
        const data = await apiFetch<{ actions: ProactiveAction[] }>('/proactive/actions');
        if (!cancelled) {
          setActions(data.actions);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : zh.common.error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchActions();
    return () => { cancelled = true; };
  }, []);

  const handleExecute = async (id: string) => {
    setExecutingId(id);
    try {
      await apiFetch(`/proactive/actions/${id}/execute`, { method: 'POST' });
    } finally {
      setExecutingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3 mt-4">
        {Array.from({ length: 4 }).map((_, i) => (
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

  if (actions.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <p>{zh.proactive.empty.actions}</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{zh.proactive.action.name}</TableHead>
          <TableHead>{zh.proactive.action.type}</TableHead>
          <TableHead>{zh.proactive.action.schedule}</TableHead>
          <TableHead>{zh.proactive.action.status}</TableHead>
          <TableHead>{zh.common.actions}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {actions.map((action) => (
          <TableRow key={action.id}>
            <TableCell className="font-medium">{action.name}</TableCell>
            <TableCell>
              {action.type === 'schedule' ? '定时' : action.type === 'event' ? '事件' : '阈值'}
            </TableCell>
            <TableCell className="font-mono text-xs">{action.schedule || '-'}</TableCell>
            <TableCell>
              <Badge variant={action.enabled ? 'default' : 'secondary'}>
                {action.enabled ? zh.proactive.action.enabled : zh.proactive.action.disabled}
              </Badge>
            </TableCell>
            <TableCell>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExecute(action.id)}
                disabled={executingId === action.id}
              >
                <Play className="h-3.5 w-3.5" />
                {executingId === action.id ? zh.proactive.action.executing : zh.proactive.action.execute}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { zh } from '@/messages/zh';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Eye } from 'lucide-react';

interface HistoryEntry {
  id: string;
  action: string;
  personaId?: string;
  startedAt: string;
  completedAt?: string;
  status: 'running' | 'success' | 'error';
  triggerType: string;
  triggerDetail: string;
  result?: string;
  error?: string;
}

export function ExecutionHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<HistoryEntry | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<{ history: HistoryEntry[] }>('/proactive/history');
      setEntries(data.history);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : zh.common.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    fetchHistory().then(() => {
      if (cancelled) return;
    });
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

  if (entries.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <p>{zh.proactive.empty.history}</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{zh.proactive.history.time}</TableHead>
            <TableHead>{zh.proactive.history.action}</TableHead>
            <TableHead>{zh.proactive.history.status}</TableHead>
            <TableHead>{zh.proactive.history.duration}</TableHead>
            <TableHead>{zh.proactive.history.result}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => {
            const durationMs = entry.completedAt && entry.startedAt
              ? new Date(entry.completedAt).getTime() - new Date(entry.startedAt).getTime()
              : undefined;
            return (
              <TableRow key={entry.id}>
                <TableCell className="text-muted-foreground text-xs">
                  {new Date(entry.startedAt).toLocaleString('zh-CN')}
                </TableCell>
                <TableCell className="font-medium">{entry.action}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      entry.status === 'success'
                        ? 'default'
                        : entry.status === 'running'
                          ? 'outline'
                          : 'destructive'
                    }
                  >
                    {entry.status === 'success'
                      ? zh.proactive.history.success
                      : entry.status === 'running'
                        ? zh.proactive.history.running
                        : zh.proactive.history.failure}
                  </Badge>
                </TableCell>
                <TableCell>
                  {durationMs != null ? `${(durationMs / 1000).toFixed(1)}s` : '-'}
                </TableCell>
                <TableCell>
                  {(entry.result || entry.error) ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelected(entry)}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      查看报告
                    </Button>
                  ) : '-'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected?.action}</DialogTitle>
            <DialogDescription>
              {selected?.startedAt && new Date(selected.startedAt).toLocaleString('zh-CN')}
              {' · '}
              {selected?.triggerDetail === 'manual' ? '手动执行' : selected?.triggerDetail}
            </DialogDescription>
          </DialogHeader>
          {selected?.status === 'error' && selected.error && (
            <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
              {selected.error}
            </div>
          )}
          {selected?.result && (
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {selected.result}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

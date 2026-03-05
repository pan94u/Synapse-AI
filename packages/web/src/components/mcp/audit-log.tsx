'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { zh } from '@/messages/zh';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface AuditEntry {
  id: string;
  timestamp: string;
  server: string;
  action: string;
  result: 'success' | 'failure';
  details?: string;
}

export function AuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchAudit() {
      try {
        setLoading(true);
        const data = await apiFetch<{ entries: AuditEntry[] }>('/mcp/audit');
        if (!cancelled) {
          setEntries(data.entries);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : zh.common.error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchAudit();
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
        <p>{zh.mcp.empty.audit}</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{zh.mcp.audit.time}</TableHead>
          <TableHead>{zh.mcp.audit.server}</TableHead>
          <TableHead>{zh.mcp.audit.action}</TableHead>
          <TableHead>{zh.mcp.audit.result}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell className="text-muted-foreground text-xs">
              {new Date(entry.timestamp).toLocaleString('zh-CN')}
            </TableCell>
            <TableCell>{entry.server}</TableCell>
            <TableCell>{entry.action}</TableCell>
            <TableCell>
              <Badge variant={entry.result === 'success' ? 'default' : 'destructive'}>
                {entry.result === 'success' ? zh.mcp.audit.success : zh.mcp.audit.failure}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

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
  role: string;
  tool: string;
  action: string;
  result: 'passed' | 'blocked' | 'flagged';
}

export function AuditTrail() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchAudit() {
      try {
        setLoading(true);
        const data = await apiFetch<{ entries: AuditEntry[] }>('/compliance/audit');
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
        <p>{zh.compliance.empty.audit}</p>
      </div>
    );
  }

  const resultVariant = (result: string) => {
    switch (result) {
      case 'passed': return 'default' as const;
      case 'blocked': return 'destructive' as const;
      case 'flagged': return 'secondary' as const;
      default: return 'outline' as const;
    }
  };

  const resultLabel = (result: string) => {
    switch (result) {
      case 'passed': return zh.compliance.audit.passed;
      case 'blocked': return zh.compliance.audit.blocked;
      case 'flagged': return zh.compliance.audit.flagged;
      default: return result;
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{zh.compliance.audit.time}</TableHead>
          <TableHead>{zh.compliance.audit.role}</TableHead>
          <TableHead>{zh.compliance.audit.tool}</TableHead>
          <TableHead>{zh.compliance.audit.action}</TableHead>
          <TableHead>{zh.compliance.audit.result}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell className="text-muted-foreground text-xs">
              {new Date(entry.timestamp).toLocaleString('zh-CN')}
            </TableCell>
            <TableCell>{entry.role}</TableCell>
            <TableCell className="font-mono text-xs">{entry.tool}</TableCell>
            <TableCell>{entry.action}</TableCell>
            <TableCell>
              <Badge variant={resultVariant(entry.result)}>
                {resultLabel(entry.result)}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

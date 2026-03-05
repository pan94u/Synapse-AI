'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { zh } from '@/messages/zh';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface McpTool {
  name: string;
  description: string;
  server: string;
  permission: 'always' | 'ask' | 'deny';
}

export function ToolList() {
  const [tools, setTools] = useState<McpTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchTools() {
      try {
        setLoading(true);
        const data = await apiFetch<{ tools: McpTool[] }>('/mcp/tools');
        if (!cancelled) {
          setTools(data.tools);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : zh.common.error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchTools();
    return () => { cancelled = true; };
  }, []);

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

  if (tools.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <p>{zh.mcp.empty.tools}</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{zh.mcp.tool.name}</TableHead>
          <TableHead>{zh.mcp.tool.description}</TableHead>
          <TableHead>{zh.mcp.tool.server}</TableHead>
          <TableHead>{zh.mcp.tool.permission}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tools.map((tool) => (
          <TableRow key={`${tool.server}-${tool.name}`}>
            <TableCell className="font-medium font-mono text-xs">{tool.name}</TableCell>
            <TableCell className="text-muted-foreground">{tool.description}</TableCell>
            <TableCell>{tool.server}</TableCell>
            <TableCell>
              <Badge
                variant={
                  tool.permission === 'always'
                    ? 'default'
                    : tool.permission === 'ask'
                      ? 'outline'
                      : 'destructive'
                }
              >
                {tool.permission === 'always'
                  ? zh.mcp.tool.allowed
                  : tool.permission === 'ask'
                    ? zh.mcp.tool.approval
                    : zh.mcp.tool.denied}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

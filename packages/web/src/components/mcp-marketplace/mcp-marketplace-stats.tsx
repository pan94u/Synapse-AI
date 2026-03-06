'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { zh } from '@/messages/zh';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MCPStats {
  totalPublished: number;
  totalInstalled: number;
  pendingReview: number;
  avgUptimeRate: number;
  totalCalls: number;
  categoryCounts: Record<string, number>;
}

export function McpMarketplaceStats() {
  const [stats, setStats] = useState<MCPStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchStats() {
      try {
        const data = await apiFetch<MCPStats>('/mcp-marketplace/status');
        if (!cancelled) setStats(data);
      } catch {
        // Non-critical
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchStats();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const t = zh.mcpMarketplace.stats;
  const items = [
    { title: t.total, value: stats.totalPublished },
    { title: t.installed, value: stats.totalInstalled },
    { title: t.pendingReview, value: stats.pendingReview },
    { title: t.avgUptime, value: `${Math.round(stats.avgUptimeRate * 100)}%` },
    { title: t.totalCalls, value: stats.totalCalls.toLocaleString() },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((item) => (
        <Card key={item.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {item.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{item.value}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

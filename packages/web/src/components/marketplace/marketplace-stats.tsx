'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { zh } from '@/messages/zh';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Stats {
  total: number;
  installed: number;
  topRated: number;
  totalDownloads: number;
  pendingReview: number;
}

export function MarketplaceStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchStats() {
      try {
        const data = await apiFetch<Stats>('/marketplace/stats');
        if (!cancelled) setStats(data);
      } catch {
        // Stats are non-critical, silently fail
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

  const items = [
    { title: zh.marketplace.stats.total, value: stats.total },
    { title: zh.marketplace.stats.installed, value: stats.installed },
    { title: zh.marketplace.stats.topRated, value: stats.topRated },
    { title: zh.marketplace.stats.downloads, value: stats.totalDownloads },
    { title: zh.marketplace.stats.pendingReview, value: stats.pendingReview },
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

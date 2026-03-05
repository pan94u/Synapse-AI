'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { zh } from '@/messages/zh';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Stats {
  totalPublished: number;
  totalInstalled: number;
  totalReviews: number;
  categoryCounts: Record<string, number>;
  pendingReview: number;
}

export function MarketplaceStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchStats() {
      try {
        const data = await apiFetch<Stats>('/marketplace/status');
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

  const categoryCount = Object.keys(stats.categoryCounts).length;
  const items = [
    { title: zh.marketplace.stats.total, value: stats.totalPublished },
    { title: zh.marketplace.stats.installed, value: stats.totalInstalled },
    { title: zh.marketplace.stats.pendingReview, value: stats.pendingReview },
    { title: zh.marketplace.stats.topRated, value: stats.totalReviews },
    { title: zh.marketplace.stats.downloads, value: categoryCount },
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

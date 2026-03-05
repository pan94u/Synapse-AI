'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { zh } from '@/messages/zh';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Metric {
  id: string;
  name: string;
  value: number;
  unit?: string;
  trend: 'up' | 'down' | 'stable';
  updatedAt: string;
}

export function MetricsView() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchMetrics() {
      try {
        setLoading(true);
        const data = await apiFetch<{ metrics: Metric[] }>('/decision/metrics');
        if (!cancelled) {
          setMetrics(data.metrics);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : zh.common.error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchMetrics();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
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

  if (metrics.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <p>{zh.decision.empty.metrics}</p>
      </div>
    );
  }

  const TrendIcon = ({ trend }: { trend: string }) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const trendLabel = (trend: string) => {
    switch (trend) {
      case 'up': return zh.decision.metrics.up;
      case 'down': return zh.decision.metrics.down;
      default: return zh.decision.metrics.stable;
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
      {metrics.map((metric) => (
        <Card key={metric.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {metric.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {metric.value}{metric.unit ? ` ${metric.unit}` : ''}
              </span>
              <div className="flex items-center gap-1">
                <TrendIcon trend={metric.trend} />
                <span className="text-xs text-muted-foreground">{trendLabel(metric.trend)}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {zh.decision.metrics.updated}: {new Date(metric.updatedAt).toLocaleString('zh-CN')}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

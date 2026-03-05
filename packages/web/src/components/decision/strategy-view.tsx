'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { zh } from '@/messages/zh';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';

interface StrategyObjective {
  id: string;
  objective: string;
  description: string;
  progress: number;
  status: 'on_track' | 'at_risk' | 'behind';
}

interface StrategyData {
  objectives: StrategyObjective[];
  updatedAt: string;
}

export function StrategyView() {
  const [data, setData] = useState<StrategyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStrategy = async () => {
    try {
      setLoading(true);
      const result = await apiFetch<StrategyData>('/decision/strategy');
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : zh.common.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStrategy();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await apiFetch('/decision/strategy/refresh', { method: 'POST' });
      await fetchStrategy();
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 mt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <p>{zh.common.error}: {error}</p>
      </div>
    );
  }

  const statusVariant = (status: string) => {
    switch (status) {
      case 'on_track': return 'default' as const;
      case 'at_risk': return 'secondary' as const;
      case 'behind': return 'destructive' as const;
      default: return 'outline' as const;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'on_track': return zh.decision.strategy.onTrack;
      case 'at_risk': return zh.decision.strategy.atRisk;
      case 'behind': return zh.decision.strategy.behind;
      default: return status;
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{zh.decision.strategy.title}</h3>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? zh.decision.strategy.refreshing : zh.decision.strategy.refresh}
        </Button>
      </div>

      {data.objectives.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          <p>{zh.decision.empty.strategy}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.objectives.map((obj) => (
            <Card key={obj.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{obj.objective}</CardTitle>
                  <Badge variant={statusVariant(obj.status)}>
                    {statusLabel(obj.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{obj.description}</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${Math.min(obj.progress, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{obj.progress}%</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

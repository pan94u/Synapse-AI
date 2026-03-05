'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { zh } from '@/messages/zh';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';

interface Insight {
  id: string;
  title: string;
  description: string;
  type: 'opportunity' | 'risk' | 'anomaly' | 'trend';
  severity: 'high' | 'medium' | 'low';
  timestamp: string;
}

export function InsightsView() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchInsights() {
      try {
        setLoading(true);
        const data = await apiFetch<{ insights: Insight[] }>('/decision/insights');
        if (!cancelled) {
          setInsights(data.insights);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : zh.common.error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchInsights();
    return () => { cancelled = true; };
  }, []);

  const handleAnalyze = async (id: string) => {
    setAnalyzingId(id);
    try {
      await apiFetch(`/decision/insights/${id}/analyze`, { method: 'POST' });
    } finally {
      setAnalyzingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3 mt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
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

  const typeLabels: Record<string, string> = {
    opportunity: zh.decision.insights.opportunity,
    risk: zh.decision.insights.risk,
    anomaly: zh.decision.insights.anomaly,
    trend: zh.decision.insights.trend,
  };

  const types = ['all', 'opportunity', 'risk', 'anomaly', 'trend'];
  const filtered = typeFilter === 'all' ? insights : insights.filter((i) => i.type === typeFilter);

  const severityVariant = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive' as const;
      case 'medium': return 'default' as const;
      case 'low': return 'secondary' as const;
      default: return 'outline' as const;
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex gap-2 flex-wrap">
        {types.map((t) => (
          <Button
            key={t}
            variant={typeFilter === t ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter(t)}
          >
            {t === 'all' ? zh.skills.filter.all : typeLabels[t] || t}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          <p>{zh.decision.empty.insights}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((insight) => (
            <Card key={insight.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base">{insight.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{typeLabels[insight.type] || insight.type}</Badge>
                    <Badge variant={severityVariant(insight.severity)}>
                      {insight.severity}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {new Date(insight.timestamp).toLocaleString('zh-CN')}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAnalyze(insight.id)}
                    disabled={analyzingId === insight.id}
                  >
                    {analyzingId === insight.id ? zh.decision.insights.analyzing : zh.decision.insights.analyze}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

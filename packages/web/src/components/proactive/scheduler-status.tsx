'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { zh } from '@/messages/zh';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SchedulerInfo {
  running: boolean;
  scheduledJobs: number;
  registeredEvents: number;
  activeMonitors: number;
}

export function SchedulerStatus() {
  const [info, setInfo] = useState<SchedulerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchStatus() {
      try {
        setLoading(true);
        const data = await apiFetch<SchedulerInfo>('/proactive/status');
        if (!cancelled) {
          setInfo(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : zh.common.error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchStatus();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error || !info) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <p>{zh.common.error}: {error}</p>
      </div>
    );
  }

  const cards = [
    {
      title: zh.proactive.scheduler.status,
      value: (
        <Badge variant={info.running ? 'default' : 'secondary'}>
          {info.running ? zh.proactive.scheduler.running : zh.proactive.scheduler.stopped}
        </Badge>
      ),
    },
    {
      title: '定时任务',
      value: <span className="text-2xl font-bold">{info.scheduledJobs}</span>,
    },
    {
      title: '事件监听',
      value: <span className="text-2xl font-bold">{info.registeredEvents}</span>,
    },
    {
      title: '阈值监控',
      value: <span className="text-2xl font-bold">{info.activeMonitors}</span>,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent>{card.value}</CardContent>
        </Card>
      ))}
    </div>
  );
}

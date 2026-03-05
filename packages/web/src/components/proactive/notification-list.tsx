'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { zh } from '@/messages/zh';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Check, Eye } from 'lucide-react';

interface Notification {
  id: string;
  personaId: string;
  title: string;
  content: string;
  source: string;
  severity: 'info' | 'warning' | 'critical';
  read: boolean;
  createdAt: string;
}

export function NotificationList() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Notification | null>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<{ notifications: Notification[] }>('/proactive/notifications');
      setNotifications(data.notifications);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : zh.common.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await apiFetch(`/proactive/notifications/${id}/read`, { method: 'POST' });
      await fetchNotifications();
    } catch {}
  };

  if (loading) {
    return (
      <div className="space-y-3 mt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
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

  if (notifications.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <p>{zh.proactive.empty.notifications}</p>
      </div>
    );
  }

  const severityVariant = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive' as const;
      case 'warning': return 'secondary' as const;
      default: return 'outline' as const;
    }
  };

  const severityLabel = (severity: string) => {
    switch (severity) {
      case 'info': return zh.proactive.notification.info;
      case 'warning': return zh.proactive.notification.warning;
      case 'critical': return zh.proactive.notification.error;
      default: return severity;
    }
  };

  return (
    <>
      <div className="space-y-3 mt-4">
        {notifications.map((n) => (
          <Card key={n.id} className={n.read ? 'opacity-60' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium">{n.title}</h4>
                    <Badge variant={severityVariant(n.severity)}>{severityLabel(n.severity)}</Badge>
                    {!n.read && (
                      <Badge variant="default">{zh.proactive.notification.unread}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{n.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(n.createdAt).toLocaleString('zh-CN')}
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-2 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => setSelected(n)}>
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    查看
                  </Button>
                  {!n.read && (
                    <Button variant="ghost" size="sm" onClick={() => handleMarkRead(n.id)}>
                      <Check className="h-3.5 w-3.5 mr-1" />
                      {zh.proactive.notification.markRead}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
            <DialogDescription>
              {selected?.createdAt && new Date(selected.createdAt).toLocaleString('zh-CN')}
              {' · '}
              {severityLabel(selected?.severity ?? 'info')}
            </DialogDescription>
          </DialogHeader>
          {selected?.content && (
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {selected.content}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

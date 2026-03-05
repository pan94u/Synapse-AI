'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { zh } from '@/messages/zh';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface HealthInfo {
  status: string;
  version?: string;
  uptime?: number;
  environment?: string;
  runtime?: string;
}

interface McpServer {
  id: string;
  name: string;
  status: string;
}

interface SkillStatus {
  totalSkills: number;
  active: number;
  disabled: number;
}

export function SettingsPanel() {
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [servers, setServers] = useState<McpServer[]>([]);
  const [skillStatus, setSkillStatus] = useState<SkillStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchAll() {
      try {
        setLoading(true);
        const [healthData, serversData, skillsData] = await Promise.allSettled([
          apiFetch<HealthInfo>('/health'),
          apiFetch<{ servers: McpServer[] }>('/mcp/servers'),
          apiFetch<SkillStatus>('/skills/status'),
        ]);

        if (!cancelled) {
          if (healthData.status === 'fulfilled') setHealth(healthData.value);
          if (serversData.status === 'fulfilled') setServers(serversData.value.servers);
          if (skillsData.status === 'fulfilled') setSkillStatus(skillsData.value);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : zh.common.error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchAll();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
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

  const formatUptime = (seconds?: number) => {
    if (!seconds) return '-';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="space-y-6">
      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle>{zh.settings.system.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">{zh.settings.system.version}</p>
              <p className="text-sm font-medium">{health?.version || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{zh.settings.system.uptime}</p>
              <p className="text-sm font-medium">{formatUptime(health?.uptime)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{zh.settings.system.environment}</p>
              <p className="text-sm font-medium">{health?.environment || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{zh.settings.system.runtime}</p>
              <p className="text-sm font-medium">{health?.runtime || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skill Status */}
      {skillStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Skill {zh.proactive.scheduler.status}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">总计</p>
                <p className="text-2xl font-bold">{skillStatus.totalSkills}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{zh.skills.card.enabled}</p>
                <p className="text-2xl font-bold text-green-600">{skillStatus.active}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{zh.skills.card.disabled}</p>
                <p className="text-2xl font-bold text-muted-foreground">{skillStatus.disabled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Status */}
      <Card>
        <CardHeader>
          <CardTitle>{zh.settings.services.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {servers.length === 0 ? (
            <p className="text-sm text-muted-foreground">{zh.common.noData}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{zh.settings.services.name}</TableHead>
                  <TableHead>{zh.settings.services.status}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {servers.map((server) => (
                  <TableRow key={server.id}>
                    <TableCell className="font-medium">{server.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          server.status === 'connected'
                            ? 'default'
                            : server.status === 'error'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {server.status === 'connected'
                          ? zh.settings.services.healthy
                          : server.status === 'error'
                            ? zh.settings.services.unhealthy
                            : zh.settings.services.unknown}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

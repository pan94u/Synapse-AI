'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { zh } from '@/messages/zh';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface InstalledSkill {
  skillId: string;
  version: string;
  installedAt: string;
  updatedAt: string;
}

export function InstalledList() {
  const [skills, setSkills] = useState<InstalledSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchInstalled = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<{ installed: InstalledSkill[] }>('/marketplace/installed');
      setSkills(data.installed);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : zh.common.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstalled();
  }, []);

  const handleUninstall = async (id: string) => {
    setActionId(id);
    try {
      await apiFetch(`/marketplace/installed/${id}`, { method: 'DELETE' });
      await fetchInstalled();
    } finally {
      setActionId(null);
    }
  };

  const handleUpdate = async (id: string) => {
    setActionId(id);
    try {
      await apiFetch(`/marketplace/installed/${id}/update`, { method: 'POST' });
      await fetchInstalled();
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3 mt-4">
        {Array.from({ length: 3 }).map((_, i) => (
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

  if (skills.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <p>{zh.marketplace.empty.installed}</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{zh.marketplace.installed.name}</TableHead>
          <TableHead>{zh.marketplace.installed.version}</TableHead>
          <TableHead>{zh.marketplace.installed.installedAt}</TableHead>
          <TableHead>{zh.common.actions}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {skills.map((skill) => (
          <TableRow key={skill.skillId}>
            <TableCell className="font-medium">{skill.skillId}</TableCell>
            <TableCell>
              <Badge variant="outline">v{skill.version}</Badge>
            </TableCell>
            <TableCell className="text-muted-foreground text-xs">
              {new Date(skill.installedAt).toLocaleString('zh-CN')}
            </TableCell>
            <TableCell>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpdate(skill.skillId)}
                  disabled={actionId === skill.skillId}
                >
                  {actionId === skill.skillId ? zh.marketplace.installed.updating : zh.marketplace.installed.update}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUninstall(skill.skillId)}
                  disabled={actionId === skill.skillId}
                >
                  {actionId === skill.skillId ? zh.marketplace.installed.uninstalling : zh.marketplace.installed.uninstall}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

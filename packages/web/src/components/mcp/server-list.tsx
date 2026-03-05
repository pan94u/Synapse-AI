'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { zh } from '@/messages/zh';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, Plus, Trash2 } from 'lucide-react';
import { AddServerDialog } from './add-server-dialog';

interface McpToolInfo {
  name: string;
  description: string;
  serverId: string;
  requireApproval: boolean;
}

interface McpServer {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error' | 'registered' | 'starting' | 'stopped';
  tools: McpToolInfo[];
}

export function ServerList() {
  const [servers, setServers] = useState<McpServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restartingId, setRestartingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const fetchServers = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<{ servers: McpServer[] }>('/mcp/servers');
      setServers(data.servers);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : zh.common.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
  }, []);

  const handleRestart = async (id: string) => {
    setRestartingId(id);
    try {
      await apiFetch(`/mcp/servers/${id}/restart`, { method: 'POST' });
      await fetchServers();
    } finally {
      setRestartingId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(zh.mcp.server.confirmDelete.replace('{name}', name))) return;
    setDeletingId(id);
    try {
      await apiFetch(`/mcp/servers/${id}`, { method: 'DELETE' });
      await fetchServers();
    } finally {
      setDeletingId(null);
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

  const statusVariant = (status: string) => {
    switch (status) {
      case 'connected': return 'default' as const;
      case 'disconnected': return 'secondary' as const;
      case 'error': return 'destructive' as const;
      default: return 'outline' as const;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'connected': return zh.mcp.server.connected;
      case 'disconnected': return zh.mcp.server.disconnected;
      case 'error': return zh.mcp.server.error;
      default: return status;
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={() => setShowAddDialog(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          {zh.mcp.server.add}
        </Button>
      </div>

      {servers.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          <p>{zh.mcp.empty.servers}</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{zh.mcp.server.name}</TableHead>
              <TableHead>{zh.mcp.server.status}</TableHead>
              <TableHead>{zh.mcp.server.tools}</TableHead>
              <TableHead>{zh.mcp.server.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {servers.map((server) => (
              <TableRow key={server.id}>
                <TableCell className="font-medium">{server.name}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(server.status)}>
                    {statusLabel(server.status)}
                  </Badge>
                </TableCell>
                <TableCell>{server.tools?.length ?? 0}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestart(server.id)}
                      disabled={restartingId === server.id}
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${restartingId === server.id ? 'animate-spin' : ''}`} />
                      {restartingId === server.id ? zh.mcp.server.restarting : zh.mcp.server.restart}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(server.id, server.name)}
                      disabled={deletingId === server.id}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {zh.mcp.server.delete}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <AddServerDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={fetchServers}
      />
    </div>
  );
}

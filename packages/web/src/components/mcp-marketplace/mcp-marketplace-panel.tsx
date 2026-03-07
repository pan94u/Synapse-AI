'use client';

import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { McpMarketplaceStats } from './mcp-marketplace-stats';
import { ServerBrowser } from './server-browser';
import { ServerIntegrationGuide } from './server-integration-guide';
import { SwaggerImportDialog } from './swagger-import-dialog';
import { apiFetch } from '@/lib/api';
import { zh } from '@/messages/zh';
import { Skeleton } from '@/components/ui/skeleton';

interface InstallRecord {
  serverId: string;
  version: string;
  installedAt: string;
}

interface PendingServer {
  id: string;
  name: string;
  category: string;
  author: { id: string; name: string };
  publishedAt: string;
}

function InstalledList() {
  const [records, setRecords] = useState<InstallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const t = zh.mcpMarketplace;

  const fetchInstalled = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<{ installed: InstallRecord[] }>('/mcp-marketplace/installed');
      setRecords(data.installed);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInstalled(); }, []);

  const handleUninstall = async (serverId: string) => {
    try {
      await apiFetch(`/mcp-marketplace/servers/${serverId}/install`, { method: 'DELETE' });
      await fetchInstalled();
    } catch {}
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

  if (records.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <p>{t.empty.installed}</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t.installed.name}</TableHead>
          <TableHead>{t.installed.version}</TableHead>
          <TableHead>{t.installed.installedAt}</TableHead>
          <TableHead>{zh.common.actions}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((record) => (
          <TableRow key={record.serverId}>
            <TableCell className="font-medium">{record.serverId}</TableCell>
            <TableCell className="text-muted-foreground">{record.version}</TableCell>
            <TableCell className="text-muted-foreground text-xs">
              {new Date(record.installedAt).toLocaleString('zh-CN')}
            </TableCell>
            <TableCell>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleUninstall(record.serverId)}
              >
                {t.installed.uninstall}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function PendingQueue() {
  const [servers, setServers] = useState<PendingServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const t = zh.mcpMarketplace.reviewQueue;

  const fetchPending = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<{ servers: PendingServer[] }>('/mcp-marketplace/pending');
      setServers(data.servers);
    } catch {
      setServers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  const handleApprove = async (serverId: string) => {
    setActionId(serverId);
    try {
      await apiFetch(`/mcp-marketplace/servers/${serverId}/review`, {
        method: 'POST',
        body: JSON.stringify({ action: 'approve', reviewer: 'admin' }),
      });
      await fetchPending();
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    setRejecting(true);
    try {
      await apiFetch(`/mcp-marketplace/servers/${rejectTarget}/review`, {
        method: 'POST',
        body: JSON.stringify({ action: 'reject', reviewer: 'admin', reason: rejectReason.trim() }),
      });
      setRejectTarget(null);
      setRejectReason('');
      await fetchPending();
    } finally {
      setRejecting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3 mt-4">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  if (servers.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <p>{t.empty}</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t.name}</TableHead>
            <TableHead>{t.category}</TableHead>
            <TableHead>{t.author}</TableHead>
            <TableHead>{t.submittedAt}</TableHead>
            <TableHead>{zh.common.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {servers.map((server) => (
            <TableRow key={server.id}>
              <TableCell className="font-medium">{server.name}</TableCell>
              <TableCell><Badge variant="outline">{server.category}</Badge></TableCell>
              <TableCell className="text-muted-foreground text-sm">{server.author.name}</TableCell>
              <TableCell className="text-muted-foreground text-xs">
                {new Date(server.publishedAt).toLocaleString('zh-CN')}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleApprove(server.id)}
                    disabled={actionId === server.id}
                  >
                    {actionId === server.id ? t.approving : t.approve}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setRejectTarget(server.id)}
                    disabled={actionId === server.id}
                  >
                    {t.reject}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog
        open={!!rejectTarget}
        onOpenChange={() => { setRejectTarget(null); setRejectReason(''); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.reject}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t.rejectReason}</label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={t.rejectReasonPlaceholder}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectReason(''); }}>
              {t.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejecting || !rejectReason.trim()}
            >
              {rejecting ? t.rejecting : t.confirmReject}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function McpMarketplacePanel() {
  const t = zh.mcpMarketplace;
  const [importOpen, setImportOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <McpMarketplaceStats />
        <Button onClick={() => setImportOpen(true)} size="sm">
          {t.swaggerImport.button}
        </Button>
      </div>
      <SwaggerImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
      />
      <Tabs defaultValue="guide">
        <TabsList>
          <TabsTrigger value="guide">{t.tabs.guide}</TabsTrigger>
          <TabsTrigger value="browse">{t.tabs.browse}</TabsTrigger>
          <TabsTrigger value="installed">{t.tabs.installed}</TabsTrigger>
          <TabsTrigger value="pending">{t.tabs.pending}</TabsTrigger>
        </TabsList>
        <TabsContent value="guide">
          <ServerIntegrationGuide />
        </TabsContent>
        <TabsContent value="browse">
          <ServerBrowser />
        </TabsContent>
        <TabsContent value="installed">
          <InstalledList />
        </TabsContent>
        <TabsContent value="pending">
          <PendingQueue />
        </TabsContent>
      </Tabs>
    </div>
  );
}

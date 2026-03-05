'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { zh } from '@/messages/zh';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ImportKnowledgeDialog } from './import-knowledge-dialog';
import { Plus, Trash2 } from 'lucide-react';

interface KnowledgeDoc {
  id: string;
  title: string;
  type: string;
  size: number;
  createdAt: string;
}

export function KnowledgeBase() {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showImport, setShowImport] = useState(false);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const params = search ? `?q=${encodeURIComponent(search)}` : '';
      const data = await apiFetch<{ documents: KnowledgeDoc[] }>(`/knowledge${params}`);
      setDocs(data.documents);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : zh.common.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [search]);

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/knowledge/${id}`, { method: 'DELETE' });
      await fetchDocs();
    } catch {}
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading && docs.length === 0) {
    return (
      <div className="space-y-3 mt-4">
        {Array.from({ length: 4 }).map((_, i) => (
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

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center gap-2">
        <Input
          className="w-64"
          placeholder={zh.memory.knowledge.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button size="sm" onClick={() => setShowImport(true)} className="ml-auto">
          <Plus className="h-4 w-4" />
          {zh.memory.knowledge.import}
        </Button>
      </div>

      {docs.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          <p>{zh.memory.empty.knowledge}</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{zh.memory.knowledge.title}</TableHead>
              <TableHead>{zh.memory.knowledge.type}</TableHead>
              <TableHead>{zh.memory.knowledge.size}</TableHead>
              <TableHead>{zh.memory.knowledge.createdAt}</TableHead>
              <TableHead>{zh.common.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {docs.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">{doc.title}</TableCell>
                <TableCell>{doc.type}</TableCell>
                <TableCell>{formatSize(doc.size)}</TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {new Date(doc.createdAt).toLocaleString('zh-CN')}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ImportKnowledgeDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        onImported={fetchDocs}
      />
    </div>
  );
}

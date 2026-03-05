'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { zh } from '@/messages/zh';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrgMemoryDialog } from './org-memory-dialog';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface OrgMemoryEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt?: string;
}

const CATEGORIES = ['all', 'policies', 'decisions', 'lessons', 'knowledge'] as const;

export function OrgMemory() {
  const [entries, setEntries] = useState<OrgMemoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<OrgMemoryEntry | null>(null);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (category !== 'all') params.set('category', category);
      if (search) params.set('q', search);
      const query = params.toString();
      const data = await apiFetch<{ entries: OrgMemoryEntry[] }>(`/org-memory${query ? `?${query}` : ''}`);
      setEntries(data.entries);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : zh.common.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [category, search]);

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/org-memory/${id}`, { method: 'DELETE' });
      await fetchEntries();
    } catch {}
  };

  const categoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      all: zh.memory.org.all,
      policies: zh.memory.org.policies,
      decisions: zh.memory.org.decisions,
      lessons: zh.memory.org.lessons,
      knowledge: zh.memory.org.knowledge,
    };
    return labels[cat] || cat;
  };

  if (loading && entries.length === 0) {
    return (
      <div className="space-y-3 mt-4">
        {Array.from({ length: 4 }).map((_, i) => (
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

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Input
          className="w-64"
          placeholder={zh.memory.org.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {CATEGORIES.map((cat) => (
          <Button
            key={cat}
            variant={category === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategory(cat)}
          >
            {categoryLabel(cat)}
          </Button>
        ))}
        <Button size="sm" onClick={() => { setEditingEntry(null); setDialogOpen(true); }} className="ml-auto">
          <Plus className="h-4 w-4" />
          {zh.memory.org.add}
        </Button>
      </div>

      {entries.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          <p>{zh.memory.empty.org}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Card key={entry.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{entry.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{categoryLabel(entry.category)}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { setEditingEntry(entry); setDialogOpen(true); }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">{entry.content}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(entry.createdAt).toLocaleString('zh-CN')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <OrgMemoryDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditingEntry(null); }}
        onSaved={fetchEntries}
        entry={editingEntry}
      />
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { zh } from '@/messages/zh';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { JournalDialog } from './journal-dialog';
import { Plus, Eye } from 'lucide-react';

interface JournalEntry {
  id: string;
  title: string;
  context: string;
  decision: string;
  outcome: string;
  timestamp: string;
}

export function JournalView() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<{ entries: JournalEntry[] }>('/decision/journal');
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
  }, []);

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

  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          {zh.decision.journal.create}
        </Button>
      </div>

      {entries.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          <p>{zh.decision.empty.journal}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Card key={entry.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{entry.title}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedEntry(entry)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    {zh.decision.journal.view}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">{entry.context}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(entry.timestamp).toLocaleString('zh-CN')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <JournalDialog
        open={showCreate || !!selectedEntry}
        onClose={() => { setShowCreate(false); setSelectedEntry(null); }}
        onCreated={fetchEntries}
        entry={selectedEntry}
        mode={selectedEntry ? 'view' : 'create'}
      />
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { zh } from '@/messages/zh';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePersonaStore } from '@/stores/persona-store';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface Fact {
  id: string;
  fact: string;
  confidence: number;
  source: string;
}

interface Persona {
  id: string;
  name: string;
}

export function PersonalMemory() {
  const personas = usePersonaStore((s) => s.personas);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('');
  const [facts, setFacts] = useState<Fact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newFact, setNewFact] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const fetchFacts = async (personaId: string) => {
    try {
      setLoading(true);
      const data = await apiFetch<{ facts: Fact[] }>(`/memory/${personaId}/facts`);
      setFacts(data.facts);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : zh.common.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPersonaId) {
      fetchFacts(selectedPersonaId);
    }
  }, [selectedPersonaId]);

  const handleAdd = async () => {
    if (!newFact.trim() || !selectedPersonaId) return;
    try {
      await apiFetch(`/memory/${selectedPersonaId}/facts`, {
        method: 'POST',
        body: JSON.stringify({ fact: newFact }),
      });
      setNewFact('');
      await fetchFacts(selectedPersonaId);
    } catch {}
  };

  const handleEdit = async (id: string) => {
    if (!editValue.trim() || !selectedPersonaId) return;
    try {
      await apiFetch(`/memory/${selectedPersonaId}/facts/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ fact: editValue }),
      });
      setEditingId(null);
      setEditValue('');
      await fetchFacts(selectedPersonaId);
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!selectedPersonaId) return;
    try {
      await apiFetch(`/memory/${selectedPersonaId}/facts/${id}`, { method: 'DELETE' });
      await fetchFacts(selectedPersonaId);
    } catch {}
  };

  return (
    <div className="space-y-4 mt-4">
      <Select value={selectedPersonaId} onValueChange={setSelectedPersonaId}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder={zh.memory.personal.selectPersona} />
        </SelectTrigger>
        <SelectContent>
          {personas.map((p: Persona) => (
            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {!selectedPersonaId ? (
        <div className="text-center text-muted-foreground py-12">
          <p>{zh.memory.personal.selectPersona}</p>
        </div>
      ) : loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center text-muted-foreground py-12">
          <p>{zh.common.error}: {error}</p>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <Input
              placeholder={zh.memory.personal.factPlaceholder}
              value={newFact}
              onChange={(e) => setNewFact(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <Button size="sm" onClick={handleAdd} disabled={!newFact.trim()}>
              <Plus className="h-4 w-4" />
              {zh.memory.personal.add}
            </Button>
          </div>

          {facts.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <p>{zh.memory.empty.personal}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {facts.map((fact) => (
                <Card key={fact.id}>
                  <CardContent className="p-4">
                    {editingId === fact.id ? (
                      <div className="flex gap-2">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleEdit(fact.id)}
                        />
                        <Button size="sm" onClick={() => handleEdit(fact.id)}>
                          {zh.common.save}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                          {zh.common.cancel}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm">{fact.fact}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{zh.memory.personal.confidence}: {Math.round(fact.confidence * 100)}%</Badge>
                            <span className="text-xs text-muted-foreground">{fact.source}</span>
                          </div>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setEditingId(fact.id); setEditValue(fact.fact); }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(fact.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

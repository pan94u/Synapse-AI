'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { zh } from '@/messages/zh';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SkillCard } from './skill-card';
import { SkillDetailDialog } from './skill-detail-dialog';
import { CreateSkillDialog } from './create-skill-dialog';
import { Plus } from 'lucide-react';

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'active' | 'disabled' | 'draft';
  parameters?: Array<{ name: string; type: string; description: string; required?: boolean }>;
}

export function SkillList() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<{ skills: Skill[] }>('/skills');
      setSkills(data.skills);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : zh.common.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const handleToggle = async (id: string, enabled: boolean) => {
    const status = enabled ? 'active' : 'disabled';
    try {
      await apiFetch(`/skills/${id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      });
      setSkills((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    } catch {}
  };

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
        {Array.from({ length: 6 }).map((_, i) => (
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

  const categories = ['all', ...Array.from(new Set(skills.map((s) => s.category)))];
  const filtered = categoryFilter === 'all' ? skills : skills.filter((s) => s.category === categoryFilter);

  return (
    <>
      <div className="flex items-center justify-between mt-4 mb-4">
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={categoryFilter === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategoryFilter(cat)}
            >
              {cat === 'all' ? zh.skills.filter.all : cat}
            </Button>
          ))}
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          {zh.skills.createBtn}
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          <p>{zh.skills.empty.skills}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              onToggle={handleToggle}
              onClick={() => setSelectedSkill(skill)}
            />
          ))}
        </div>
      )}

      <SkillDetailDialog
        skill={selectedSkill}
        open={!!selectedSkill}
        onClose={() => setSelectedSkill(null)}
        onExecuted={fetchSkills}
      />

      <CreateSkillDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={fetchSkills}
      />
    </>
  );
}

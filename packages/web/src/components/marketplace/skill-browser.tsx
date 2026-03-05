'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { zh } from '@/messages/zh';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MarketplaceCard } from './marketplace-card';
import { SkillDetailDialog } from './skill-detail-dialog';

export interface MarketplaceSkill {
  id: string;
  name: string;
  description: string;
  category: string;
  author: string;
  version: string;
  rating: number;
  downloads: number;
  installed: boolean;
}

export function SkillBrowser() {
  const [skills, setSkills] = useState<MarketplaceSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedSkill, setSelectedSkill] = useState<MarketplaceSkill | null>(null);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      const query = params.toString();
      const data = await apiFetch<{ skills: MarketplaceSkill[] }>(
        `/marketplace/browse${query ? `?${query}` : ''}`
      );
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
  }, [search, categoryFilter]);

  const handleInstall = async (id: string) => {
    try {
      await apiFetch(`/marketplace/${id}/install`, { method: 'POST' });
      await fetchSkills();
    } catch {}
  };

  if (loading && skills.length === 0) {
    return (
      <div className="space-y-4 mt-4">
        <Skeleton className="h-9 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
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

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Input
          className="w-64"
          placeholder={zh.marketplace.browse.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={categoryFilter === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategoryFilter(cat)}
          >
            {cat === 'all' ? zh.marketplace.browse.all : cat}
          </Button>
        ))}
      </div>

      {skills.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          <p>{search ? zh.marketplace.empty.search : zh.marketplace.empty.browse}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {skills.map((skill) => (
            <MarketplaceCard
              key={skill.id}
              skill={skill}
              onInstall={() => handleInstall(skill.id)}
              onClick={() => setSelectedSkill(skill)}
            />
          ))}
        </div>
      )}

      <SkillDetailDialog
        skill={selectedSkill}
        open={!!selectedSkill}
        onClose={() => setSelectedSkill(null)}
        onInstall={handleInstall}
      />
    </div>
  );
}

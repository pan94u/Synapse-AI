'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { zh } from '@/messages/zh';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ServerCard } from './server-card';
import { ServerDetailDialog } from './server-detail-dialog';

export interface MCPServerListing {
  id: string;
  name: string;
  description: string;
  category: string;
  author: { id: string; name: string };
  version: string;
  transport: 'stdio' | 'sse';
  toolCount: number;
  toolNames: string[];
  uptimeRate: number;
  avgLatencyMs: number;
  errorRate: number;
  totalCalls: number;
  installs: number;
  rating: { average: number; count: number };
  status: string;
  tags: string[];
  publishedAt: string;
  updatedAt: string;
}

export function ServerBrowser() {
  const [listings, setListings] = useState<MCPServerListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedListing, setSelectedListing] = useState<MCPServerListing | null>(null);

  const t = zh.mcpMarketplace;

  const fetchListings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      const query = params.toString();
      const data = await apiFetch<{ servers: MCPServerListing[] }>(
        `/mcp-marketplace/browse${query ? `?${query}` : ''}`,
      );
      setListings(data.servers);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : zh.common.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [search, categoryFilter]);

  const handleInstall = async (id: string) => {
    try {
      await apiFetch(`/mcp-marketplace/servers/${id}/install`, { method: 'POST' });
      await fetchListings();
    } catch {}
  };

  if (loading && listings.length === 0) {
    return (
      <div className="space-y-4 mt-4">
        <Skeleton className="h-9 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
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

  const categories = ['all', ...Array.from(new Set(listings.map((s) => s.category)))];

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Input
          className="w-64"
          placeholder={t.browse.search}
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
            {cat === 'all' ? t.browse.all : cat}
          </Button>
        ))}
      </div>

      {listings.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          <p>{search ? t.empty.search : t.empty.browse}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ServerCard
              key={listing.id}
              listing={listing}
              onInstall={() => handleInstall(listing.id)}
              onClick={() => setSelectedListing(listing)}
            />
          ))}
        </div>
      )}

      <ServerDetailDialog
        listing={selectedListing}
        open={!!selectedListing}
        onClose={() => setSelectedListing(null)}
        onInstall={handleInstall}
      />
    </div>
  );
}

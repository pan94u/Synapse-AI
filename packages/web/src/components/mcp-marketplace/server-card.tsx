'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { zh } from '@/messages/zh';
import { Star, Wrench, Activity, Clock } from 'lucide-react';
import type { MCPServerListing } from './server-browser';

interface ServerCardProps {
  listing: MCPServerListing;
  onInstall: () => void;
  onClick: () => void;
}

export function ServerCard({ listing, onInstall, onClick }: ServerCardProps) {
  const [installing, setInstalling] = useState(false);
  const t = zh.mcpMarketplace.card;

  const handleInstall = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setInstalling(true);
    try {
      await onInstall();
    } finally {
      setInstalling(false);
    }
  };

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{listing.name}</CardTitle>
          <Badge variant="outline">{listing.category}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">{listing.author?.name}</p>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{listing.description}</p>
        <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Wrench className="h-3 w-3" />
            {listing.toolCount} {t.tools}
          </span>
          <span className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            {Math.round(listing.uptimeRate * 100)}% {t.uptime}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {listing.avgLatencyMs}ms
          </span>
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            {listing.rating.count > 0 ? listing.rating.average.toFixed(1) : '–'}
          </span>
        </div>
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" onClick={handleInstall} disabled={installing}>
            {installing ? t.installing : t.install}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

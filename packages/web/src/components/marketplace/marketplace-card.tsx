'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { zh } from '@/messages/zh';
import { Star, Download } from 'lucide-react';
import type { MarketplaceSkill } from './skill-browser';

interface MarketplaceCardProps {
  skill: MarketplaceSkill;
  onInstall: () => void;
  onClick: () => void;
}

export function MarketplaceCard({ skill, onInstall, onClick }: MarketplaceCardProps) {
  const [installing, setInstalling] = useState(false);

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
          <CardTitle className="text-base">{skill.name}</CardTitle>
          <Badge variant="outline">{skill.category}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">{skill.author?.name ?? skill.author}</p>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{skill.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              {(typeof skill.rating === 'number' ? skill.rating : skill.rating?.average ?? 0).toFixed(1)}
            </span>
            <span className="flex items-center gap-1">
              <Download className="h-3.5 w-3.5" />
              {skill.downloads}
            </span>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <Button size="sm" onClick={handleInstall} disabled={installing}>
              {installing ? zh.marketplace.card.installing : zh.marketplace.card.install}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

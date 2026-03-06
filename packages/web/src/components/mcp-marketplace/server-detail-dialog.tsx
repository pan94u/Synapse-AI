'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { zh } from '@/messages/zh';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Star, Activity, Clock, Wrench } from 'lucide-react';
import type { MCPServerListing } from './server-browser';

interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface ServerDetailDialogProps {
  listing: MCPServerListing | null;
  open: boolean;
  onClose: () => void;
  onInstall: (id: string) => Promise<void>;
}

export function ServerDetailDialog({ listing, open, onClose, onInstall }: ServerDetailDialogProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [installing, setInstalling] = useState(false);
  const t = zh.mcpMarketplace;

  useEffect(() => {
    if (listing) {
      apiFetch<{ reviews: Review[] }>(`/mcp-marketplace/servers/${listing.id}/reviews`)
        .then((data) => setReviews(data.reviews))
        .catch(() => setReviews([]));
    }
  }, [listing]);

  if (!listing) return null;

  const handleInstall = async () => {
    setInstalling(true);
    try {
      await onInstall(listing.id);
    } finally {
      setInstalling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{listing.name}</DialogTitle>
          <DialogDescription>
            {listing.author?.name} · v{listing.version} · {listing.transport}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm">{listing.description}</p>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Wrench className="h-4 w-4" />
              {listing.toolCount} {t.detail.tools}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Activity className="h-4 w-4" />
              {Math.round(listing.uptimeRate * 100)}% {t.card.uptime}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-4 w-4" />
              {listing.avgLatencyMs}ms
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              {listing.rating.count > 0 ? listing.rating.average.toFixed(1) : '–'}
              ({listing.rating.count})
            </span>
          </div>

          {listing.toolNames && listing.toolNames.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-1">{t.detail.tools}</p>
              <div className="flex flex-wrap gap-1">
                {listing.toolNames.map((name) => (
                  <Badge key={name} variant="secondary" className="text-xs">
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button size="sm" onClick={handleInstall} disabled={installing}>
              {installing ? t.card.installing : t.card.install}
            </Button>
          </div>

          <Separator />

          <div>
            <h4 className="text-sm font-medium mb-2">{t.detail.reviews}</h4>
            {reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.detail.noReviews}</p>
            ) : (
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {reviews.map((review) => (
                  <div key={review.id} className="border rounded-md p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{review.userName}</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs">{review.rating}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(review.createdAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

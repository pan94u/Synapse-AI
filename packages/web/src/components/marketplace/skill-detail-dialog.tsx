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
import { ReviewDialog } from './review-dialog';
import { Star, Download } from 'lucide-react';
import type { MarketplaceSkill } from './skill-browser';

interface Review {
  id: string;
  author: string;
  rating: number;
  comment: string;
  timestamp: string;
}

interface SkillDetailDialogProps {
  skill: MarketplaceSkill | null;
  open: boolean;
  onClose: () => void;
  onInstall: (id: string) => Promise<void>;
}

export function SkillDetailDialog({ skill, open, onClose, onInstall }: SkillDetailDialogProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (skill) {
      apiFetch<{ reviews: Review[] }>(`/marketplace/skills/${skill.id}/reviews`)
        .then((data) => setReviews(data.reviews))
        .catch(() => setReviews([]));
    }
  }, [skill]);

  if (!skill) return null;

  const handleInstall = async () => {
    setInstalling(true);
    try {
      await onInstall(skill.id);
    } finally {
      setInstalling(false);
    }
  };

  return (
    <>
      <Dialog open={open && !showReview} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{skill.name}</DialogTitle>
            <DialogDescription>{skill.author?.name ?? skill.author} · v{skill.version}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm">{skill.description}</p>

            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                {(typeof skill.rating === 'number' ? skill.rating : skill.rating?.average ?? 0).toFixed(1)}
              </span>
              <span className="flex items-center gap-1">
                <Download className="h-4 w-4" />
                {skill.downloads} {zh.marketplace.card.downloads}
              </span>
              <Badge variant="outline">{skill.category}</Badge>
            </div>

            <div className="flex gap-2">
              <Button size="sm" onClick={handleInstall} disabled={installing}>
                {installing ? zh.marketplace.card.installing : zh.marketplace.card.install}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowReview(true)}>
                {zh.marketplace.detail.writeReview}
              </Button>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-2">{zh.marketplace.detail.reviews}</h4>
              {reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">{zh.marketplace.detail.noReviews}</p>
              ) : (
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <div key={review.id} className="border rounded-md p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{review.author}</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs">{review.rating}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(review.timestamp).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ReviewDialog
        skillId={skill.id}
        open={showReview}
        onClose={() => setShowReview(false)}
        onSubmitted={() => {
          setShowReview(false);
          apiFetch<{ reviews: Review[] }>(`/marketplace/skills/${skill.id}/reviews`)
            .then((data) => setReviews(data.reviews))
            .catch(() => {});
        }}
      />
    </>
  );
}

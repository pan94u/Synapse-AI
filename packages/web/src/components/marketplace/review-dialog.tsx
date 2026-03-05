'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { zh } from '@/messages/zh';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';

interface ReviewDialogProps {
  skillId: string;
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

export function ReviewDialog({ skillId, open, onClose, onSubmitted }: ReviewDialogProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await apiFetch(`/marketplace/${skillId}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ rating, comment }),
      });
      onSubmitted();
      setRating(5);
      setComment('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{zh.marketplace.review.title}</DialogTitle>
          <DialogDescription>{zh.marketplace.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>{zh.marketplace.review.rating}</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-0.5"
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label>{zh.marketplace.review.comment}</Label>
            <Textarea
              placeholder={zh.marketplace.review.commentPlaceholder}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {zh.common.cancel}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !comment.trim()}>
            {submitting ? zh.marketplace.review.submitting : zh.marketplace.review.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

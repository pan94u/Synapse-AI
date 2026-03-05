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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface JournalEntry {
  id: string;
  title: string;
  context: string;
  decision: string;
  outcome: string;
  timestamp: string;
}

interface JournalDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  entry: JournalEntry | null;
  mode: 'create' | 'view';
}

export function JournalDialog({ open, onClose, onCreated, entry, mode }: JournalDialogProps) {
  const [title, setTitle] = useState('');
  const [context, setContext] = useState('');
  const [decision, setDecision] = useState('');
  const [outcome, setOutcome] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await apiFetch('/decision/journal', {
        method: 'POST',
        body: JSON.stringify({ title, context, decision, outcome }),
      });
      onCreated();
      onClose();
      setTitle('');
      setContext('');
      setDecision('');
      setOutcome('');
    } finally {
      setSubmitting(false);
    }
  };

  if (mode === 'view' && entry) {
    return (
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{entry.title}</DialogTitle>
            <DialogDescription>
              {new Date(entry.timestamp).toLocaleString('zh-CN')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-1">{zh.decision.journal.context}</h4>
              <p className="text-sm text-muted-foreground">{entry.context}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-1">{zh.decision.journal.decision}</h4>
              <p className="text-sm text-muted-foreground">{entry.decision}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-1">{zh.decision.journal.outcome}</h4>
              <p className="text-sm text-muted-foreground">{entry.outcome}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>{zh.common.close}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{zh.decision.journal.createTitle}</DialogTitle>
          <DialogDescription>{zh.decision.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>{zh.decision.journal.title}</Label>
            <Input
              placeholder={zh.decision.journal.titlePlaceholder}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>{zh.decision.journal.context}</Label>
            <Textarea
              placeholder={zh.decision.journal.contextPlaceholder}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-1">
            <Label>{zh.decision.journal.decision}</Label>
            <Textarea
              placeholder={zh.decision.journal.decisionPlaceholder}
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-1">
            <Label>{zh.decision.journal.outcome}</Label>
            <Textarea
              placeholder={zh.decision.journal.outcomePlaceholder}
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {zh.common.cancel}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !title.trim()}>
            {submitting ? zh.decision.journal.submitting : zh.decision.journal.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

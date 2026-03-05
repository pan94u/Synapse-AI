'use client';

import { useEffect, useState } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface OrgMemoryEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
}

interface OrgMemoryDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  entry: OrgMemoryEntry | null;
}

export function OrgMemoryDialog({ open, onClose, onSaved, entry }: OrgMemoryDialogProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('knowledge');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (entry) {
      setTitle(entry.title);
      setContent(entry.content);
      setCategory(entry.category);
    } else {
      setTitle('');
      setContent('');
      setCategory('knowledge');
    }
  }, [entry]);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      if (entry) {
        await apiFetch(`/org-memory/${entry.id}`, {
          method: 'PUT',
          body: JSON.stringify({ title, content, category }),
        });
      } else {
        await apiFetch('/org-memory', {
          method: 'POST',
          body: JSON.stringify({ title, content, category }),
        });
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const isEdit = !!entry;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? zh.memory.dialog.editTitle : zh.memory.dialog.createTitle}
          </DialogTitle>
          <DialogDescription>{zh.memory.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>{zh.memory.org.title}</Label>
            <Input
              placeholder={zh.memory.org.titlePlaceholder}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>{zh.memory.org.category}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="policies">{zh.memory.org.policies}</SelectItem>
                <SelectItem value="decisions">{zh.memory.org.decisions}</SelectItem>
                <SelectItem value="lessons">{zh.memory.org.lessons}</SelectItem>
                <SelectItem value="knowledge">{zh.memory.org.knowledge}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>{zh.memory.org.content}</Label>
            <Textarea
              placeholder={zh.memory.org.contentPlaceholder}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {zh.common.cancel}
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !title.trim()}>
            {saving ? zh.memory.dialog.saving : zh.memory.dialog.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

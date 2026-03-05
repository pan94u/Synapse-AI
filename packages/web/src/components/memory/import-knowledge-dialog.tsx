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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ImportKnowledgeDialogProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

export function ImportKnowledgeDialog({ open, onClose, onImported }: ImportKnowledgeDialogProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [docType, setDocType] = useState('text');
  const [importing, setImporting] = useState(false);

  const handleSubmit = async () => {
    setImporting(true);
    try {
      await apiFetch('/knowledge', {
        method: 'POST',
        body: JSON.stringify({ title, content, type: docType }),
      });
      onImported();
      onClose();
      setTitle('');
      setContent('');
      setDocType('text');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{zh.memory.knowledge.importTitle}</DialogTitle>
          <DialogDescription>{zh.memory.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>{zh.memory.knowledge.docTitle}</Label>
            <Input
              placeholder={zh.memory.knowledge.docTitlePlaceholder}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>{zh.memory.knowledge.docType}</Label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="markdown">Markdown</SelectItem>
                <SelectItem value="html">HTML</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>{zh.memory.knowledge.docContent}</Label>
            <Textarea
              placeholder={zh.memory.knowledge.docContentPlaceholder}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {zh.common.cancel}
          </Button>
          <Button onClick={handleSubmit} disabled={importing || !title.trim() || !content.trim()}>
            {importing ? zh.memory.knowledge.importing : zh.memory.knowledge.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

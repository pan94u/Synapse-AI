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

interface CreateSkillDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateSkillDialog({ open, onClose, onCreated }: CreateSkillDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [steps, setSteps] = useState('');
  const [creating, setCreating] = useState(false);

  const handleSubmit = async () => {
    setCreating(true);
    try {
      let parsedSteps;
      try {
        parsedSteps = JSON.parse(steps);
      } catch {
        parsedSteps = [{ action: steps }];
      }
      await apiFetch('/skills/custom', {
        method: 'POST',
        body: JSON.stringify({ name, description, category, steps: parsedSteps }),
      });
      onCreated();
      onClose();
      setName('');
      setDescription('');
      setCategory('');
      setSteps('');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{zh.skills.create.title}</DialogTitle>
          <DialogDescription>{zh.skills.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>{zh.skills.create.name}</Label>
            <Input
              placeholder={zh.skills.create.namePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>{zh.skills.create.description}</Label>
            <Input
              placeholder={zh.skills.create.descriptionPlaceholder}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>{zh.skills.create.category}</Label>
            <Input
              placeholder={zh.skills.create.category}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>{zh.skills.create.steps}</Label>
            <Textarea
              placeholder={zh.skills.create.stepsPlaceholder}
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {zh.common.cancel}
          </Button>
          <Button onClick={handleSubmit} disabled={creating || !name.trim()}>
            {creating ? zh.skills.create.creating : zh.skills.create.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

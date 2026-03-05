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
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Skill } from './skill-list';

interface SkillDetailDialogProps {
  skill: Skill | null;
  open: boolean;
  onClose: () => void;
  onExecuted: () => void;
}

export function SkillDetailDialog({ skill, open, onClose, onExecuted }: SkillDetailDialogProps) {
  const [executing, setExecuting] = useState(false);
  const [params, setParams] = useState<Record<string, string>>({});

  if (!skill) return null;

  const handleExecute = async () => {
    setExecuting(true);
    try {
      await apiFetch(`/skills/${skill.id}/execute`, {
        method: 'POST',
        body: JSON.stringify({ parameters: params }),
      });
      onExecuted();
      onClose();
    } finally {
      setExecuting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{skill.name}</DialogTitle>
          <DialogDescription>{skill.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Badge variant="outline">{skill.category}</Badge>
            <Badge variant={skill.status === 'active' ? 'default' : 'secondary'}>
              {skill.status === 'active' ? zh.skills.card.enabled : zh.skills.card.disabled}
            </Badge>
          </div>

          {skill.parameters && skill.parameters.length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">{zh.skills.detail.parameters}</h4>
              {skill.parameters.map((param) => (
                <div key={param.name} className="space-y-1">
                  <Label>
                    {param.name}
                    {param.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  <Input
                    placeholder={param.description}
                    value={params[param.name] || ''}
                    onChange={(e) =>
                      setParams((prev) => ({ ...prev, [param.name]: e.target.value }))
                    }
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{zh.skills.detail.noParams}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {zh.common.cancel}
          </Button>
          <Button onClick={handleExecute} disabled={executing || skill.status !== 'active'}>
            {executing ? zh.skills.detail.executing : zh.skills.detail.execute}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

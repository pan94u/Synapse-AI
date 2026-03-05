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
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

interface AddServerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface EnvEntry {
  key: string;
  value: string;
}

export function AddServerDialog({ open, onOpenChange, onSuccess }: AddServerDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [command, setCommand] = useState('bun');
  const [args, setArgs] = useState('');
  const [envEntries, setEnvEntries] = useState<EnvEntry[]>([{ key: '', value: '' }]);
  const [enabled, setEnabled] = useState(true);
  const [autoStart, setAutoStart] = useState(true);

  const resetForm = () => {
    setId('');
    setName('');
    setDescription('');
    setCommand('bun');
    setArgs('');
    setEnvEntries([{ key: '', value: '' }]);
    setEnabled(true);
    setAutoStart(true);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!id.trim() || !name.trim()) {
      setError(zh.mcp.server.form.required);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const env: Record<string, string> = {};
      for (const entry of envEntries) {
        if (entry.key.trim()) {
          env[entry.key.trim()] = entry.value;
        }
      }

      const config = {
        id: id.trim(),
        name: name.trim(),
        description: description.trim(),
        transport: 'stdio' as const,
        command: command.trim(),
        args: args.trim() ? args.trim().split(/\s+/) : [],
        env,
        enabled,
        autoStart,
        healthCheck: { interval: 30000, timeout: 10000, retries: 3 },
        rateLimit: { maxRequests: 100, windowMs: 60000 },
        permissions: { tools: ['*'], resources: ['*'], requireApproval: [] },
        tags: [],
        category: 'custom' as const,
      };

      await apiFetch('/mcp/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : zh.common.error);
    } finally {
      setSubmitting(false);
    }
  };

  const addEnvEntry = () => setEnvEntries([...envEntries, { key: '', value: '' }]);

  const updateEnvEntry = (index: number, field: 'key' | 'value', val: string) => {
    const updated = [...envEntries];
    updated[index][field] = val;
    setEnvEntries(updated);
  };

  const removeEnvEntry = (index: number) => {
    setEnvEntries(envEntries.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{zh.mcp.server.add}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{zh.mcp.server.form.id}</Label>
              <Input value={id} onChange={(e) => setId(e.target.value)} placeholder="my-server" />
            </div>
            <div className="space-y-2">
              <Label>{zh.mcp.server.form.name}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Server" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{zh.mcp.server.form.description}</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{zh.mcp.server.form.command}</Label>
              <Input value={command} onChange={(e) => setCommand(e.target.value)} placeholder="bun" />
            </div>
            <div className="space-y-2">
              <Label>{zh.mcp.server.form.args}</Label>
              <Input value={args} onChange={(e) => setArgs(e.target.value)} placeholder="run src/index.ts" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{zh.mcp.server.form.env}</Label>
              <Button variant="outline" size="sm" type="button" onClick={addEnvEntry}>+</Button>
            </div>
            {envEntries.map((entry, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  className="flex-1"
                  value={entry.key}
                  onChange={(e) => updateEnvEntry(i, 'key', e.target.value)}
                  placeholder="KEY"
                />
                <Input
                  className="flex-1"
                  value={entry.value}
                  onChange={(e) => updateEnvEntry(i, 'value', e.target.value)}
                  placeholder="value"
                />
                {envEntries.length > 1 && (
                  <Button variant="outline" size="sm" type="button" onClick={() => removeEnvEntry(i)}>-</Button>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={enabled} onCheckedChange={setEnabled} />
              <Label>{zh.mcp.server.form.enabled}</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={autoStart} onCheckedChange={setAutoStart} />
              <Label>{zh.mcp.server.form.autoStart}</Label>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>
            {zh.common.cancel}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? zh.common.submitting : zh.common.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { zh } from '@/messages/zh';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface PendingSkill {
  id: string;
  name: string;
  category: string;
  author: { id: string; name: string };
  publishedAt: string;
  description: string;
}

export function ReviewQueue() {
  const [skills, setSkills] = useState<PendingSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const t = zh.marketplace.reviewQueue;

  const fetchPending = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<{ skills: PendingSkill[] }>('/marketplace/pending');
      setSkills(data.skills);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : zh.common.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (skillId: string) => {
    setActionId(skillId);
    try {
      await apiFetch(`/marketplace/skills/${skillId}/review`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'approve',
          reviewer: 'admin',
        }),
      });
      await fetchPending();
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    setRejecting(true);
    try {
      await apiFetch(`/marketplace/skills/${rejectTarget}/review`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'reject',
          reviewer: 'admin',
          reason: rejectReason.trim(),
        }),
      });
      setRejectTarget(null);
      setRejectReason('');
      await fetchPending();
    } finally {
      setRejecting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3 mt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <p>{zh.common.error}: {error}</p>
      </div>
    );
  }

  if (skills.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <p>{t.empty}</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t.name}</TableHead>
            <TableHead>{t.category}</TableHead>
            <TableHead>{t.author}</TableHead>
            <TableHead>{t.submittedAt}</TableHead>
            <TableHead>{zh.common.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {skills.map((skill) => (
            <TableRow key={skill.id}>
              <TableCell className="font-medium">{skill.name}</TableCell>
              <TableCell>
                <Badge variant="outline">{skill.category}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {skill.author.name}
              </TableCell>
              <TableCell className="text-muted-foreground text-xs">
                {new Date(skill.publishedAt).toLocaleString('zh-CN')}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleApprove(skill.id)}
                    disabled={actionId === skill.id}
                  >
                    {actionId === skill.id ? t.approving : t.approve}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setRejectTarget(skill.id)}
                    disabled={actionId === skill.id}
                  >
                    {t.reject}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!rejectTarget} onOpenChange={() => { setRejectTarget(null); setRejectReason(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.reject}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t.rejectReason}</label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={t.rejectReasonPlaceholder}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setRejectTarget(null); setRejectReason(''); }}
            >
              {t.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejecting || !rejectReason.trim()}
            >
              {rejecting ? t.rejecting : t.confirmReject}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

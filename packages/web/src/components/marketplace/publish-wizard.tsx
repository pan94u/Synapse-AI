'use client';

import { useState, useEffect, useCallback } from 'react';
import { zh } from '@/messages/zh';
import { apiFetch } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const t = zh.marketplace.publish;

interface SkillItem {
  id: string;
  name: string;
  description: string;
  category: string;
  source: string;
}

interface ReviewCheck {
  name: string;
  pass: boolean;
  reason: string;
}

interface ReviewResult {
  autoApprove: boolean;
  score: number;
  checks: ReviewCheck[];
}

interface PublishResult {
  skill: {
    id: string;
    status: string;
  };
  warnings: string[];
  reviewResult: ReviewResult;
}

interface PublishWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SourceMode = 'select' | 'import';

export function PublishWizard({ open, onOpenChange }: PublishWizardProps) {
  const [step, setStep] = useState(1);

  // Step 1 state
  const [sourceMode, setSourceMode] = useState<SourceMode>('select');
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [importContent, setImportContent] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');

  // Step 2 state
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // Step 3 state
  const [authorName, setAuthorName] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [tags, setTags] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);
  const [publishError, setPublishError] = useState('');

  // Load skills list
  useEffect(() => {
    if (!open) return;
    apiFetch<{ skills: SkillItem[] }>('/skills')
      .then(({ skills }) => setSkills(skills))
      .catch(() => {});
  }, [open]);

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setStep(1);
      setSourceMode('select');
      setSelectedSkillId('');
      setImportContent('');
      setImportError('');
      setReview(null);
      setReviewError('');
      setAuthorName('');
      setVersion('1.0.0');
      setTags('');
      setPublishResult(null);
      setPublishError('');
    }
  }, [open]);

  const effectiveSkillId = selectedSkillId;

  // Step 1 → Step 2: import if needed, then fetch preview
  const handleNext1 = useCallback(async () => {
    let skillId = selectedSkillId;

    if (sourceMode === 'import') {
      setImporting(true);
      setImportError('');
      try {
        const res = await apiFetch<{ skill: SkillItem }>('/skills/import', {
          method: 'POST',
          body: JSON.stringify({ content: importContent }),
        });
        skillId = res.skill.id;
        setSelectedSkillId(skillId);
      } catch (err) {
        setImportError(err instanceof Error ? err.message : '导入失败');
        setImporting(false);
        return;
      }
      setImporting(false);
    }

    // Now fetch review preview
    setStep(2);
    setReviewLoading(true);
    setReviewError('');
    try {
      const res = await apiFetch<{ review: ReviewResult }>('/marketplace/preview', {
        method: 'POST',
        body: JSON.stringify({ skillId }),
      });
      setReview(res.review);
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : '审核预览失败');
    }
    setReviewLoading(false);
  }, [sourceMode, selectedSkillId, importContent]);

  // Step 3: publish
  const handlePublish = useCallback(async () => {
    setPublishing(true);
    setPublishError('');
    try {
      const tagList = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const res = await apiFetch<PublishResult>('/marketplace/publish', {
        method: 'POST',
        body: JSON.stringify({
          skillId: effectiveSkillId,
          author: { id: 'user', name: authorName },
          version,
          tags: tagList.length > 0 ? tagList : undefined,
        }),
      });
      setPublishResult(res);
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : '发布失败');
    }
    setPublishing(false);
  }, [effectiveSkillId, authorName, version, tags]);

  const canNext1 =
    sourceMode === 'select' ? !!selectedSkillId : !!importContent.trim();
  const canNext2 = review !== null && review.score >= 30;
  const canPublish = !!authorName.trim() && !!version.trim();

  function getScoreColor(score: number) {
    if (score >= 70) return 'text-green-600';
    if (score >= 30) return 'text-yellow-600';
    return 'text-red-600';
  }

  function getScoreBg(score: number) {
    if (score >= 70) return 'bg-green-50 border-green-200';
    if (score >= 30) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.wizardTitle}</DialogTitle>
          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-1">
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    s === step
                      ? 'bg-primary text-primary-foreground'
                      : s < step
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {s}
                </div>
                <span className="text-xs text-muted-foreground">
                  {s === 1 ? t.step1Title : s === 2 ? t.step2Title : t.step3Title}
                </span>
                {s < 3 && <div className="w-6 h-px bg-border mx-1" />}
              </div>
            ))}
          </div>
        </DialogHeader>

        {/* ==================== Step 1: Choose Source ==================== */}
        {step === 1 && (
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              {/* Select existing */}
              <Card
                className={`cursor-pointer transition-colors ${
                  sourceMode === 'select'
                    ? 'border-primary ring-1 ring-primary'
                    : 'hover:border-muted-foreground/30'
                }`}
                onClick={() => setSourceMode('select')}
              >
                <CardContent className="p-4">
                  <p className="font-medium text-sm">{t.selectExisting}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t.selectExistingDesc}
                  </p>
                </CardContent>
              </Card>
              {/* Import SKILL.md */}
              <Card
                className={`cursor-pointer transition-colors ${
                  sourceMode === 'import'
                    ? 'border-primary ring-1 ring-primary'
                    : 'hover:border-muted-foreground/30'
                }`}
                onClick={() => setSourceMode('import')}
              >
                <CardContent className="p-4">
                  <p className="font-medium text-sm">{t.importNew}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t.importNewDesc}
                  </p>
                </CardContent>
              </Card>
            </div>

            {sourceMode === 'select' && (
              <div className="space-y-2">
                <Label>{t.selectExisting}</Label>
                <Select value={selectedSkillId} onValueChange={setSelectedSkillId}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择 Skill..." />
                  </SelectTrigger>
                  <SelectContent>
                    {skills.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} — {s.description.slice(0, 50)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {sourceMode === 'import' && (
              <div className="space-y-2">
                <Label>{t.importNew}</Label>
                <Textarea
                  className="min-h-[200px] font-mono text-xs"
                  placeholder={t.importPlaceholder}
                  value={importContent}
                  onChange={(e) => setImportContent(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">{t.importFormatHint}</p>
              </div>
            )}

            {importError && (
              <p className="text-sm text-red-600">{importError}</p>
            )}
          </div>
        )}

        {/* ==================== Step 2: Review Preview ==================== */}
        {step === 2 && (
          <div className="space-y-4 mt-2">
            {reviewLoading && (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-muted-foreground">{zh.common.loading}</p>
              </div>
            )}
            {reviewError && (
              <p className="text-sm text-red-600">{reviewError}</p>
            )}
            {review && (
              <>
                {/* Score hero */}
                <div
                  className={`rounded-lg border p-6 text-center ${getScoreBg(review.score)}`}
                >
                  <p className="text-sm text-muted-foreground mb-1">{t.score}</p>
                  <p className={`text-5xl font-bold ${getScoreColor(review.score)}`}>
                    {review.score}
                  </p>
                  <p className="text-xs mt-1">/100</p>
                  <p className="mt-3 text-sm font-medium">
                    {review.score >= 70
                      ? t.autoApprove
                      : review.score >= 30
                        ? t.pendingReview
                        : t.rejected}
                  </p>
                  {review.score < 30 && (
                    <p className="text-xs text-red-600 mt-1">{t.rejectedHint}</p>
                  )}
                </div>

                {/* Dimension checks */}
                <div className="grid grid-cols-2 gap-3">
                  {review.checks.map((check) => (
                    <Card key={check.name}>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm">{check.pass ? '✅' : '❌'}</span>
                          <span className="font-medium text-sm">{check.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{check.reason}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ==================== Step 3: Metadata & Publish ==================== */}
        {step === 3 && (
          <div className="space-y-4 mt-2">
            {!publishResult && (
              <>
                <div className="space-y-2">
                  <Label>{t.authorName}</Label>
                  <Input
                    placeholder={t.authorNamePlaceholder}
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.version}</Label>
                  <Input
                    placeholder="1.0.0"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.tags}</Label>
                  <Input
                    placeholder={t.tagsPlaceholder}
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                </div>
              </>
            )}

            {publishError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-medium text-red-700">{t.publishError}</p>
                <p className="text-xs text-red-600 mt-1">{publishError}</p>
              </div>
            )}

            {publishResult && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
                <p className="text-lg font-bold text-green-700">{t.publishSuccess}</p>
                <p className="text-sm text-green-600 mt-1">
                  {publishResult.skill.status === 'active'
                    ? t.publishedActive
                    : t.publishedPending}
                </p>
                <Badge
                  variant={publishResult.skill.status === 'active' ? 'default' : 'secondary'}
                  className="mt-3"
                >
                  {publishResult.skill.status}
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* ==================== Footer Buttons ==================== */}
        <div className="flex justify-between mt-4 pt-4 border-t">
          <div>
            {step > 1 && !publishResult && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                {t.prev}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              {publishResult ? t.done : zh.common.cancel}
            </Button>
            {step === 1 && (
              <Button onClick={handleNext1} disabled={!canNext1 || importing}>
                {importing ? t.importing : t.next}
              </Button>
            )}
            {step === 2 && (
              <Button onClick={() => setStep(3)} disabled={!canNext2}>
                {t.next}
              </Button>
            )}
            {step === 3 && !publishResult && (
              <Button onClick={handlePublish} disabled={!canPublish || publishing}>
                {publishing ? t.publishing : t.publishBtn}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

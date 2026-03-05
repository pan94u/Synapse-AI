'use client';

import { useState } from 'react';
import { zh } from '@/messages/zh';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PublishWizard } from './publish-wizard';

const t = zh.marketplace.guide;
const lc = zh.marketplace.lifecycle;
const qp = zh.marketplace.quickPublish;

interface CheckItem {
  label: string;
  required: boolean;
}

function ChecklistSection({ title, items }: { title: string; items: CheckItem[] }) {
  return (
    <div className="space-y-2">
      <h4 className="font-medium text-sm">{title}</h4>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.label} className="flex items-start gap-2 text-sm">
            <Badge variant={item.required ? 'default' : 'outline'} className="mt-0.5 text-[10px] px-1.5 shrink-0">
              {item.required ? t.required : t.optional}
            </Badge>
            <span className="text-muted-foreground">{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LifecycleNode({
  label,
  variant,
}: {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
}) {
  return (
    <div className="flex items-center justify-center">
      <Badge variant={variant} className="px-3 py-1.5 text-xs font-medium">
        {label}
      </Badge>
    </div>
  );
}

function LifecycleArrow({ label, className }: { label: string; className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-0.5 ${className ?? ''}`}>
      <span className="text-[10px] text-muted-foreground whitespace-nowrap">{label}</span>
      <div className="text-muted-foreground text-xs">→</div>
    </div>
  );
}

function LifecycleChart() {
  return (
    <div className="space-y-6">
      {/* Row 1: publish → active (auto approve path) */}
      <div className="flex items-center justify-center gap-3">
        <LifecycleNode label={lc.publish} variant="secondary" />
        <LifecycleArrow label={lc.autoApprove} />
        <LifecycleNode label={lc.active} variant="default" />
        <LifecycleArrow label={lc.qualityFail} />
        <LifecycleNode label={lc.suspended} variant="destructive" />
      </div>

      {/* Row 2: publish → pending → approve/reject paths */}
      <div className="flex items-center justify-center gap-3">
        <LifecycleNode label={lc.publish} variant="secondary" />
        <LifecycleArrow label={lc.manualReview} />
        <LifecycleNode label={lc.pendingReview} variant="secondary" />
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <LifecycleArrow label={lc.approve} />
            <LifecycleNode label={lc.active} variant="default" />
          </div>
          <div className="flex items-center gap-2">
            <LifecycleArrow label={lc.reject} />
            <LifecycleNode label={lc.rejected} variant="outline" />
          </div>
        </div>
      </div>

      {/* Row 3: Recovery paths */}
      <div className="flex items-center justify-center gap-3">
        <LifecycleNode label={lc.rejected} variant="outline" />
        <LifecycleArrow label={lc.reactivate} />
        <LifecycleNode label={lc.active} variant="default" />
        <LifecycleArrow label={lc.zeroDownloads} />
        <LifecycleNode label={lc.deprecated} variant="outline" />
      </div>
    </div>
  );
}

export function SubmissionGuide() {
  const [wizardOpen, setWizardOpen] = useState(false);

  return (
    <div className="space-y-6 mt-4">
      {/* Skill 生命周期 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{lc.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <LifecycleChart />
        </CardContent>
      </Card>

      {/* 快速发布入口 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{qp.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{qp.description}</p>
          <Button size="lg" className="w-full" onClick={() => setWizardOpen(true)}>
            {qp.button}
          </Button>
        </CardContent>
      </Card>

      <PublishWizard open={wizardOpen} onOpenChange={setWizardOpen} />

      {/* 概述 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.overview.title}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>{t.overview.description}</p>
        </CardContent>
      </Card>

      {/* SKILL.md 规范 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.structure.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{t.structure.description}</p>
          <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto whitespace-pre">
{`config/skills/{skill-id}/
└── SKILL.md          # 技能定义（唯一必需文件）`}
          </pre>
          <Separator />
          <p className="text-sm font-medium">{t.structure.frontmatterTitle}</p>
          <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto whitespace-pre">
{`---
name: my-skill                    # 唯一标识，kebab-case
description: 一句话说明用途和触发场景  # 必填，<200字
allowed-tools:                    # 必填，至少1个
  - database_db_query
  - memory_read
metadata:
  author: your-name               # 必填
  version: "1.0"                  # 语义化版本
category: data                    # 见下方分类列表
status: active                    # active | draft | disabled
parameters:                       # 可选
  - name: param-name
    type: string | number | select
    description: 参数说明
    required: true | false
    default: default-value
    options: [a, b, c]            # type=select 时必填
---

# Skill 正文（Markdown 指令）
...`}
          </pre>
        </CardContent>
      </Card>

      {/* 接入检查清单 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.checklist.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <ChecklistSection
            title={t.checklist.metadata}
            items={[
              { label: t.checks.nameUnique, required: true },
              { label: t.checks.descriptionClear, required: true },
              { label: t.checks.allowedToolsDeclared, required: true },
              { label: t.checks.authorVersion, required: true },
              { label: t.checks.categoryValid, required: true },
              { label: t.checks.parametersTyped, required: false },
            ]}
          />
          <Separator />
          <ChecklistSection
            title={t.checklist.instructions}
            items={[
              { label: t.checks.taskDescription, required: true },
              { label: t.checks.executionSteps, required: true },
              { label: t.checks.outputFormat, required: true },
              { label: t.checks.errorGuidance, required: false },
              { label: t.checks.examples, required: false },
            ]}
          />
          <Separator />
          <ChecklistSection
            title={t.checklist.security}
            items={[
              { label: t.checks.minimalTools, required: true },
              { label: t.checks.noSensitiveData, required: true },
              { label: t.checks.complianceAware, required: false },
              { label: t.checks.readOnlyPreferred, required: false },
            ]}
          />
        </CardContent>
      </Card>

      {/* 分类列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.categories.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {t.categories.list.map((cat) => (
              <div key={cat.id} className="flex items-center gap-2 text-sm">
                <Badge variant="outline">{cat.id}</Badge>
                <span className="text-muted-foreground">{cat.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 发布流程 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.workflow.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {t.workflow.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium">{step.title}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* 评审标准 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.review.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {t.review.criteria.map((criterion) => (
              <div key={criterion.name} className="flex items-start gap-3">
                <div className="flex items-center gap-2 min-w-[120px]">
                  <span className="font-medium text-sm">{criterion.name}</span>
                  <Badge variant="outline" className="text-[10px]">{criterion.weight}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{criterion.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

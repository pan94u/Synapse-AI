'use client';

import { zh } from '@/messages/zh';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const t = zh.mcpMarketplace.guide;

// ─── Shared helpers ───────────────────────────────────────────────────────────

function ChecklistSection({ title, items }: { title: string; items: { label: string; required: boolean }[] }) {
  return (
    <div className="space-y-2">
      <h4 className="font-medium text-sm">{title}</h4>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.label} className="flex items-start gap-2 text-sm">
            <Badge
              variant={item.required ? 'default' : 'outline'}
              className="mt-0.5 text-[10px] px-1.5 shrink-0"
            >
              {item.required ? t.required : t.optional}
            </Badge>
            <span className="text-muted-foreground">{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LifecycleNode({ label, variant }: { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }) {
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

// ─── Card 1: 概述 ─────────────────────────────────────────────────────────────

function OverviewCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t.overview.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>{t.overview.p1}</p>
        <p>{t.overview.p2}</p>
      </CardContent>
    </Card>
  );
}

// ─── Card 2: 接入流程 ─────────────────────────────────────────────────────────

function WorkflowCard() {
  return (
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
  );
}

// ─── Card 3: Server 类型 ──────────────────────────────────────────────────────

function TransportCard() {
  const { stdio, sse, compareRows } = t.transport;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t.transport.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* stdio */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="default">{stdio.label}</Badge>
              <span className="text-sm text-muted-foreground">{stdio.desc}</span>
            </div>
            <ul className="space-y-1">
              {stdio.scenarios.map((s) => (
                <li key={s} className="text-xs text-muted-foreground flex items-start gap-1">
                  <span className="mt-0.5">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">
              示例：<span className="font-medium text-foreground">{stdio.examples}</span>
            </p>
          </div>
          {/* SSE */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{sse.label}</Badge>
              <span className="text-sm text-muted-foreground">{sse.desc}</span>
            </div>
            <ul className="space-y-1">
              {sse.scenarios.map((s) => (
                <li key={s} className="text-xs text-muted-foreground flex items-start gap-1">
                  <span className="mt-0.5">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">
              示例：<span className="font-medium text-foreground">{sse.examples}</span>
            </p>
          </div>
        </div>

        {/* Compare table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">维度</TableHead>
              <TableHead>stdio</TableHead>
              <TableHead>SSE</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {compareRows.map((row) => (
              <TableRow key={row.dim}>
                <TableCell className="font-medium text-sm">{row.dim}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{row.stdio}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{row.sse}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ─── Card 4: 配置文件规范 ─────────────────────────────────────────────────────

function ConfigCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t.config.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{t.config.desc}</p>
        <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto whitespace-pre">
{`{
  "id": "my-server",
  "command": "bun",
  "args": ["packages/mcp-servers/src/my-server/index.ts"],
  "transport": "stdio",
  "permissions": {
    "tools": ["my_server_query_data", "my_server_list_records"],
    "requireApproval": ["my_server_update_record"]
  },
  "category": "database",
  "metadata": {
    "author": "your-name",
    "version": "1.0.0",
    "description": "一句话描述服务能力"
  },
  "env": {
    "DB_URL": "\${DATABASE_URL}"
  }
}`}
        </pre>
        <Separator />
        <div className="space-y-2">
          {t.config.fields.map((field) => (
            <div key={field.name} className="flex items-start gap-2 text-sm">
              <Badge
                variant={field.required ? 'default' : 'outline'}
                className="mt-0.5 text-[10px] px-1.5 shrink-0"
              >
                {field.required ? t.required : t.optional}
              </Badge>
              <code className="text-xs font-mono bg-muted px-1 rounded shrink-0">{field.name}</code>
              <span className="text-muted-foreground text-xs">{field.desc}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Card 5: 工具命名规范 ─────────────────────────────────────────────────────

function NamingCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t.naming.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{t.naming.format}</p>
        <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto whitespace-pre">
{`# 正确示例
database_query_records      ✓
feishu_send_message         ✓
http_api_fetch_report       ✓

# 错误示例
queryRecords                ✗  (缺少 server_id 前缀)
database-query-records      ✗  (使用了连字符)
db_qr                       ✗  (缩写不具业务语义)`}
        </pre>
        <ul className="space-y-1.5">
          {t.naming.rules.map((rule) => (
            <li key={rule} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="text-primary mt-0.5">✓</span>
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// ─── Card 6: 接入检查清单 ─────────────────────────────────────────────────────

function ChecklistCard() {
  const { checklist } = t;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{checklist.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <ChecklistSection
          title={checklist.config}
          items={[
            { label: checklist.checks.idUnique,        required: true },
            { label: checklist.checks.descClear,       required: true },
            { label: checklist.checks.transportMatch,  required: true },
            { label: checklist.checks.toolsDeclared,   required: true },
            { label: checklist.checks.authorVersion,   required: true },
          ]}
        />
        <Separator />
        <ChecklistSection
          title={checklist.health}
          items={[
            { label: checklist.checks.healthPass,  required: true },
            { label: checklist.checks.latencyOk,   required: false },
            { label: checklist.checks.errorRateOk, required: false },
          ]}
        />
        <Separator />
        <ChecklistSection
          title={checklist.security}
          items={[
            { label: checklist.checks.writeApproval,  required: true },
            { label: checklist.checks.noHardcode,     required: true },
            { label: checklist.checks.minimalTools,   required: true },
          ]}
        />
      </CardContent>
    </Card>
  );
}

// ─── Card 7: Server 生命周期 ──────────────────────────────────────────────────

function LifecycleCard() {
  const lc = t.lifecycle;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{lc.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Row 1: publish → active (auto approve path) */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <LifecycleNode label={lc.publish} variant="secondary" />
          <LifecycleArrow label={lc.autoApprove} />
          <LifecycleNode label={lc.active} variant="default" />
          <LifecycleArrow label={lc.qualityFail} />
          <LifecycleNode label={lc.suspended} variant="destructive" />
        </div>

        {/* Row 2: publish → pending → approve/reject paths */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <LifecycleNode label={lc.publish} variant="secondary" />
          <LifecycleArrow label={lc.manualReview} />
          <LifecycleNode label={lc.pending} variant="secondary" />
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
      </CardContent>
    </Card>
  );
}

// ─── Card 8: 审核标准 ─────────────────────────────────────────────────────────

function ReviewCard() {
  return (
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
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function ServerIntegrationGuide() {
  return (
    <div className="space-y-6 mt-4">
      <OverviewCard />
      <WorkflowCard />
      <TransportCard />
      <ConfigCard />
      <NamingCard />
      <ChecklistCard />
      <LifecycleCard />
      <ReviewCard />
    </div>
  );
}

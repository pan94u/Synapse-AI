'use client';

import { useState, useCallback } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { MCPServerCategory } from '@synapse/shared';

const t = zh.mcpMarketplace.swaggerImport;

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParsedTool {
  name: string;
  description: string;
  path: string;
  method: string;
}

interface ParseResult {
  serverId: string;
  serverName: string;
  description: string;
  baseUrl: string;
  version: string;
  tools: ParsedTool[];
}

const CATEGORIES: MCPServerCategory[] = [
  'infrastructure', 'communication', 'development',
  'hrm', 'finance', 'legal', 'crm', 'erp',
  'analytics', 'document', 'business', 'custom',
];

const CATEGORY_LABELS: Record<MCPServerCategory, string> = {
  infrastructure: '基础设施',
  communication: '沟通协作',
  development: '开发工具',
  hrm: '人力资源',
  finance: '财务',
  legal: '法务',
  crm: '客户关系',
  erp: '企业资源',
  analytics: '数据分析',
  document: '文档管理',
  business: '业务系统',
  custom: '自定义',
};

// ─── OpenAPI Parser ───────────────────────────────────────────────────────────

function toSnakeCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function toKebabCase(str: string): string {
  return toSnakeCase(str).replace(/_/g, '-');
}

function parseOpenAPI(json: unknown, overrideId?: string): ParseResult {
  const spec = json as Record<string, unknown>;
  const info = (spec.info ?? {}) as Record<string, string>;
  const title = info.title ?? 'Imported API';
  const version = info.version ?? '1.0.0';
  const description = info.description ?? title;
  const autoId = toKebabCase(title);
  const serverId = overrideId || autoId;
  const idPrefix = toSnakeCase(serverId);

  // Base URL
  let baseUrl = '';
  if (spec.openapi) {
    const servers = spec.servers as Array<{ url: string }> | undefined;
    baseUrl = servers?.[0]?.url ?? '';
  } else if (spec.swagger) {
    const host = (spec.host as string) ?? '';
    const basePath = (spec.basePath as string) ?? '';
    const schemes = (spec.schemes as string[]) ?? ['https'];
    baseUrl = host ? `${schemes[0]}://${host}${basePath}` : '';
  }

  // Parse paths → tools (cap at 50)
  const paths = (spec.paths ?? {}) as Record<string, Record<string, unknown>>;
  const tools: ParsedTool[] = [];
  const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'];

  outer: for (const [path, pathItem] of Object.entries(paths)) {
    for (const method of HTTP_METHODS) {
      if (tools.length >= 50) break outer;
      const op = pathItem[method] as Record<string, unknown> | undefined;
      if (!op) continue;

      const operationId = op.operationId as string | undefined;
      const summary = ((op.summary ?? op.description ?? `${method.toUpperCase()} ${path}`) as string)
        .slice(0, 120);

      let toolName: string;
      if (operationId) {
        toolName = `${idPrefix}_${toSnakeCase(operationId)}`;
      } else {
        const pathPart = path
          .split('/')
          .filter(Boolean)
          .map((s) => s.replace(/[{}]/g, '').replace(/-/g, '_'))
          .join('_');
        toolName = `${idPrefix}_${method}_${pathPart}`;
      }
      // Dedup
      if (!tools.find((t) => t.name === toolName)) {
        tools.push({ name: toolName, description: summary, path, method });
      }
    }
  }

  return { serverId: autoId, serverName: title, description, baseUrl, version, tools };
}

// ─── Step 1 ───────────────────────────────────────────────────────────────────

function Step1({
  jsonText,
  setJsonText,
  onParse,
  parseError,
}: {
  jsonText: string;
  setJsonText: (v: string) => void;
  onParse: () => void;
  parseError: string | null;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t.inputLabel}</Label>
        <Textarea
          rows={14}
          className="font-mono text-xs"
          placeholder={t.inputPlaceholder}
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
        />
        {parseError && <p className="text-xs text-destructive">{parseError}</p>}
      </div>
    </div>
  );
}

// ─── Step 2 ───────────────────────────────────────────────────────────────────

function Step2({
  parsed,
  serverId,
  setServerId,
  baseUrl,
  setBaseUrl,
  category,
  setCategory,
  author,
  setAuthor,
  selectedTools,
  toggleTool,
}: {
  parsed: ParseResult;
  serverId: string;
  setServerId: (v: string) => void;
  baseUrl: string;
  setBaseUrl: (v: string) => void;
  category: MCPServerCategory;
  setCategory: (v: MCPServerCategory) => void;
  author: string;
  setAuthor: (v: string) => void;
  selectedTools: Set<string>;
  toggleTool: (name: string) => void;
}) {
  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
      {/* Server meta */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>{t.serverIdLabel}</Label>
          <Input
            value={serverId}
            onChange={(e) => setServerId(e.target.value)}
            placeholder={t.serverIdPlaceholder}
          />
        </div>
        <div className="space-y-1">
          <Label>{t.categoryLabel}</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as MCPServerCategory)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 col-span-2">
          <Label>{t.baseUrlLabel}</Label>
          <Input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder={t.baseUrlPlaceholder}
          />
        </div>
        <div className="space-y-1 col-span-2">
          <Label>{t.authorLabel}</Label>
          <Input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder={t.authorPlaceholder}
          />
        </div>
      </div>

      {/* Tool list */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{t.toolsTitle}</p>
          <p className="text-xs text-muted-foreground">{t.toolsHint}</p>
        </div>
        {parsed.tools.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.toolsEmpty}</p>
        ) : (
          <div className="space-y-1.5 border rounded-lg p-3 bg-muted/30">
            {parsed.tools.map((tool) => (
              <label
                key={tool.name}
                className="flex items-start gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedTools.has(tool.name)}
                  onChange={() => toggleTool(tool.name)}
                  className="mt-0.5 h-3.5 w-3.5 accent-primary shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <code className="text-xs font-mono text-foreground">{tool.name}</code>
                  <p className="text-xs text-muted-foreground truncate">{tool.description}</p>
                </div>
                <Badge variant="outline" className="text-[10px] px-1 shrink-0">
                  {tool.method.toUpperCase()}
                </Badge>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step 3 ───────────────────────────────────────────────────────────────────

function Step3({
  result,
  error,
}: {
  result: { listing: { status: string }; reviewResult: { score: number } } | null;
  error: string | null;
}) {
  if (error) {
    return (
      <div className="space-y-2 py-4 text-center">
        <p className="font-medium text-destructive">{t.failTitle}</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }
  if (!result) return null;

  const { listing, reviewResult } = result;
  const isActive = listing.status === 'active';

  return (
    <div className="space-y-4 py-4 text-center">
      <p className="font-medium text-lg">{t.successTitle}</p>
      <div className="flex items-center justify-center gap-2">
        <span className="text-sm text-muted-foreground">{t.score}:</span>
        <Badge variant={isActive ? 'default' : 'secondary'} className="text-base px-3 py-1">
          {reviewResult.score} / 100
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        {isActive ? t.successActive : t.successPending}
      </p>
    </div>
  );
}

// ─── Main Dialog ──────────────────────────────────────────────────────────────

export function SwaggerImportDialog({
  open,
  onOpenChange,
  onPublished,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPublished?: () => void;
}) {
  const [step, setStep] = useState(1);
  const [jsonText, setJsonText] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParseResult | null>(null);

  // Step 2 form state
  const [serverId, setServerId] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [category, setCategory] = useState<MCPServerCategory>('custom');
  const [author, setAuthor] = useState('');
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set());

  // Step 3 result
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<{
    listing: { status: string };
    reviewResult: { score: number };
  } | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStep(1);
    setJsonText('');
    setParseError(null);
    setParsed(null);
    setServerId('');
    setBaseUrl('');
    setCategory('custom');
    setAuthor('');
    setSelectedTools(new Set());
    setPublishing(false);
    setPublishResult(null);
    setPublishError(null);
  }, []);

  const handleOpenChange = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleParse = () => {
    setParseError(null);
    try {
      const spec = JSON.parse(jsonText.trim());
      const result = parseOpenAPI(spec);
      setParsed(result);
      setServerId(result.serverId);
      setBaseUrl(result.baseUrl);
      setSelectedTools(new Set(result.tools.map((t) => t.name)));
      setStep(2);
    } catch {
      setParseError(t.parseError);
    }
  };

  const handlePublish = async () => {
    if (!parsed || !serverId.trim() || !author.trim()) return;
    setPublishing(true);
    setPublishError(null);

    const idPrefix = toSnakeCase(serverId);
    const toolNames = parsed.tools
      .filter((tool) => selectedTools.has(tool.name))
      .map((tool) => {
        // Re-generate name with current serverId
        if (tool.name.startsWith(toSnakeCase(parsed.serverId) + '_')) {
          return `${idPrefix}_${tool.name.slice(toSnakeCase(parsed.serverId).length + 1)}`;
        }
        return tool.name;
      });

    const config = {
      id: serverId.trim(),
      name: parsed.serverName,
      description: parsed.description,
      transport: 'sse' as const,
      url: baseUrl.trim(),
      enabled: true,
      autoStart: true,
      healthCheck: { interval: 30000, timeout: 5000, retries: 3 },
      rateLimit: { maxRequests: 100, windowMs: 60000 },
      permissions: { tools: toolNames, resources: [], requireApproval: [] },
      tags: [],
      category,
    };

    try {
      const res = await apiFetch<{
        listing: { status: string };
        reviewResult: { score: number };
      }>('/mcp-marketplace/publish', {
        method: 'POST',
        body: JSON.stringify({
          config,
          author: { id: author.trim().toLowerCase().replace(/\s+/g, '-'), name: author.trim() },
          tags: [],
        }),
      });
      setPublishResult(res);
      setStep(3);
      onPublished?.();
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : zh.common.error);
      setStep(3);
    } finally {
      setPublishing(false);
    }
  };

  const canProceed =
    step === 1 ? jsonText.trim().length > 0 :
    step === 2 ? serverId.trim().length > 0 && author.trim().length > 0 && selectedTools.size > 0 :
    true;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          {[t.step1Title, t.step2Title, t.step3Title].map((label, i) => (
            <span key={i} className={`flex items-center gap-1 ${step === i + 1 ? 'text-foreground font-medium' : ''}`}>
              <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === i + 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                {i + 1}
              </span>
              {label}
              {i < 2 && <span className="mx-1">→</span>}
            </span>
          ))}
        </div>

        {step === 1 && (
          <Step1
            jsonText={jsonText}
            setJsonText={setJsonText}
            onParse={handleParse}
            parseError={parseError}
          />
        )}
        {step === 2 && parsed && (
          <Step2
            parsed={parsed}
            serverId={serverId}
            setServerId={setServerId}
            baseUrl={baseUrl}
            setBaseUrl={setBaseUrl}
            category={category}
            setCategory={setCategory}
            author={author}
            setAuthor={setAuthor}
            selectedTools={selectedTools}
            toggleTool={(name) => setSelectedTools((prev) => {
              const next = new Set(prev);
              next.has(name) ? next.delete(name) : next.add(name);
              return next;
            })}
          />
        )}
        {step === 3 && (
          <Step3 result={publishResult} error={publishError} />
        )}

        {/* Footer */}
        <div className="flex justify-between pt-2">
          <Button
            variant="outline"
            onClick={() => { if (step > 1 && step < 3) setStep(step - 1); else handleOpenChange(false); }}
          >
            {step === 3 ? t.done : step === 2 ? t.prev : zh.common.cancel}
          </Button>

          {step === 1 && (
            <Button onClick={handleParse} disabled={!canProceed}>
              {t.next}
            </Button>
          )}
          {step === 2 && (
            <Button onClick={handlePublish} disabled={publishing || !canProceed}>
              {publishing ? t.publishing : t.publishBtn}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

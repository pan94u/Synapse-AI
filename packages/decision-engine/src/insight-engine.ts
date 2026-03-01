import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Insight, MetricSnapshot } from '@synapse/shared';
import type { AgentExecutor } from './collector.js';
import type { MetricStore } from './metric-store.js';

interface IndexEntry {
  id: string;
  type: Insight['type'];
  severity: Insight['severity'];
  personaId: string;
  createdAt: string;
}

export class InsightEngine {
  private executor: AgentExecutor;
  private metricStore: MetricStore;
  private dataDir: string;
  private indexPath: string;
  private index: IndexEntry[] = [];

  constructor(executor: AgentExecutor, metricStore: MetricStore, dataDir: string) {
    this.executor = executor;
    this.metricStore = metricStore;
    this.dataDir = dataDir;
    this.indexPath = join(dataDir, '_index.json');
    this.ensureDir();
    this.loadIndex();
  }

  private ensureDir(): void {
    if (!existsSync(this.dataDir)) {
      mkdirSync(this.dataDir, { recursive: true });
    }
  }

  private loadIndex(): void {
    if (existsSync(this.indexPath)) {
      try {
        this.index = JSON.parse(readFileSync(this.indexPath, 'utf-8'));
      } catch {
        this.index = [];
      }
    }
  }

  private saveIndex(): void {
    writeFileSync(this.indexPath, JSON.stringify(this.index, null, 2));
  }

  private entryPath(id: string): string {
    return join(this.dataDir, `${id}.json`);
  }

  async analyze(personaId: string, metricIds?: string[]): Promise<Insight[]> {
    // Collect recent metric snapshots
    const targetMetrics = metricIds ?? this.metricStore.getMetricIds();
    const snapshots: Record<string, MetricSnapshot[]> = {};

    for (const metricId of targetMetrics) {
      const history = this.metricStore.getHistory(metricId, { limit: 10 });
      if (history.length > 0) {
        snapshots[metricId] = history;
      }
    }

    if (Object.keys(snapshots).length === 0) {
      return [];
    }

    // Build analysis prompt
    const metricsData = Object.entries(snapshots).map(([metricId, history]) => ({
      metricId,
      latest: history[0],
      history: history.map((s) => ({ value: s.value, period: s.period, collectedAt: s.collectedAt })),
    }));

    const prompt = `你是一个数据分析专家。请分析以下业务指标数据，发现洞察。

## 指标数据
${JSON.stringify(metricsData, null, 2)}

## 分析要求
请从以下 6 个维度分析数据，只输出有价值的洞察：
1. **趋势 (trend)**: 指标的变化趋势
2. **异常 (anomaly)**: 异常值或偏离
3. **归因 (attribution)**: 变化原因分析
4. **预测 (prediction)**: 未来走势预测
5. **关联 (correlation)**: 指标间的关联关系
6. **基准 (benchmark)**: 与行业或历史基准的对比

## 输出格式
请以 JSON 数组格式返回洞察，每个洞察包含：
\`\`\`json
[
  {
    "type": "anomaly",
    "severity": "warning",
    "title": "洞察标题",
    "summary": "详细描述",
    "evidence": {
      "metrics": ["revenue"],
      "dataPoints": [{"metric": "revenue", "value": 100, "note": "说明"}]
    },
    "suggestedActions": ["建议行动1", "建议行动2"],
    "strategyImpact": {
      "objectiveId": "obj-revenue",
      "impact": "negative",
      "description": "影响描述"
    }
  }
]
\`\`\`

只返回 JSON 数组，不要其他内容。如果没有值得报告的洞察，返回空数组 []。`;

    try {
      const result = await this.executor(personaId, prompt);
      const parsed = extractJSONArray(result.content);

      if (!parsed || !Array.isArray(parsed)) {
        console.warn('[InsightEngine] Failed to parse insights from agent response');
        return [];
      }

      const insights: Insight[] = [];
      for (const item of parsed) {
        const raw = item as Record<string, unknown>;
        const insight = this.store({
          type: (raw.type as Insight['type']) ?? 'trend',
          severity: (raw.severity as Insight['severity']) ?? 'info',
          title: (raw.title as string) ?? 'Untitled Insight',
          summary: (raw.summary as string) ?? '',
          evidence: (raw.evidence as Insight['evidence']) ?? { metrics: [], dataPoints: [] },
          suggestedActions: (raw.suggestedActions as string[]) ?? [],
          strategyImpact: raw.strategyImpact as Insight['strategyImpact'],
          personaId,
        });
        insights.push(insight);
      }

      console.log(`[InsightEngine] Generated ${insights.length} insights for ${personaId}`);
      return insights;
    } catch (err) {
      console.error('[InsightEngine] Analysis failed:', err);
      return [];
    }
  }

  private store(insight: Omit<Insight, 'id' | 'createdAt'>): Insight {
    const id = crypto.randomUUID();
    const full: Insight = {
      id,
      ...insight,
      createdAt: new Date().toISOString(),
    };

    writeFileSync(this.entryPath(id), JSON.stringify(full, null, 2));
    this.index.push({
      id,
      type: full.type,
      severity: full.severity,
      personaId: full.personaId,
      createdAt: full.createdAt,
    });
    this.saveIndex();

    return full;
  }

  get(id: string): Insight | undefined {
    return this.getById(id);
  }

  query(filter: {
    type?: Insight['type'];
    severity?: Insight['severity'];
    personaId?: string;
    limit?: number;
  }): Insight[] {
    let entries = this.index.slice();

    if (filter.type) {
      entries = entries.filter((e) => e.type === filter.type);
    }
    if (filter.severity) {
      entries = entries.filter((e) => e.severity === filter.severity);
    }
    if (filter.personaId) {
      entries = entries.filter((e) => e.personaId === filter.personaId);
    }

    entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    if (filter.limit) {
      entries = entries.slice(0, filter.limit);
    }

    return entries
      .map((e) => this.getById(e.id))
      .filter((e): e is Insight => e !== undefined);
  }

  getRecent(limit = 20): Insight[] {
    const sorted = this.index.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return sorted
      .slice(0, limit)
      .map((e) => this.getById(e.id))
      .filter((e): e is Insight => e !== undefined);
  }

  getCount(): number {
    return this.index.length;
  }

  private getById(id: string): Insight | undefined {
    const path = this.entryPath(id);
    if (!existsSync(path)) return undefined;
    try {
      return JSON.parse(readFileSync(path, 'utf-8'));
    } catch {
      return undefined;
    }
  }
}

/** Extract JSON array from text */
function extractJSONArray(text: string): unknown[] | null {
  // Try markdown code block first
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1].trim());
      if (Array.isArray(parsed)) return parsed;
    } catch { /* fallthrough */ }
  }

  // Try raw JSON array
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      const parsed = JSON.parse(arrayMatch[0]);
      if (Array.isArray(parsed)) return parsed;
    } catch { /* fallthrough */ }
  }

  return null;
}

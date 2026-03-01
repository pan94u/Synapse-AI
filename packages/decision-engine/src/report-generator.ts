import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DecisionReport } from '@synapse/shared';
import type { AgentExecutor } from './collector.js';
import type { MetricStore } from './metric-store.js';
import type { InsightEngine } from './insight-engine.js';

interface IndexEntry {
  id: string;
  type: DecisionReport['type'];
  personaId: string;
  createdAt: string;
}

export class ReportGenerator {
  private executor: AgentExecutor;
  private metricStore: MetricStore;
  private insightEngine: InsightEngine;
  private dataDir: string;
  private indexPath: string;
  private index: IndexEntry[] = [];

  constructor(
    executor: AgentExecutor,
    metricStore: MetricStore,
    insightEngine: InsightEngine,
    dataDir: string,
  ) {
    this.executor = executor;
    this.metricStore = metricStore;
    this.insightEngine = insightEngine;
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

  async generate(opts: {
    type: DecisionReport['type'];
    personaId: string;
    title?: string;
    metricIds?: string[];
    period?: string;
  }): Promise<DecisionReport> {
    // Collect metrics data
    const targetMetrics = opts.metricIds ?? this.metricStore.getMetricIds();
    const metricsData: Record<string, unknown>[] = [];
    const collectedMetricIds: string[] = [];

    for (const metricId of targetMetrics) {
      const history = this.metricStore.getHistory(metricId, { limit: 10 });
      if (history.length > 0) {
        metricsData.push({
          metricId,
          latest: history[0],
          history: history.slice(0, 5).map((s) => ({
            value: s.value,
            period: s.period,
          })),
        });
        collectedMetricIds.push(metricId);
      }
    }

    // Collect recent insights
    const insights = this.insightEngine.getRecent(10);
    const insightIds = insights.map((i) => i.id);

    const today = new Date().toISOString().split('T')[0];
    const reportTitle = opts.title ?? `${opts.type === 'daily' ? '日报' : opts.type === 'weekly' ? '周报' : opts.type === 'monthly' ? '月报' : '专题报告'} - ${opts.period ?? today}`;

    const prompt = `你是一个高级商业分析师。请根据以下数据生成一份${reportTitle}。

## 指标数据
${JSON.stringify(metricsData, null, 2)}

## 近期洞察
${JSON.stringify(insights.map((i) => ({ type: i.type, severity: i.severity, title: i.title, summary: i.summary })), null, 2)}

## 报告要求
1. **摘要**: 简要概括当前业务状况
2. **关键指标**: 列出各核心指标的当前值、趋势和健康度
3. **洞察与风险**: 汇总主要发现和风险预警
4. **建议**: 给出具体可行的下一步行动建议
5. **展望**: 简要预测未来趋势

请以 Markdown 格式输出完整报告。`;

    const result = await this.executor(opts.personaId, prompt);

    const id = crypto.randomUUID();
    const report: DecisionReport = {
      id,
      type: opts.type,
      title: reportTitle,
      content: result.content,
      personaId: opts.personaId,
      metricIds: collectedMetricIds,
      insightIds,
      createdAt: new Date().toISOString(),
    };

    writeFileSync(this.entryPath(id), JSON.stringify(report, null, 2));
    this.index.push({
      id,
      type: report.type,
      personaId: report.personaId,
      createdAt: report.createdAt,
    });
    this.saveIndex();

    console.log(`[ReportGenerator] Generated ${opts.type} report: ${reportTitle}`);
    return report;
  }

  get(id: string): DecisionReport | undefined {
    return this.getById(id);
  }

  query(filter: {
    type?: DecisionReport['type'];
    personaId?: string;
    limit?: number;
  }): DecisionReport[] {
    let entries = this.index.slice();

    if (filter.type) {
      entries = entries.filter((e) => e.type === filter.type);
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
      .filter((e): e is DecisionReport => e !== undefined);
  }

  getCount(): number {
    return this.index.length;
  }

  private getById(id: string): DecisionReport | undefined {
    const path = this.entryPath(id);
    if (!existsSync(path)) return undefined;
    try {
      return JSON.parse(readFileSync(path, 'utf-8'));
    } catch {
      return undefined;
    }
  }
}

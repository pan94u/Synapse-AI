import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import type { MetricDefinition, MetricSnapshot } from '@synapse/shared';
import type { MetricStore } from './metric-store.js';

export type AgentExecutor = (
  personaId: string,
  userMessage: string,
) => Promise<{ content: string; model: string; toolCallsExecuted: number }>;

/** Frequency → cron expression mapping */
const FREQUENCY_CRON: Record<MetricDefinition['frequency'], string> = {
  daily: '0 6 * * *',     // 6:00 AM daily
  weekly: '0 7 * * 1',    // 7:00 AM Monday
  monthly: '0 8 1 * *',   // 8:00 AM 1st of month
};

interface CronJob {
  id: string;
  cronExpression: string;
  lastRun: string | null;
}

export class DataCollector {
  private executor: AgentExecutor;
  private metricStore: MetricStore;
  private definitions = new Map<string, MetricDefinition>();
  private jobs = new Map<string, CronJob>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;

  constructor(executor: AgentExecutor, metricStore: MetricStore) {
    this.executor = executor;
    this.metricStore = metricStore;
  }

  loadDefinitions(configDir: string): void {
    const metricsFile = join(configDir, 'metrics.yaml');
    if (!existsSync(metricsFile)) {
      // Try loading from directory of yaml files
      if (!existsSync(configDir)) return;
      const files = readdirSync(configDir).filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));
      for (const file of files) {
        this.loadMetricsFile(join(configDir, file));
      }
      return;
    }
    this.loadMetricsFile(metricsFile);
  }

  private loadMetricsFile(filePath: string): void {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const data = parseYaml(content) as { metrics?: Array<Record<string, unknown>> };
      if (!data?.metrics) return;

      for (const raw of data.metrics) {
        const def: MetricDefinition = {
          id: raw.id as string,
          name: raw.name as string,
          description: raw.description as string,
          query: raw.query as string,
          frequency: raw.frequency as MetricDefinition['frequency'],
          unit: raw.unit as string | undefined,
          alertRules: (raw.alert_rules as Array<Record<string, unknown>> | undefined)?.map((r) => ({
            condition: r.condition as string,
            severity: r.severity as 'info' | 'warning' | 'critical',
            message: r.message as string,
          })),
        };
        this.definitions.set(def.id, def);

        // Create cron job for this metric
        const cronExpr = FREQUENCY_CRON[def.frequency];
        this.jobs.set(def.id, {
          id: def.id,
          cronExpression: cronExpr,
          lastRun: null,
        });
      }

      console.log(`[DataCollector] Loaded ${this.definitions.size} metric definitions`);
    } catch (err) {
      console.error(`[DataCollector] Failed to load metrics from ${filePath}:`, err);
    }
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.timer = setInterval(() => this.tick(), 60_000);
    this.tick();
  }

  stop(): void {
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  isRunning(): boolean {
    return this.running;
  }

  async collectMetric(metricId: string): Promise<MetricSnapshot | undefined> {
    const def = this.definitions.get(metricId);
    if (!def) {
      console.warn(`[DataCollector] Metric "${metricId}" not found`);
      return undefined;
    }

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    let period = today;
    if (def.frequency === 'weekly') {
      // ISO week format
      const weekNum = getISOWeek(now);
      period = `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
    } else if (def.frequency === 'monthly') {
      period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    const prompt = `${def.query}\n\n请以 JSON 格式返回结果，包含 "value" 字段（数值类型）。如有其他相关数据，放入 "metadata" 对象。\n示例: {"value": 12345.67, "metadata": {"region": "全国", "compared_to_yesterday": "+5.2%"}}`;

    try {
      const result = await this.executor('ceo', prompt);
      const parsed = extractJSON(result.content);

      if (parsed && typeof parsed.value === 'number') {
        const snapshot = this.metricStore.record({
          metricId: def.id,
          value: parsed.value,
          period,
          periodType: def.frequency,
          metadata: parsed.metadata as Record<string, unknown> | undefined,
        });
        console.log(`[DataCollector] Collected ${def.id}: ${parsed.value} ${def.unit ?? ''}`);
        return snapshot;
      }

      console.warn(`[DataCollector] Failed to parse value for ${def.id} from agent response`);
      return undefined;
    } catch (err) {
      console.error(`[DataCollector] Error collecting ${def.id}:`, err);
      return undefined;
    }
  }

  listMetrics(): MetricDefinition[] {
    return Array.from(this.definitions.values());
  }

  getDefinition(metricId: string): MetricDefinition | undefined {
    return this.definitions.get(metricId);
  }

  private tick(): void {
    const now = new Date();
    const minuteKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    for (const job of this.jobs.values()) {
      if (job.lastRun === minuteKey) continue;
      if (matchesCron(job.cronExpression, now)) {
        job.lastRun = minuteKey;
        this.collectMetric(job.id).catch((err) => {
          console.error(`[DataCollector] Scheduled collection "${job.id}" failed:`, err);
        });
      }
    }
  }
}

/** Extract first JSON object from text */
function extractJSON(text: string): Record<string, unknown> | null {
  // Try to find JSON in markdown code block first
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch { /* fallthrough */ }
  }

  // Try to find raw JSON object
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch { /* fallthrough */ }
  }

  return null;
}

/** Simple cron matching (5-field: min hour dom month dow) */
function matchesCron(expression: string, date: Date): boolean {
  const parts = expression.split(/\s+/);
  if (parts.length !== 5) return false;

  const checks = [
    { value: date.getMinutes(), field: parts[0] },
    { value: date.getHours(), field: parts[1] },
    { value: date.getDate(), field: parts[2] },
    { value: date.getMonth() + 1, field: parts[3] },
    { value: date.getDay(), field: parts[4] },
  ];

  return checks.every(({ value, field }) => matchField(field, value));
}

function matchField(field: string, value: number): boolean {
  if (field === '*') return true;

  // Step: */n
  if (field.startsWith('*/')) {
    const step = parseInt(field.slice(2), 10);
    return value % step === 0;
  }

  // Range: n-m
  if (field.includes('-')) {
    const [min, max] = field.split('-').map(Number);
    return value >= min && value <= max;
  }

  // List: n,m,...
  if (field.includes(',')) {
    return field.split(',').map(Number).includes(value);
  }

  // Exact
  return parseInt(field, 10) === value;
}

/** Get ISO week number */
function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

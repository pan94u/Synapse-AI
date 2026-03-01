import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import type { ThresholdMonitorConfig, ThresholdRule } from '@synapse/shared';

export type AgentExecutor = (
  personaId: string,
  userMessage: string,
) => Promise<{ content: string; model: string; toolCallsExecuted: number }>;

export interface MonitorCheckResult {
  monitorId: string;
  checkedAt: string;
  rawResponse: string;
  triggeredRules: Array<{
    condition: string;
    severity: ThresholdRule['severity'];
    message: string;
    notify: string[];
  }>;
}

function parseInterval(interval: string): number {
  const match = interval.match(/^(\d+)(ms|s|m|h)$/);
  if (!match) return 3600_000; // default 1h

  const value = parseInt(match[1], 10);
  switch (match[2]) {
    case 'ms': return value;
    case 's': return value * 1000;
    case 'm': return value * 60_000;
    case 'h': return value * 3600_000;
    default: return 3600_000;
  }
}

/**
 * Evaluate a simple condition like "usage_rate >= 0.9" against a data object.
 * Supports: >=, <=, >, <, ==, !=
 */
function evaluateCondition(condition: string, data: Record<string, unknown>): boolean {
  const match = condition.match(/^(\w+)\s*(>=|<=|>|<|==|!=)\s*(.+)$/);
  if (!match) return false;

  const [, field, op, rawValue] = match;
  const actual = data[field];
  if (actual === undefined || actual === null) return false;

  const numActual = Number(actual);
  const numExpected = Number(rawValue);
  if (isNaN(numActual) || isNaN(numExpected)) return false;

  switch (op) {
    case '>=': return numActual >= numExpected;
    case '<=': return numActual <= numExpected;
    case '>':  return numActual > numExpected;
    case '<':  return numActual < numExpected;
    case '==': return numActual === numExpected;
    case '!=': return numActual !== numExpected;
    default: return false;
  }
}

interface MonitorEntry {
  config: ThresholdMonitorConfig;
  timer: ReturnType<typeof setInterval> | null;
  lastCheck: string | null;
}

export class ThresholdMonitor {
  private monitors = new Map<string, MonitorEntry>();
  private executor: AgentExecutor;
  private callback: (monitorId: string, result: MonitorCheckResult) => Promise<void>;
  private running = false;

  constructor(
    executor: AgentExecutor,
    callback: (monitorId: string, result: MonitorCheckResult) => Promise<void>,
  ) {
    this.executor = executor;
    this.callback = callback;
  }

  register(config: ThresholdMonitorConfig): void {
    this.monitors.set(config.id, { config, timer: null, lastCheck: null });
  }

  unregister(monitorId: string): void {
    const entry = this.monitors.get(monitorId);
    if (entry?.timer) clearInterval(entry.timer);
    this.monitors.delete(monitorId);
  }

  loadFromDir(configDir: string): void {
    if (!existsSync(configDir)) return;

    const files = readdirSync(configDir).filter(
      (f) => f.endsWith('.yaml') || f.endsWith('.yml'),
    );

    for (const file of files) {
      try {
        const content = readFileSync(join(configDir, file), 'utf-8');
        const raw = parseYaml(content) as {
          id: string;
          name: string;
          check_interval: string;
          persona_id: string;
          query: { prompt: string };
          thresholds: Array<{
            condition: string;
            severity: ThresholdRule['severity'];
            notify: string[];
            message: string;
          }>;
        };

        const config: ThresholdMonitorConfig = {
          id: raw.id,
          name: raw.name,
          checkInterval: raw.check_interval,
          personaId: raw.persona_id,
          query: raw.query,
          thresholds: raw.thresholds,
        };

        this.register(config);
      } catch (err) {
        console.warn(`[ThresholdMonitor] Failed to load ${file}:`, err);
      }
    }
  }

  start(): void {
    if (this.running) return;
    this.running = true;

    for (const [id, entry] of this.monitors) {
      const intervalMs = parseInterval(entry.config.checkInterval);
      entry.timer = setInterval(() => {
        this.check(id).catch((err) => {
          console.error(`[ThresholdMonitor] Check "${id}" failed:`, err);
        });
      }, intervalMs);
    }
  }

  stop(): void {
    this.running = false;
    for (const entry of this.monitors.values()) {
      if (entry.timer) {
        clearInterval(entry.timer);
        entry.timer = null;
      }
    }
  }

  async check(monitorId: string): Promise<MonitorCheckResult> {
    const entry = this.monitors.get(monitorId);
    if (!entry) throw new Error(`Monitor "${monitorId}" not found`);

    const { config } = entry;
    const checkedAt = new Date().toISOString();
    entry.lastCheck = checkedAt;

    // Ask the Agent to query data and return JSON
    const queryPrompt = `${config.query.prompt}\n\n请以 JSON 对象格式返回查询结果，只返回 JSON，不要附加其他文本。`;
    const agentResult = await this.executor(config.personaId, queryPrompt);

    // Try to parse JSON from the response
    let data: Record<string, unknown> = {};
    try {
      const jsonMatch = agentResult.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        data = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Could not parse JSON; no rules will trigger
    }

    // Evaluate thresholds
    const triggeredRules: MonitorCheckResult['triggeredRules'] = [];
    for (const rule of config.thresholds) {
      if (evaluateCondition(rule.condition, data)) {
        // Replace variables in message
        let message = rule.message;
        for (const [key, value] of Object.entries(data)) {
          message = message.replaceAll(`{${key}}`, String(value));
        }
        triggeredRules.push({
          condition: rule.condition,
          severity: rule.severity,
          message,
          notify: rule.notify,
        });
      }
    }

    const result: MonitorCheckResult = {
      monitorId,
      checkedAt,
      rawResponse: agentResult.content,
      triggeredRules,
    };

    if (triggeredRules.length > 0) {
      await this.callback(monitorId, result);
    }

    return result;
  }

  listMonitors(): string[] {
    return Array.from(this.monitors.keys());
  }

  isRunning(): boolean {
    return this.running;
  }
}

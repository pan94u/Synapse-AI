import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import type { StrategyObjective } from '@synapse/shared';
import type { MetricStore } from './metric-store.js';

interface StrategyState {
  objectives: StrategyObjective[];
  lastUpdated: string;
}

export class StrategyTracker {
  private metricStore: MetricStore;
  private dataDir: string;
  private statePath: string;
  private objectives: StrategyObjective[] = [];

  constructor(metricStore: MetricStore, dataDir: string) {
    this.metricStore = metricStore;
    this.dataDir = dataDir;
    this.statePath = join(dataDir, 'state.json');
    this.ensureDir();
    this.loadState();
  }

  private ensureDir(): void {
    if (!existsSync(this.dataDir)) {
      mkdirSync(this.dataDir, { recursive: true });
    }
  }

  private loadState(): void {
    if (existsSync(this.statePath)) {
      try {
        const state: StrategyState = JSON.parse(readFileSync(this.statePath, 'utf-8'));
        this.objectives = state.objectives;
      } catch {
        this.objectives = [];
      }
    }
  }

  loadFromConfig(configDir: string): void {
    const strategyFile = join(configDir, 'strategy.yaml');
    if (!existsSync(strategyFile)) {
      console.warn('[StrategyTracker] strategy.yaml not found');
      return;
    }

    try {
      const content = readFileSync(strategyFile, 'utf-8');
      const data = parseYaml(content) as {
        objectives?: Array<Record<string, unknown>>;
      };

      if (!data?.objectives) return;

      // Load objectives from YAML, preserving any existing state
      const existingMap = new Map(this.objectives.map((o) => [o.id, o]));

      this.objectives = data.objectives.map((raw) => {
        const id = raw.id as string;
        const existing = existingMap.get(id);

        const keyResults = (raw.key_results as Array<Record<string, unknown>> ?? []).map((kr) => {
          const krId = kr.id as string;
          const existingKR = existing?.keyResults.find((k) => k.id === krId);
          return {
            id: krId,
            name: kr.name as string,
            metricId: kr.metric_id as string,
            targetValue: kr.target_value as number,
            currentValue: existingKR?.currentValue ?? 0,
            status: existingKR?.status ?? ('off_track' as const),
          };
        });

        return {
          id,
          name: raw.name as string,
          target: raw.target as string,
          keyResults,
        };
      });

      this.saveState();
      console.log(`[StrategyTracker] Loaded ${this.objectives.length} objectives`);
    } catch (err) {
      console.error('[StrategyTracker] Failed to load strategy config:', err);
    }
  }

  updateProgress(): void {
    for (const objective of this.objectives) {
      for (const kr of objective.keyResults) {
        const latest = this.metricStore.getLatest(kr.metricId);
        if (latest) {
          kr.currentValue = latest.value;
          const progress = kr.targetValue > 0 ? kr.currentValue / kr.targetValue : 0;
          if (progress >= 0.8) {
            kr.status = 'on_track';
          } else if (progress >= 0.5) {
            kr.status = 'at_risk';
          } else {
            kr.status = 'off_track';
          }
        }
      }
    }
    this.saveState();
  }

  getObjectives(): StrategyObjective[] {
    return this.objectives;
  }

  getObjective(id: string): StrategyObjective | undefined {
    return this.objectives.find((o) => o.id === id);
  }

  getOverallStatus(): { onTrack: number; atRisk: number; offTrack: number } {
    const allKRs = this.objectives.flatMap((o) => o.keyResults);
    return {
      onTrack: allKRs.filter((kr) => kr.status === 'on_track').length,
      atRisk: allKRs.filter((kr) => kr.status === 'at_risk').length,
      offTrack: allKRs.filter((kr) => kr.status === 'off_track').length,
    };
  }

  saveState(): void {
    const state: StrategyState = {
      objectives: this.objectives,
      lastUpdated: new Date().toISOString(),
    };
    writeFileSync(this.statePath, JSON.stringify(state, null, 2));
  }
}

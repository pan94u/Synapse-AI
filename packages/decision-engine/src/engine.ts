import { join } from 'node:path';
import { MetricStore } from './metric-store.js';
import { DataCollector, type AgentExecutor } from './collector.js';
import { InsightEngine } from './insight-engine.js';
import { StrategyTracker } from './strategy-tracker.js';
import { DecisionJournal } from './decision-journal.js';
import { ReportGenerator } from './report-generator.js';

export interface DecisionEngineConfig {
  agentExecutor: AgentExecutor;
  metricsConfigDir: string;       // config/decision/
  strategyConfigDir: string;      // config/decision/
  dataDir: string;                // data/decision/
  /** Optional: associate proactive notification */
  notifyCallback?: (personaId: string, title: string, content: string, severity: string) => void;
}

export class DecisionEngine {
  private config: DecisionEngineConfig;
  private metricStore: MetricStore;
  private collector: DataCollector;
  private insightEngine: InsightEngine;
  private strategyTracker: StrategyTracker;
  private decisionJournal: DecisionJournal;
  private reportGenerator: ReportGenerator;
  private running = false;

  constructor(config: DecisionEngineConfig) {
    this.config = config;

    // Initialize sub-components
    this.metricStore = new MetricStore(join(config.dataDir, 'metrics'));
    this.collector = new DataCollector(config.agentExecutor, this.metricStore);
    this.insightEngine = new InsightEngine(
      config.agentExecutor,
      this.metricStore,
      join(config.dataDir, 'insights'),
    );
    this.strategyTracker = new StrategyTracker(
      this.metricStore,
      join(config.dataDir, 'strategy'),
    );
    this.decisionJournal = new DecisionJournal(join(config.dataDir, 'journal'));
    this.reportGenerator = new ReportGenerator(
      config.agentExecutor,
      this.metricStore,
      this.insightEngine,
      join(config.dataDir, 'reports'),
    );
  }

  initialize(): void {
    // Load metric definitions from YAML
    this.collector.loadDefinitions(this.config.metricsConfigDir);

    // Load strategy objectives from YAML
    this.strategyTracker.loadFromConfig(this.config.strategyConfigDir);

    // Update strategy progress with current metric values
    this.strategyTracker.updateProgress();

    console.log('[DecisionEngine] Initialized');
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.collector.start();
    console.log('[DecisionEngine] Started');
  }

  stop(): void {
    this.running = false;
    this.collector.stop();
    console.log('[DecisionEngine] Stopped');
  }

  // Expose sub-components
  getMetricStore(): MetricStore {
    return this.metricStore;
  }

  getCollector(): DataCollector {
    return this.collector;
  }

  getInsightEngine(): InsightEngine {
    return this.insightEngine;
  }

  getStrategyTracker(): StrategyTracker {
    return this.strategyTracker;
  }

  getDecisionJournal(): DecisionJournal {
    return this.decisionJournal;
  }

  getReportGenerator(): ReportGenerator {
    return this.reportGenerator;
  }

  getStatus(): {
    running: boolean;
    metricsCount: number;
    metricDefinitions: number;
    insightsCount: number;
    decisionsCount: number;
    reportsCount: number;
    strategyObjectives: number;
    strategyStatus: { onTrack: number; atRisk: number; offTrack: number };
  } {
    return {
      running: this.running,
      metricsCount: this.metricStore.getCount(),
      metricDefinitions: this.collector.listMetrics().length,
      insightsCount: this.insightEngine.getCount(),
      decisionsCount: this.decisionJournal.getCount(),
      reportsCount: this.reportGenerator.getCount(),
      strategyObjectives: this.strategyTracker.getObjectives().length,
      strategyStatus: this.strategyTracker.getOverallStatus(),
    };
  }
}

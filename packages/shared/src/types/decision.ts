/** 指标快照 */
export interface MetricSnapshot {
  id: string;
  metricId: string;         // e.g. "revenue", "gross_margin"
  value: number;
  period: string;           // "2026-03-02", "2026-W09", "2026-03"
  periodType: 'daily' | 'weekly' | 'monthly';
  metadata?: Record<string, unknown>;
  collectedAt: string;
}

/** 指标定义 (from YAML) */
export interface MetricDefinition {
  id: string;
  name: string;
  description: string;
  query: string;            // Agent prompt to query data
  frequency: 'daily' | 'weekly' | 'monthly';
  unit?: string;
  alertRules?: Array<{
    condition: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
  }>;
}

/** 洞察 */
export interface Insight {
  id: string;
  type: 'trend' | 'anomaly' | 'attribution' | 'prediction' | 'correlation' | 'benchmark';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  summary: string;
  evidence: {
    metrics: string[];          // metric IDs referenced
    dataPoints: Record<string, unknown>[];
  };
  suggestedActions: string[];
  strategyImpact?: {
    objectiveId: string;
    impact: 'positive' | 'negative' | 'neutral';
    description: string;
  };
  personaId: string;
  createdAt: string;
}

/** 决策记录 */
export interface DecisionRecord {
  id: string;
  deciderId: string;
  deciderRole: string;
  context: {
    question: string;
    background: string;
    insightIds: string[];
    dataSnapshot: Record<string, unknown>;
  };
  options: Array<{
    id: string;
    description: string;
    pros: string[];
    cons: string[];
    estimatedImpact: string;
    riskLevel: 'low' | 'medium' | 'high';
  }>;
  decision: {
    selectedOptionId: string;
    rationale: string;
    expectedOutcome: string;
    reviewDate: string;
  };
  tracking: {
    status: 'pending' | 'executing' | 'reviewing' | 'closed';
    actualOutcome?: string;
    lessonsLearned?: string;
  };
  createdAt: string;
  updatedAt: string;
}

/** 战略目标 (from YAML) */
export interface StrategyObjective {
  id: string;
  name: string;
  target: string;
  keyResults: Array<{
    id: string;
    name: string;
    metricId: string;
    targetValue: number;
    currentValue: number;
    status: 'on_track' | 'at_risk' | 'off_track';
  }>;
}

/** 报告 */
export interface DecisionReport {
  id: string;
  type: 'daily' | 'weekly' | 'monthly' | 'thematic';
  title: string;
  content: string;
  personaId: string;
  metricIds: string[];
  insightIds: string[];
  createdAt: string;
}

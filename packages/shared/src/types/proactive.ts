/** 从 persona YAML 提取的主动任务配置 */
export interface ProactiveTaskConfig {
  id: string;                   // "${personaId}:${action}"
  personaId: string;
  schedule?: string;            // cron 表达式
  trigger?: string;             // 事件名
  action: string;               // action ID
}

/** YAML 加载的 action 定义 */
export interface ActionDefinition {
  id: string;                   // e.g. "weekly_business_summary"
  name: string;
  description: string;
  type: 'schedule' | 'event' | 'threshold';
  schedule?: string;            // cron 表达式 (schedule 类型时)
  enabled: boolean;
  promptTemplate: string;       // {{variable}} 占位符
  variables?: Record<string, string>;
  targetModel?: string;
  maxIterations?: number;
}

/** 阈值监控配置 */
export interface ThresholdMonitorConfig {
  id: string;
  name: string;
  checkInterval: string;        // "1h", "30m", "4h"
  personaId: string;
  query: { prompt: string };
  thresholds: ThresholdRule[];
}

export interface ThresholdRule {
  condition: string;            // "usage_rate >= 0.9"
  severity: 'info' | 'warning' | 'critical';
  notify: string[];             // persona IDs
  message: string;              // "{variable}" 占位符
}

/** 主动任务执行记录 */
export interface ProactiveTaskExecution {
  id: string;
  taskId: string;
  personaId: string;
  action: string;
  triggerType: 'schedule' | 'event' | 'threshold';
  triggerDetail: string;
  startedAt: string;
  completedAt?: string;
  status: 'running' | 'success' | 'error';
  result?: string;
  error?: string;
  model?: string;
  toolCallsExecuted?: number;
}

/** 事件总线事件 */
export interface ProactiveEvent {
  id: string;
  name: string;
  source: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

/** 主动通知 */
export interface ProactiveNotification {
  id: string;
  personaId: string;
  title: string;
  content: string;
  source: string;
  severity: 'info' | 'warning' | 'critical';
  read: boolean;
  createdAt: string;
}

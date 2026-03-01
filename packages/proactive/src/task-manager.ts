import type {
  ProactiveTaskConfig,
  ProactiveTaskExecution,
  ProactiveEvent,
  ProactiveNotification,
} from '@synapse/shared';
import { CronScheduler } from './cron-scheduler.js';
import { EventBus } from './event-bus.js';
import { ActionRegistry } from './action-registry.js';
import { TaskHistory } from './task-history.js';
import { NotificationStore } from './notification-store.js';
import { ThresholdMonitor, type AgentExecutor, type MonitorCheckResult } from './threshold-monitor.js';

export interface ProactiveTaskManagerConfig {
  /** server 层提供：创建 Agent 并执行 prompt，返回结果 */
  agentExecutor: AgentExecutor;
  /** server 层提供：从 PersonaRegistry 提取所有 persona 的 proactiveTasks */
  getProactiveTasks: () => ProactiveTaskConfig[];
  /** action YAML 配置目录 */
  actionConfigDir: string;
  /** threshold monitor YAML 配置目录 */
  monitorConfigDir?: string;
  /** 执行历史数据目录 */
  historyDataDir: string;
  /** 通知数据目录 */
  notificationDataDir: string;
}

export class ProactiveTaskManager {
  private config: ProactiveTaskManagerConfig;
  private scheduler: CronScheduler;
  private eventBus: EventBus;
  private actionRegistry: ActionRegistry;
  private taskHistory: TaskHistory;
  private notificationStore: NotificationStore;
  private thresholdMonitor: ThresholdMonitor;
  private running = false;

  constructor(config: ProactiveTaskManagerConfig) {
    this.config = config;
    this.scheduler = new CronScheduler();
    this.eventBus = new EventBus();
    this.actionRegistry = new ActionRegistry();
    this.taskHistory = new TaskHistory(config.historyDataDir);
    this.notificationStore = new NotificationStore(config.notificationDataDir);
    this.thresholdMonitor = new ThresholdMonitor(
      config.agentExecutor,
      this.handleThresholdTriggered.bind(this),
    );
  }

  /** 加载 actions，扫描 persona tasks，注册 cron jobs + event handlers */
  initialize(): void {
    // Load action definitions from YAML
    this.actionRegistry.loadFromDir(this.config.actionConfigDir);
    console.log(`[ProactiveTaskManager] Loaded ${this.actionRegistry.list().length} actions`);

    // Load threshold monitors
    if (this.config.monitorConfigDir) {
      this.thresholdMonitor.loadFromDir(this.config.monitorConfigDir);
      console.log(`[ProactiveTaskManager] Loaded ${this.thresholdMonitor.listMonitors().length} threshold monitors`);
    }

    // Scan persona proactive tasks and register
    const tasks = this.config.getProactiveTasks();
    for (const task of tasks) {
      if (task.schedule) {
        // Register as cron job
        this.scheduler.register({
          id: task.id,
          cronExpression: task.schedule,
          callback: async () => {
            console.log(`[ProactiveTaskManager] Cron triggered: ${task.id}`);
            await this.executeAction(
              task.action,
              task.personaId,
              'schedule',
              `cron: ${task.schedule}`,
            );
          },
        });
      }

      if (task.trigger) {
        // Register as event handler
        this.eventBus.on(task.trigger, async (event: ProactiveEvent) => {
          console.log(`[ProactiveTaskManager] Event triggered: ${task.id} by ${event.name}`);
          await this.executeAction(
            task.action,
            task.personaId,
            'event',
            `event: ${event.name}`,
            {
              event_name: event.name,
              event_source: event.source,
              event_payload: JSON.stringify(event.payload),
            },
          );
        });
      }
    }

    console.log(
      `[ProactiveTaskManager] Initialized: ${this.scheduler.listJobs().length} cron jobs, ` +
      `${this.eventBus.listEventNames().length} event listeners`,
    );
  }

  /** 启动调度器 + 事件监听 + 阈值监控 */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.scheduler.start();
    this.thresholdMonitor.start();
    console.log('[ProactiveTaskManager] Started');
  }

  /** 停止一切 */
  stop(): void {
    this.running = false;
    this.scheduler.stop();
    this.thresholdMonitor.stop();
    console.log('[ProactiveTaskManager] Stopped');
  }

  /** 执行 action（cron/event/手动 均走此路径） */
  async executeAction(
    actionId: string,
    personaId: string,
    triggerType: 'schedule' | 'event' | 'threshold',
    triggerDetail: string,
    extraVariables?: Record<string, string>,
  ): Promise<ProactiveTaskExecution> {
    const taskId = `${personaId}:${actionId}`;

    // 1. Render prompt
    const renderedPrompt = this.actionRegistry.renderPrompt(actionId, extraVariables);
    if (!renderedPrompt) {
      const execution = this.taskHistory.recordStart({
        taskId,
        personaId,
        action: actionId,
        triggerType,
        triggerDetail,
        startedAt: new Date().toISOString(),
        status: 'error',
        error: `Action "${actionId}" not found in registry`,
      });
      return execution;
    }

    // 2. Record start
    const execution = this.taskHistory.recordStart({
      taskId,
      personaId,
      action: actionId,
      triggerType,
      triggerDetail,
      startedAt: new Date().toISOString(),
      status: 'running',
    });

    try {
      // 3. Execute via Agent
      const agentResult = await this.config.agentExecutor(personaId, renderedPrompt);

      // 4. Record completion
      const completed = this.taskHistory.recordComplete(execution.id, {
        status: 'success',
        result: agentResult.content,
        model: agentResult.model,
        toolCallsExecuted: agentResult.toolCallsExecuted,
      });

      // 5. Create notification
      const action = this.actionRegistry.get(actionId);
      this.notificationStore.create({
        personaId,
        title: action?.name ?? actionId,
        content: agentResult.content.substring(0, 500),
        source: `proactive:${triggerType}:${actionId}`,
        severity: triggerType === 'threshold' ? 'warning' : 'info',
      });

      return completed ?? execution;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[ProactiveTaskManager] Action "${actionId}" failed:`, err);

      const completed = this.taskHistory.recordComplete(execution.id, {
        status: 'error',
        error: errorMessage,
      });

      return completed ?? execution;
    }
  }

  /** 手动发射事件 */
  emitEvent(name: string, source: string, payload: Record<string, unknown>): ProactiveEvent {
    return this.eventBus.emit(name, source, payload);
  }

  /** 暴露子组件给 API 路由用 */
  getEventBus(): EventBus {
    return this.eventBus;
  }

  getNotificationStore(): NotificationStore {
    return this.notificationStore;
  }

  getTaskHistory(): TaskHistory {
    return this.taskHistory;
  }

  getActionRegistry(): ActionRegistry {
    return this.actionRegistry;
  }

  /** 状态概览 */
  getStatus(): {
    running: boolean;
    scheduledJobs: number;
    registeredEvents: number;
    activeMonitors: number;
  } {
    return {
      running: this.running,
      scheduledJobs: this.scheduler.listJobs().length,
      registeredEvents: this.eventBus.listEventNames().length,
      activeMonitors: this.thresholdMonitor.listMonitors().length,
    };
  }

  /** Handle threshold monitor alerts */
  private async handleThresholdTriggered(monitorId: string, result: MonitorCheckResult): Promise<void> {
    for (const rule of result.triggeredRules) {
      // Create notification for each notify target
      for (const targetPersonaId of rule.notify) {
        this.notificationStore.create({
          personaId: targetPersonaId,
          title: `阈值预警: ${monitorId}`,
          content: rule.message,
          source: `proactive:threshold:${monitorId}`,
          severity: rule.severity,
        });
      }
    }
  }
}

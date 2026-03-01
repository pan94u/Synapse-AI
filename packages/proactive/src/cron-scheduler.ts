import { parseCron, matchesCron, type CronFields } from './cron-parser.js';

interface CronJob {
  id: string;
  cronExpression: string;
  fields: CronFields;
  callback: () => Promise<void>;
  lastRun: string | null;   // ISO minute string "YYYY-MM-DDTHH:mm" to prevent double-fire
}

export class CronScheduler {
  private jobs = new Map<string, CronJob>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;

  register(job: { id: string; cronExpression: string; callback: () => Promise<void> }): void {
    const fields = parseCron(job.cronExpression);
    this.jobs.set(job.id, {
      id: job.id,
      cronExpression: job.cronExpression,
      fields,
      callback: job.callback,
      lastRun: null,
    });
  }

  unregister(jobId: string): void {
    this.jobs.delete(jobId);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.timer = setInterval(() => this.tick(), 60_000);
    // Also tick immediately so jobs at the current minute are not missed
    this.tick();
  }

  stop(): void {
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  listJobs(): string[] {
    return Array.from(this.jobs.keys());
  }

  isRunning(): boolean {
    return this.running;
  }

  private tick(): void {
    const now = new Date();
    const minuteKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    for (const job of this.jobs.values()) {
      if (job.lastRun === minuteKey) continue;
      if (matchesCron(job.fields, now)) {
        job.lastRun = minuteKey;
        job.callback().catch((err) => {
          console.error(`[CronScheduler] Job "${job.id}" failed:`, err);
        });
      }
    }
  }
}

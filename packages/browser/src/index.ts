import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';

export interface BrowserPoolOptions {
  headless?: boolean;
  maxContexts?: number;
  defaultTimeout?: number;
  screenshotDir?: string;
}

/**
 * BrowserPool manages a single Chromium browser instance and provides
 * session-based BrowserContext acquisition for tool calls.
 *
 * Sessions are identified by sessionId — the same session reuses the same
 * context/page, allowing multi-step browser workflows (navigate → click → fill → screenshot).
 */
export class BrowserPool {
  private browser: Browser | null = null;
  private sessions = new Map<string, { context: BrowserContext; page: Page; lastUsed: number }>();
  private options: Required<BrowserPoolOptions>;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(options: BrowserPoolOptions = {}) {
    this.options = {
      headless: options.headless ?? true,
      maxContexts: options.maxContexts ?? 5,
      defaultTimeout: options.defaultTimeout ?? 30000,
      screenshotDir: options.screenshotDir ?? 'data/browser/screenshots',
      ...options,
    };
  }

  async initialize(): Promise<void> {
    if (this.browser) return;
    this.browser = await chromium.launch({
      headless: this.options.headless,
    });

    // Cleanup stale sessions every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanupStaleSessions(), 5 * 60 * 1000);
  }

  /**
   * Get or create a page for the given session.
   * Same sessionId returns the same page (for multi-step workflows).
   */
  async getPage(sessionId: string): Promise<Page> {
    if (!this.browser) {
      await this.initialize();
    }

    const existing = this.sessions.get(sessionId);
    if (existing) {
      existing.lastUsed = Date.now();
      return existing.page;
    }

    // Evict oldest session if at capacity
    if (this.sessions.size >= this.options.maxContexts) {
      let oldestId = '';
      let oldestTime = Infinity;
      for (const [id, session] of this.sessions) {
        if (session.lastUsed < oldestTime) {
          oldestTime = session.lastUsed;
          oldestId = id;
        }
      }
      if (oldestId) {
        await this.closeSession(oldestId);
      }
    }

    const context = await this.browser!.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Synapse AI Browser Agent) AppleWebKit/537.36',
    });
    const page = await context.newPage();
    page.setDefaultTimeout(this.options.defaultTimeout);

    this.sessions.set(sessionId, { context, page, lastUsed: Date.now() });
    return page;
  }

  async closeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      await session.context.close().catch(() => {});
      this.sessions.delete(sessionId);
    }
  }

  get screenshotDir(): string {
    return this.options.screenshotDir;
  }

  get defaultTimeout(): number {
    return this.options.defaultTimeout;
  }

  get activeSessions(): number {
    return this.sessions.size;
  }

  private cleanupStaleSessions(): void {
    const staleThreshold = 10 * 60 * 1000; // 10 minutes
    const now = Date.now();
    for (const [id, session] of this.sessions) {
      if (now - session.lastUsed > staleThreshold) {
        session.context.close().catch(() => {});
        this.sessions.delete(id);
      }
    }
  }

  async shutdown(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    for (const [id] of this.sessions) {
      await this.closeSession(id);
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

/**
 * Structural interface for BrowserPool — avoids direct @synapse/browser dependency.
 * Injected at server layer.
 */
export interface BrowserPoolAdapter {
  getPage(sessionId: string): Promise<BrowserPageAdapter>;
  closeSession(sessionId: string): Promise<void>;
  readonly screenshotDir: string;
  readonly defaultTimeout: number;
}

/**
 * Structural interface for a Playwright Page — only the methods browser tools need.
 */
export interface BrowserPageAdapter {
  goto(url: string, options?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle'; timeout?: number }): Promise<{ status(): number | null }>;
  title(): Promise<string>;
  url(): string;
  click(selector: string, options?: { timeout?: number }): Promise<void>;
  fill(selector: string, value: string, options?: { timeout?: number }): Promise<void>;
  screenshot(options?: { path?: string; fullPage?: boolean }): Promise<Buffer>;
  evaluate<T>(fn: string | (() => T)): Promise<T>;
  waitForSelector(selector: string, options?: { timeout?: number; state?: 'visible' | 'hidden' | 'attached' }): Promise<unknown>;
  content(): Promise<string>;
  innerText(selector: string): Promise<string>;
  $$eval(selector: string, fn: (elements: Element[]) => unknown): Promise<unknown>;
}

export interface BrowserToolDeps {
  browserPool: BrowserPoolAdapter;
  /** Default session ID (overridden per-request if available) */
  defaultSessionId?: string;
}

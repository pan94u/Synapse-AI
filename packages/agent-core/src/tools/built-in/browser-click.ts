import type { Tool } from '../types.js';
import type { BrowserToolDeps } from './browser-types.js';

export function createBrowserClickTool(deps: BrowserToolDeps): Tool {
  return {
    definition: {
      name: 'browser_click',
      description:
        'Click an element on the current page by CSS selector. Must call browser_navigate first.',
      parameters: {
        type: 'object',
        properties: {
          selector: {
            type: 'string',
            description: 'CSS selector of the element to click (e.g. "button.submit", "#login-btn")',
          },
          sessionId: {
            type: 'string',
            description: 'Browser session ID (must match a previous browser_navigate call)',
          },
        },
        required: ['selector'],
      },
    },
    permission: 'ask',

    async execute(args) {
      const selector = args.selector as string;
      const sessionId = (args.sessionId as string) || deps.defaultSessionId || 'default';

      try {
        const page = await deps.browserPool.getPage(sessionId);
        await page.click(selector, { timeout: deps.browserPool.defaultTimeout });
        const title = await page.title();

        return JSON.stringify({
          success: true,
          clicked: selector,
          currentUrl: page.url(),
          currentTitle: title,
          sessionId,
        }, null, 2);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return JSON.stringify({ success: false, error: message, selector, sessionId });
      }
    },
  };
}

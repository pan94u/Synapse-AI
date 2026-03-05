import type { Tool } from '../types.js';
import type { BrowserToolDeps } from './browser-types.js';

export function createBrowserWaitTool(deps: BrowserToolDeps): Tool {
  return {
    definition: {
      name: 'browser_wait',
      description:
        'Wait for an element to appear on the page. Useful after navigation or click actions that trigger dynamic content loading.',
      parameters: {
        type: 'object',
        properties: {
          selector: {
            type: 'string',
            description: 'CSS selector of the element to wait for',
          },
          sessionId: {
            type: 'string',
            description: 'Browser session ID',
          },
          state: {
            type: 'string',
            enum: ['visible', 'hidden', 'attached'],
            description: 'Wait condition: "visible" (default), "hidden", or "attached"',
          },
          timeout: {
            type: 'number',
            description: 'Timeout in milliseconds (defaults to pool default)',
          },
        },
        required: ['selector'],
      },
    },
    permission: 'always',

    async execute(args) {
      const selector = args.selector as string;
      const sessionId = (args.sessionId as string) || deps.defaultSessionId || 'default';
      const state = (args.state as 'visible' | 'hidden' | 'attached') || 'visible';
      const timeout = (args.timeout as number) || deps.browserPool.defaultTimeout;

      try {
        const page = await deps.browserPool.getPage(sessionId);
        await page.waitForSelector(selector, { state, timeout });

        return JSON.stringify({
          success: true,
          selector,
          state,
          url: page.url(),
          sessionId,
        }, null, 2);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return JSON.stringify({ success: false, error: message, selector, state, sessionId });
      }
    },
  };
}

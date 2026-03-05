import type { Tool } from '../types.js';
import type { BrowserToolDeps } from './browser-types.js';

export function createBrowserNavigateTool(deps: BrowserToolDeps): Tool {
  return {
    definition: {
      name: 'browser_navigate',
      description:
        'Navigate the browser to a URL. Returns page title, final URL, and status. Use sessionId to maintain state across multiple browser actions.',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The URL to navigate to',
          },
          sessionId: {
            type: 'string',
            description: 'Browser session ID (reuse to keep state across actions). Defaults to "default".',
          },
          waitUntil: {
            type: 'string',
            enum: ['load', 'domcontentloaded', 'networkidle'],
            description: 'Wait condition (defaults to "load")',
          },
        },
        required: ['url'],
      },
    },
    permission: 'ask',

    async execute(args) {
      const url = args.url as string;
      const sessionId = (args.sessionId as string) || deps.defaultSessionId || 'default';
      const waitUntil = (args.waitUntil as 'load' | 'domcontentloaded' | 'networkidle') || 'load';

      try {
        const page = await deps.browserPool.getPage(sessionId);
        const response = await page.goto(url, { waitUntil, timeout: deps.browserPool.defaultTimeout });
        const title = await page.title();

        return JSON.stringify({
          success: true,
          url: page.url(),
          title,
          status: response?.status() ?? null,
          sessionId,
        }, null, 2);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return JSON.stringify({ success: false, error: message, sessionId });
      }
    },
  };
}

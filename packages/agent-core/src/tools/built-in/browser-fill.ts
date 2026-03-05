import type { Tool } from '../types.js';
import type { BrowserToolDeps } from './browser-types.js';

export function createBrowserFillTool(deps: BrowserToolDeps): Tool {
  return {
    definition: {
      name: 'browser_fill',
      description:
        'Fill a form input field on the current page. Clears existing value and types the new text.',
      parameters: {
        type: 'object',
        properties: {
          selector: {
            type: 'string',
            description: 'CSS selector of the input/textarea to fill',
          },
          text: {
            type: 'string',
            description: 'Text to type into the field',
          },
          sessionId: {
            type: 'string',
            description: 'Browser session ID',
          },
        },
        required: ['selector', 'text'],
      },
    },
    permission: 'ask',

    async execute(args) {
      const selector = args.selector as string;
      const text = args.text as string;
      const sessionId = (args.sessionId as string) || deps.defaultSessionId || 'default';

      try {
        const page = await deps.browserPool.getPage(sessionId);
        await page.fill(selector, text, { timeout: deps.browserPool.defaultTimeout });

        return JSON.stringify({
          success: true,
          filled: selector,
          textLength: text.length,
          sessionId,
        }, null, 2);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return JSON.stringify({ success: false, error: message, selector, sessionId });
      }
    },
  };
}

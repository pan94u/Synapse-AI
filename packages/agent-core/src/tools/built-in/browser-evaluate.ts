import type { Tool } from '../types.js';
import type { BrowserToolDeps } from './browser-types.js';

export function createBrowserEvaluateTool(deps: BrowserToolDeps): Tool {
  return {
    definition: {
      name: 'browser_evaluate',
      description:
        'Execute JavaScript code in the browser page context. Returns the serialized result. Useful for interacting with page APIs or extracting complex data.',
      parameters: {
        type: 'object',
        properties: {
          script: {
            type: 'string',
            description: 'JavaScript code to execute in the page context. Must be a valid expression or IIFE.',
          },
          sessionId: {
            type: 'string',
            description: 'Browser session ID',
          },
        },
        required: ['script'],
      },
    },
    permission: 'ask',

    async execute(args) {
      const script = args.script as string;
      const sessionId = (args.sessionId as string) || deps.defaultSessionId || 'default';

      try {
        const page = await deps.browserPool.getPage(sessionId);
        const result = await page.evaluate(script);
        const serialized = JSON.stringify(result);

        return JSON.stringify({
          success: true,
          result: serialized.length > 50000 ? serialized.slice(0, 50000) + '... [truncated]' : result,
          sessionId,
        }, null, 2);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return JSON.stringify({ success: false, error: message, sessionId });
      }
    },
  };
}

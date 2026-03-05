import { resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';
import type { Tool } from '../types.js';
import type { BrowserToolDeps } from './browser-types.js';

export function createBrowserScreenshotTool(deps: BrowserToolDeps): Tool {
  return {
    definition: {
      name: 'browser_screenshot',
      description:
        'Take a screenshot of the current browser page. Returns the file path to the saved PNG.',
      parameters: {
        type: 'object',
        properties: {
          sessionId: {
            type: 'string',
            description: 'Browser session ID',
          },
          fullPage: {
            type: 'boolean',
            description: 'Capture the full scrollable page (defaults to false, viewport only)',
          },
          filename: {
            type: 'string',
            description: 'Custom filename (without extension). Auto-generated if omitted.',
          },
        },
        required: [],
      },
    },
    permission: 'ask',

    async execute(args) {
      const sessionId = (args.sessionId as string) || deps.defaultSessionId || 'default';
      const fullPage = (args.fullPage as boolean) ?? false;
      const filename = (args.filename as string) || `screenshot-${Date.now()}`;

      try {
        const page = await deps.browserPool.getPage(sessionId);
        const dir = resolve(process.cwd(), deps.browserPool.screenshotDir);
        await mkdir(dir, { recursive: true });
        const filePath = resolve(dir, `${filename}.png`);

        await page.screenshot({ path: filePath, fullPage });

        return JSON.stringify({
          success: true,
          filePath,
          fullPage,
          url: page.url(),
          title: await page.title(),
          sessionId,
        }, null, 2);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return JSON.stringify({ success: false, error: message, sessionId });
      }
    },
  };
}

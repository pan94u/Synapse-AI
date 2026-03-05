import type { Tool } from '../types.js';
import type { BrowserToolDeps } from './browser-types.js';

const MAX_TEXT_SIZE = 50 * 1024; // 50KB

export function createBrowserExtractTool(deps: BrowserToolDeps): Tool {
  return {
    definition: {
      name: 'browser_extract',
      description:
        'Extract text content from the current page. Can extract all visible text, text from a specific selector, or structured data from a table.',
      parameters: {
        type: 'object',
        properties: {
          sessionId: {
            type: 'string',
            description: 'Browser session ID',
          },
          selector: {
            type: 'string',
            description: 'CSS selector to extract text from. If omitted, extracts from body.',
          },
          mode: {
            type: 'string',
            enum: ['text', 'html', 'table'],
            description: 'Extraction mode: "text" (plain text), "html" (raw HTML), "table" (structured table data). Defaults to "text".',
          },
        },
        required: [],
      },
    },
    permission: 'always',

    async execute(args) {
      const sessionId = (args.sessionId as string) || deps.defaultSessionId || 'default';
      const selector = (args.selector as string) || 'body';
      const mode = (args.mode as string) || 'text';

      try {
        const page = await deps.browserPool.getPage(sessionId);

        if (mode === 'table') {
          const tableData = await page.$$eval(selector + ' tr', ((rows: Element[]) => {
            return rows.map((row) => {
              const cells = row.querySelectorAll('td, th');
              return Array.from(cells).map((cell) => (cell as HTMLElement).innerText.trim());
            });
          }) as unknown as (elements: Element[]) => unknown);

          return JSON.stringify({
            success: true,
            mode: 'table',
            rows: tableData,
            url: page.url(),
            sessionId,
          }, null, 2);
        }

        if (mode === 'html') {
          let html = await page.content();
          if (html.length > MAX_TEXT_SIZE) {
            html = html.slice(0, MAX_TEXT_SIZE) + '\n... [truncated]';
          }
          return JSON.stringify({
            success: true,
            mode: 'html',
            content: html,
            length: html.length,
            sessionId,
          }, null, 2);
        }

        // Default: text mode
        let text = await page.innerText(selector);
        if (text.length > MAX_TEXT_SIZE) {
          text = text.slice(0, MAX_TEXT_SIZE) + '\n... [truncated]';
        }
        return JSON.stringify({
          success: true,
          mode: 'text',
          content: text,
          length: text.length,
          url: page.url(),
          sessionId,
        }, null, 2);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return JSON.stringify({ success: false, error: message, sessionId });
      }
    },
  };
}

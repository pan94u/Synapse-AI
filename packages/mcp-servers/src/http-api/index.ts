import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const BASE_URL = process.env.HTTP_API_BASE_URL ?? '';
const AUTH_HEADER = process.env.HTTP_API_AUTH_HEADER;
const AUTH_VALUE = process.env.HTTP_API_AUTH_VALUE;

const server = new McpServer({
  name: 'http-api',
  version: '0.1.0',
});

server.tool(
  'http_request',
  'Execute an HTTP request and return the response',
  {
    url: z.string().describe('The URL to request (appended to base URL if configured)'),
    method: z
      .enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'])
      .optional()
      .describe('HTTP method (default: GET)'),
    headers: z
      .record(z.string())
      .optional()
      .describe('Additional request headers'),
    body: z
      .string()
      .optional()
      .describe('Request body (typically JSON string)'),
  },
  async ({ url, method = 'GET', headers = {}, body }) => {
    try {
      // Build full URL
      const fullUrl = BASE_URL ? new URL(url, BASE_URL).toString() : url;

      // Build headers
      const requestHeaders: Record<string, string> = { ...headers };
      if (AUTH_HEADER && AUTH_VALUE) {
        requestHeaders[AUTH_HEADER] = AUTH_VALUE;
      }

      // If body looks like JSON, set content-type
      if (body && !requestHeaders['Content-Type'] && !requestHeaders['content-type']) {
        requestHeaders['Content-Type'] = 'application/json';
      }

      const response = await fetch(fullUrl, {
        method,
        headers: requestHeaders,
        body: body ?? undefined,
      });

      const responseBody = await response.text();

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              status: response.status,
              statusText: response.statusText,
              headers: Object.fromEntries(response.headers.entries()),
              body: responseBody,
            }),
          },
        ],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return {
        content: [
          { type: 'text' as const, text: JSON.stringify({ error: message }) },
        ],
        isError: true,
      };
    }
  },
);

// Start the server with stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);

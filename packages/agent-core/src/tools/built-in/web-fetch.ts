import type { Tool } from '../types.js';

const MAX_BODY_SIZE = 100 * 1024; // 100KB

export const webFetchTool: Tool = {
  definition: {
    name: 'web_fetch',
    description: 'Make an HTTP request and return the response. Body is truncated to 100KB.',
    parameters: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL to fetch',
        },
        method: {
          type: 'string',
          description: 'HTTP method (defaults to GET)',
        },
        headers: {
          type: 'object',
          description: 'Request headers as key-value pairs',
        },
        body: {
          type: 'string',
          description: 'Request body (for POST/PUT/PATCH)',
        },
      },
      required: ['url'],
    },
  },
  permission: 'ask',
  async execute(args) {
    const url = args.url as string;
    const method = (args.method as string) || 'GET';
    const headers = (args.headers as Record<string, string>) || {};
    const body = args.body as string | undefined;

    const response = await fetch(url, {
      method,
      headers,
      body: body ?? undefined,
    });

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    let responseBody = await response.text();
    if (responseBody.length > MAX_BODY_SIZE) {
      responseBody = responseBody.slice(0, MAX_BODY_SIZE) + '\n... [truncated]';
    }

    return JSON.stringify({
      status: response.status,
      headers: responseHeaders,
      body: responseBody,
    }, null, 2);
  },
};

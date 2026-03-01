import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import type { ChatRequest } from '@synapse/shared';
import type { Agent } from '@synapse/agent-core';

export function createAgentRoutes(agent: Agent): Hono {
  const routes = new Hono();

  routes.post('/agent', async (c) => {
    const body = await c.req.json<ChatRequest>();
    const { messages, model, routingStrategy, stream = true } = body;

    if (!messages || messages.length === 0) {
      return c.json({ error: 'messages is required and must not be empty' }, 400);
    }

    const strategy = routingStrategy ?? 'default';

    try {
      if (!stream) {
        const result = await agent.run(messages, strategy, model);
        return c.json(result);
      }

      return streamSSE(c, async (sseStream) => {
        try {
          for await (const event of agent.runStream(messages, strategy, model)) {
            await sseStream.writeSSE({
              data: JSON.stringify(event),
              event: event.type,
            });
          }

          await sseStream.writeSSE({ data: '[DONE]', event: 'message' });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown streaming error';
          console.error('Agent stream error:', err);
          await sseStream.writeSSE({
            data: JSON.stringify({ error: message }),
            event: 'error',
          });
        }
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Agent error:', err);
      return c.json({ error: message }, 500);
    }
  });

  return routes;
}

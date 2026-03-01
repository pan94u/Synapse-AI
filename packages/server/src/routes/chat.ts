import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import type { ChatRequest } from '@synapse/shared';
import { createDefaultRouter } from '@synapse/agent-core';

const router = createDefaultRouter();

export const chatRoutes = new Hono();

chatRoutes.post('/chat', async (c) => {
  const body = await c.req.json<ChatRequest>();
  const { messages, model, routingStrategy, stream = true } = body;

  if (!messages || messages.length === 0) {
    return c.json({ error: 'messages is required and must not be empty' }, 400);
  }

  const strategy = routingStrategy ?? 'default';

  try {
    if (!stream) {
      const result = await router.complete({ messages }, strategy, model);
      return c.json({
        message: {
          role: 'assistant' as const,
          content: result.content,
          thinking: result.thinking,
        },
        model: result.model,
        usage: result.usage,
      });
    }

    return streamSSE(c, async (sseStream) => {
      try {
        for await (const chunk of router.completeStream({ messages }, strategy, model)) {
          if (chunk.done) {
            await sseStream.writeSSE({
              data: JSON.stringify({ content: '', done: true, model: chunk.model, usage: chunk.usage }),
              event: 'message',
            });
            break;
          }

          await sseStream.writeSSE({
            data: JSON.stringify({
              content: chunk.content ?? '',
              thinking: chunk.thinking,
              done: false,
              model: chunk.model,
            }),
            event: 'message',
          });
        }

        await sseStream.writeSSE({ data: '[DONE]', event: 'message' });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown streaming error';
        console.error('Stream error:', err);
        await sseStream.writeSSE({
          data: JSON.stringify({ error: message, done: true }),
          event: 'error',
        });
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Chat error:', err);
    return c.json({ error: message }, 500);
  }
});

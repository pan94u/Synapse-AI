import type { ToolCall, ToolResult, ChatMessage, TokenUsage } from '@synapse/shared';

// Mirror of AgentStreamEvent from agent-core (declared locally to avoid dependency)
export type AgentStreamEvent =
  | { type: 'text'; content: string; thinking?: string }
  | { type: 'tool_call'; call: ToolCall }
  | { type: 'tool_result'; result: ToolResult }
  | { type: 'done'; message: ChatMessage; model: string; usage?: TokenUsage }
  | { type: 'error'; error: string };

interface SSEMessage {
  event?: string;
  data: string;
}

/**
 * Parse an SSE buffer into messages.
 * Handles: event: {type}\ndata: {json}\n\n
 * And terminator: data: [DONE]\nevent: message\n\n
 */
export function parseSSEBuffer(buffer: string): { messages: SSEMessage[]; remaining: string } {
  const messages: SSEMessage[] = [];
  const blocks = buffer.split('\n\n');
  const remaining = blocks.pop() || ''; // last incomplete block

  for (const block of blocks) {
    if (!block.trim()) continue;

    const lines = block.split('\n');
    const msg: SSEMessage = { data: '' };

    for (const line of lines) {
      if (line.startsWith('event:')) {
        msg.event = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        msg.data = line.slice(5).trim();
      }
    }

    if (msg.data) {
      messages.push(msg);
    }
  }

  return { messages, remaining };
}

/**
 * Async generator that consumes a POST SSE response and yields AgentStreamEvents.
 */
export async function* streamAgentChat(
  url: string,
  body: Record<string, unknown>,
  signal?: AbortSignal
): AsyncGenerator<AgentStreamEvent> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  if (!res.body) {
    throw new Error('No response body');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const { messages, remaining } = parseSSEBuffer(buffer);
      buffer = remaining;

      for (const msg of messages) {
        if (msg.data === '[DONE]') return;

        try {
          const event = JSON.parse(msg.data) as AgentStreamEvent;
          yield event;
        } catch {
          // skip unparseable messages
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

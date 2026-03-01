import type { ChatMessage, ToolDefinition, ToolCall } from '@synapse/shared';

/**
 * Convert internal ChatMessage[] to OpenAI API message format.
 * Handles assistant messages with tool_calls and tool role messages.
 */
export function mapMessagesToOpenAI(messages: ChatMessage[]): Record<string, unknown>[] {
  return messages.map((m) => {
    if (m.role === 'tool') {
      return {
        role: 'tool',
        content: m.content,
        tool_call_id: m.toolCallId,
      };
    }

    if (m.role === 'assistant' && m.toolCalls?.length) {
      return {
        role: 'assistant',
        content: m.content || null,
        tool_calls: m.toolCalls.map((tc) => ({
          id: tc.id,
          type: 'function',
          function: {
            name: tc.name,
            arguments: JSON.stringify(tc.arguments),
          },
        })),
      };
    }

    return {
      role: m.role,
      content: m.content,
    };
  });
}

/**
 * Convert internal ToolDefinition[] to OpenAI function calling format.
 */
export function mapToolsToOpenAI(tools: ToolDefinition[]): Record<string, unknown>[] {
  return tools.map((tool) => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}

/**
 * Extract ToolCall[] from OpenAI response tool_calls array.
 */
/**
 * Extract thinking text from MiniMax reasoning_details.
 * MiniMax may return a string or an array of objects with a `text` field.
 */
export function extractThinking(reasoning: unknown): string | undefined {
  if (!reasoning) return undefined;
  if (typeof reasoning === 'string') return reasoning;
  if (Array.isArray(reasoning)) {
    return reasoning
      .map((item) => (typeof item === 'object' && item !== null ? (item as Record<string, unknown>).text ?? '' : String(item)))
      .join('');
  }
  return String(reasoning);
}

export function extractToolCalls(
  toolCalls: Array<Record<string, unknown>> | undefined,
): ToolCall[] | undefined {
  if (!toolCalls?.length) return undefined;

  return toolCalls.map((tc) => {
    const fn = tc.function as Record<string, unknown> | undefined;
    let args: Record<string, unknown> = {};
    try {
      args = JSON.parse((fn?.arguments as string) || '{}');
    } catch {
      // keep empty args
    }
    return {
      id: tc.id as string,
      name: fn?.name as string,
      arguments: args,
    };
  });
}

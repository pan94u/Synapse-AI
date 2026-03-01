import OpenAI from 'openai';
import type { ToolCall } from '@synapse/shared';
import type { CompletionParams, CompletionResult, ModelProvider, StreamChunk } from './types.js';
import { mapMessagesToOpenAI, mapToolsToOpenAI, extractToolCalls, extractThinking } from './utils.js';

export class MiniMaxProvider implements ModelProvider {
  readonly providerId = 'minimax';
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://api.minimaxi.com/v1',
    });
  }

  async complete(params: CompletionParams): Promise<CompletionResult> {
    const body: Record<string, unknown> = {
      model: params.model,
      messages: mapMessagesToOpenAI(params.messages),
      reasoning_split: true,
    };

    if (params.tools?.length) {
      body.tools = mapToolsToOpenAI(params.tools);
    }

    const response = await (this.client.chat.completions.create as Function)(body);

    const choice = response.choices[0];
    const message = choice?.message as Record<string, unknown> | undefined;

    return {
      content: (message?.content as string) ?? '',
      thinking: extractThinking(message?.reasoning_details),
      model: response.model,
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
      toolCalls: extractToolCalls(message?.tool_calls as Array<Record<string, unknown>> | undefined),
    };
  }

  async *completeStream(params: CompletionParams): AsyncIterable<StreamChunk> {
    const body: Record<string, unknown> = {
      model: params.model,
      messages: mapMessagesToOpenAI(params.messages),
      stream: true,
      reasoning_split: true,
    };

    if (params.tools?.length) {
      body.tools = mapToolsToOpenAI(params.tools);
    }

    const stream = await (this.client.chat.completions.create as Function)(body);

    // Accumulate tool call deltas across chunks
    const toolCallAccum = new Map<number, { id: string; name: string; arguments: string }>();

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta as Record<string, unknown> | undefined;
      if (!delta) continue;

      // Accumulate tool_calls deltas
      const deltaToolCalls = delta.tool_calls as Array<Record<string, unknown>> | undefined;
      if (deltaToolCalls) {
        for (const tc of deltaToolCalls) {
          const index = tc.index as number;
          const fn = tc.function as Record<string, unknown> | undefined;
          if (!toolCallAccum.has(index)) {
            toolCallAccum.set(index, {
              id: (tc.id as string) ?? '',
              name: fn?.name as string ?? '',
              arguments: '',
            });
          }
          const acc = toolCallAccum.get(index)!;
          if (tc.id) acc.id = tc.id as string;
          if (fn?.name) acc.name = fn.name as string;
          if (fn?.arguments) acc.arguments += fn.arguments as string;
        }
      }

      yield {
        content: (delta.content as string) ?? undefined,
        thinking: extractThinking(delta.reasoning_details),
        done: false,
        model: chunk.model,
      };
    }

    // Emit final chunk with accumulated tool calls
    const toolCalls: ToolCall[] = [];
    for (const [, acc] of toolCallAccum) {
      try {
        toolCalls.push({
          id: acc.id,
          name: acc.name,
          arguments: JSON.parse(acc.arguments || '{}'),
        });
      } catch {
        toolCalls.push({
          id: acc.id,
          name: acc.name,
          arguments: {},
        });
      }
    }

    yield { done: true, toolCalls: toolCalls.length > 0 ? toolCalls : undefined };
  }
}

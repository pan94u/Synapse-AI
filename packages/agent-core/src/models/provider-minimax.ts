import OpenAI from 'openai';
import type { CompletionParams, CompletionResult, ModelProvider, StreamChunk } from './types.js';

export class MiniMaxProvider implements ModelProvider {
  readonly providerId = 'minimax';
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://api.minimax.io/v1',
    });
  }

  async complete(params: CompletionParams): Promise<CompletionResult> {
    // Use body to pass MiniMax-specific reasoning_split parameter
    const response = await (this.client.chat.completions.create as Function)({
      model: params.model,
      messages: params.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      reasoning_split: true,
    });

    const choice = response.choices[0];
    const message = choice?.message as Record<string, unknown> | undefined;

    return {
      content: (message?.content as string) ?? '',
      thinking: message?.reasoning_details as string | undefined,
      model: response.model,
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
    };
  }

  async *completeStream(params: CompletionParams): AsyncIterable<StreamChunk> {
    const stream = await (this.client.chat.completions.create as Function)({
      model: params.model,
      messages: params.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      stream: true,
      reasoning_split: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta as Record<string, unknown> | undefined;
      if (!delta) continue;

      yield {
        content: (delta.content as string) ?? undefined,
        thinking: delta.reasoning_details as string | undefined,
        done: false,
        model: chunk.model,
      };
    }

    yield { done: true };
  }
}

import OpenAI from 'openai';
import type { CompletionParams, CompletionResult, ModelProvider, StreamChunk } from './types.js';

export class ClaudeProvider implements ModelProvider {
  readonly providerId = 'claude';
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://api.anthropic.com/v1/',
    });
  }

  async complete(params: CompletionParams): Promise<CompletionResult> {
    const response = await this.client.chat.completions.create({
      model: params.model,
      messages: params.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens: 4096,
    });

    const choice = response.choices[0];
    const message = choice?.message;

    return {
      content: message?.content ?? '',
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
    const stream = await this.client.chat.completions.create({
      model: params.model,
      messages: params.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens: 4096,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (!delta) continue;

      yield {
        content: delta.content ?? undefined,
        done: false,
        model: chunk.model,
      };
    }

    yield { done: true };
  }
}

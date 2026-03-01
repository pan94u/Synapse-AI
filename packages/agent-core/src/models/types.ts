import type { ChatMessage, TokenUsage } from '@synapse/shared';

export interface CompletionParams {
  messages: ChatMessage[];
  model: string;
}

export interface CompletionResult {
  content: string;
  thinking?: string;
  model: string;
  usage?: TokenUsage;
}

export interface StreamChunk {
  content?: string;
  thinking?: string;
  done: boolean;
  model?: string;
  usage?: TokenUsage;
}

export interface ModelProvider {
  readonly providerId: string;
  complete(params: CompletionParams): Promise<CompletionResult>;
  completeStream(params: CompletionParams): AsyncIterable<StreamChunk>;
}

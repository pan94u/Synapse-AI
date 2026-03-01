import type { ChatMessage, TokenUsage, ToolDefinition, ToolCall } from '@synapse/shared';

export interface CompletionParams {
  messages: ChatMessage[];
  model: string;
  tools?: ToolDefinition[];
}

export interface CompletionResult {
  content: string;
  thinking?: string;
  model: string;
  usage?: TokenUsage;
  toolCalls?: ToolCall[];
}

export interface StreamChunk {
  content?: string;
  thinking?: string;
  done: boolean;
  model?: string;
  usage?: TokenUsage;
  toolCalls?: ToolCall[];
}

export interface ModelProvider {
  readonly providerId: string;
  complete(params: CompletionParams): Promise<CompletionResult>;
  completeStream(params: CompletionParams): AsyncIterable<StreamChunk>;
}

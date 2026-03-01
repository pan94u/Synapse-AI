import type { ToolCall } from './tool.js';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  thinking?: string;
  toolCalls?: ToolCall[];
  toolCallId?: string; // for tool role messages
}

export type RoutingStrategy = 'default' | 'cost-optimized' | 'quality-first';

export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  routingStrategy?: RoutingStrategy;
  stream?: boolean;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ChatStreamChunk {
  content?: string;
  thinking?: string;
  done: boolean;
  model?: string;
  usage?: TokenUsage;
}

export interface ChatResponse {
  message: ChatMessage;
  model: string;
  usage?: TokenUsage;
}

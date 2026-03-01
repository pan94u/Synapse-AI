export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON Schema
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  callId: string;
  name: string;
  content: string;
  isError?: boolean;
}

export type ToolPermission = 'always' | 'ask' | 'deny';

export interface ToolConfig {
  name: string;
  permission: ToolPermission;
}

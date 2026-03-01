import type { ToolDefinition, ToolPermission } from '@synapse/shared';

export interface Tool {
  definition: ToolDefinition;
  permission: ToolPermission;
  execute(args: Record<string, unknown>): Promise<string>;
}

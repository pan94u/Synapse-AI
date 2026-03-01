import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { MCPServerConfig } from '@synapse/shared';

/**
 * Resolve `${env:VAR_NAME}` references in a string to actual environment variable values.
 */
function resolveEnvRefs(value: string): string {
  return value.replace(/\$\{env:([^}]+)\}/g, (_match, varName: string) => {
    return process.env[varName] ?? '';
  });
}

/**
 * Deep-resolve all env references in an object.
 */
function resolveEnvInObject<T>(obj: T): T {
  if (typeof obj === 'string') {
    return resolveEnvRefs(obj) as T;
  }
  if (Array.isArray(obj)) {
    return obj.map(resolveEnvInObject) as T;
  }
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = resolveEnvInObject(value);
    }
    return result as T;
  }
  return obj;
}

/**
 * Load MCP server configs from a directory of JSON files.
 * Only returns configs with `enabled: true`.
 */
export async function loadServerConfigs(configDir: string): Promise<MCPServerConfig[]> {
  const configs: MCPServerConfig[] = [];

  let files: string[];
  try {
    files = await readdir(configDir);
  } catch {
    console.warn(`[mcp-hub] Config directory not found: ${configDir}`);
    return configs;
  }

  const jsonFiles = files.filter((f) => f.endsWith('.json'));

  for (const file of jsonFiles) {
    try {
      const content = await readFile(join(configDir, file), 'utf-8');
      const raw = JSON.parse(content) as MCPServerConfig;
      const config = resolveEnvInObject(raw);

      if (config.enabled) {
        configs.push(config);
      }
    } catch (err) {
      console.error(`[mcp-hub] Failed to load config ${file}:`, err);
    }
  }

  return configs;
}

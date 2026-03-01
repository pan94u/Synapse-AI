import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { Database } from 'bun:sqlite';

const DATABASE_PATH = process.env.DATABASE_PATH;
if (!DATABASE_PATH) {
  console.error('DATABASE_PATH environment variable is required');
  process.exit(1);
}

const db = new Database(DATABASE_PATH, { create: true });

// Enable WAL mode for better concurrent read performance
db.run('PRAGMA journal_mode=WAL');

const server = new McpServer({
  name: 'database',
  version: '0.1.0',
});

server.tool(
  'db_query',
  'Execute a SELECT query and return results as JSON rows',
  {
    sql: z.string().describe('The SQL SELECT query to execute'),
    params: z
      .array(z.union([z.string(), z.number(), z.boolean(), z.null()]))
      .optional()
      .describe('Optional query parameters for prepared statements'),
  },
  async ({ sql, params }) => {
    try {
      // Basic safety: only allow SELECT/PRAGMA/EXPLAIN statements
      const trimmed = sql.trim().toUpperCase();
      if (
        !trimmed.startsWith('SELECT') &&
        !trimmed.startsWith('PRAGMA') &&
        !trimmed.startsWith('EXPLAIN')
      ) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                error: 'db_query only supports SELECT, PRAGMA, and EXPLAIN statements. Use db_execute for modifications.',
              }),
            },
          ],
        };
      }

      const stmt = db.prepare(sql);
      const rows = params ? stmt.all(...(params as (string | number | boolean | null)[])) : stmt.all();

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ rows, rowCount: rows.length }),
          },
        ],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return {
        content: [
          { type: 'text' as const, text: JSON.stringify({ error: message }) },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  'db_execute',
  'Execute an INSERT, UPDATE, or DELETE statement',
  {
    sql: z.string().describe('The SQL statement to execute'),
    params: z
      .array(z.union([z.string(), z.number(), z.boolean(), z.null()]))
      .optional()
      .describe('Optional parameters for prepared statements'),
  },
  async ({ sql, params }) => {
    try {
      const stmt = db.prepare(sql);
      const result = params ? stmt.run(...(params as (string | number | boolean | null)[])) : stmt.run();

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              changes: result.changes,
              lastInsertRowid: Number(result.lastInsertRowid),
            }),
          },
        ],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return {
        content: [
          { type: 'text' as const, text: JSON.stringify({ error: message }) },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  'db_list_tables',
  'List all tables in the database',
  {},
  async () => {
    try {
      const rows = db
        .prepare(
          "SELECT name, type FROM sqlite_master WHERE type IN ('table', 'view') AND name NOT LIKE 'sqlite_%' ORDER BY name",
        )
        .all() as Array<{ name: string; type: string }>;

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ tables: rows }),
          },
        ],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return {
        content: [
          { type: 'text' as const, text: JSON.stringify({ error: message }) },
        ],
        isError: true,
      };
    }
  },
);

// Start the server with stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);

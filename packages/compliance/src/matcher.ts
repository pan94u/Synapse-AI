/**
 * Match a tool name against a pattern string.
 *
 * Supported patterns:
 * - Exact match: "db_query"
 * - Wildcard suffix: "fin_*" matches "fin_submit_expense", "fin_query_ledger"
 * - Multi-pattern (pipe separated): "hrm_*|crm_*|fin_*" matches any
 * - Match all: "*"
 */
export function matchToolPattern(pattern: string, toolName: string): boolean {
  // Multi-pattern: split by '|'
  if (pattern.includes('|')) {
    return pattern.split('|').some((p) => matchSingle(p.trim(), toolName));
  }
  return matchSingle(pattern, toolName);
}

function matchSingle(pattern: string, toolName: string): boolean {
  if (pattern === '*') return true;
  if (pattern.endsWith('*')) {
    return toolName.startsWith(pattern.slice(0, -1));
  }
  return pattern === toolName;
}

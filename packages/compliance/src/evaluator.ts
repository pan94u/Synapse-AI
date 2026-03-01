/**
 * Simple expression evaluator for compliance rule conditions.
 *
 * Supported syntax:
 * - Property access: input.amount, persona.id, output.success
 * - Comparison: ==, !=, <, <=, >, >=
 * - Logical: AND, OR, NOT
 * - Array check: IN, NOT IN (e.g., persona.id NOT IN ['hr-manager', 'ceo'])
 * - Literals: numbers, strings (single-quoted), true/false
 */

type TokenType =
  | 'IDENT'
  | 'NUMBER'
  | 'STRING'
  | 'BOOL'
  | 'OP'
  | 'LOGIC'
  | 'NOT'
  | 'IN'
  | 'LPAREN'
  | 'RPAREN'
  | 'LBRACKET'
  | 'RBRACKET'
  | 'COMMA'
  | 'EOF';

interface Token {
  type: TokenType;
  value: string;
}

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < expr.length) {
    // Skip whitespace
    if (/\s/.test(expr[i])) {
      i++;
      continue;
    }

    // Single-char tokens
    if (expr[i] === '(') { tokens.push({ type: 'LPAREN', value: '(' }); i++; continue; }
    if (expr[i] === ')') { tokens.push({ type: 'RPAREN', value: ')' }); i++; continue; }
    if (expr[i] === '[') { tokens.push({ type: 'LBRACKET', value: '[' }); i++; continue; }
    if (expr[i] === ']') { tokens.push({ type: 'RBRACKET', value: ']' }); i++; continue; }
    if (expr[i] === ',') { tokens.push({ type: 'COMMA', value: ',' }); i++; continue; }

    // Two-char operators
    if (i + 1 < expr.length) {
      const two = expr.slice(i, i + 2);
      if (['==', '!=', '<=', '>='].includes(two)) {
        tokens.push({ type: 'OP', value: two });
        i += 2;
        continue;
      }
    }

    // Single-char operators
    if (['<', '>'].includes(expr[i])) {
      tokens.push({ type: 'OP', value: expr[i] });
      i++;
      continue;
    }

    // String literal (single-quoted)
    if (expr[i] === "'") {
      let str = '';
      i++; // skip opening quote
      while (i < expr.length && expr[i] !== "'") {
        str += expr[i];
        i++;
      }
      i++; // skip closing quote
      tokens.push({ type: 'STRING', value: str });
      continue;
    }

    // Number literal
    if (/[\d.]/.test(expr[i])) {
      let num = '';
      while (i < expr.length && /[\d.]/.test(expr[i])) {
        num += expr[i];
        i++;
      }
      tokens.push({ type: 'NUMBER', value: num });
      continue;
    }

    // Keywords and identifiers
    if (/[a-zA-Z_]/.test(expr[i])) {
      let word = '';
      while (i < expr.length && /[a-zA-Z_\d.]/.test(expr[i])) {
        word += expr[i];
        i++;
      }
      const upper = word.toUpperCase();
      if (upper === 'AND' || upper === 'OR') {
        tokens.push({ type: 'LOGIC', value: upper });
      } else if (upper === 'NOT') {
        tokens.push({ type: 'NOT', value: 'NOT' });
      } else if (upper === 'IN') {
        tokens.push({ type: 'IN', value: 'IN' });
      } else if (upper === 'TRUE' || upper === 'FALSE') {
        tokens.push({ type: 'BOOL', value: upper });
      } else {
        tokens.push({ type: 'IDENT', value: word });
      }
      continue;
    }

    // Skip unknown characters
    i++;
  }

  tokens.push({ type: 'EOF', value: '' });
  return tokens;
}

function resolveProperty(path: string, context: Record<string, unknown>): unknown {
  const parts = path.split('.');
  let current: unknown = context;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return current;
}

class Parser {
  private tokens: Token[];
  private pos = 0;
  private context: Record<string, unknown>;

  constructor(tokens: Token[], context: Record<string, unknown>) {
    this.tokens = tokens;
    this.context = context;
  }

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private advance(): Token {
    const t = this.tokens[this.pos];
    this.pos++;
    return t;
  }

  private expect(type: TokenType): Token {
    const t = this.advance();
    if (t.type !== type) {
      throw new Error(`Expected ${type} but got ${t.type} (${t.value})`);
    }
    return t;
  }

  parse(): boolean {
    const result = this.parseOr();
    return result;
  }

  private parseOr(): boolean {
    let left = this.parseAnd();
    while (this.peek().type === 'LOGIC' && this.peek().value === 'OR') {
      this.advance();
      const right = this.parseAnd();
      left = left || right;
    }
    return left;
  }

  private parseAnd(): boolean {
    let left = this.parseNot();
    while (this.peek().type === 'LOGIC' && this.peek().value === 'AND') {
      this.advance();
      const right = this.parseNot();
      left = left && right;
    }
    return left;
  }

  private parseNot(): boolean {
    if (this.peek().type === 'NOT') {
      this.advance();
      // Check if this is "NOT IN"
      if (this.peek().type === 'IN') {
        // Oops, this was part of "value NOT IN [...]" — handled in parseComparison
        // Put NOT back by adjusting position
        this.pos--;
        return this.parseComparison();
      }
      return !this.parseNot();
    }
    return this.parseComparison();
  }

  private parseComparison(): boolean {
    if (this.peek().type === 'LPAREN') {
      this.advance();
      const result = this.parseOr();
      this.expect('RPAREN');
      return result;
    }

    const left = this.parseValue();

    // Check for NOT IN
    if (this.peek().type === 'NOT') {
      this.advance();
      if (this.peek().type === 'IN') {
        this.advance();
        const arr = this.parseArray();
        return !arr.includes(left);
      }
      // Put NOT back
      this.pos--;
      return Boolean(left);
    }

    // Check for IN
    if (this.peek().type === 'IN') {
      this.advance();
      const arr = this.parseArray();
      return arr.includes(left);
    }

    // Check for comparison operators
    if (this.peek().type === 'OP') {
      const op = this.advance().value;
      const right = this.parseValue();
      return this.compare(left, op, right);
    }

    return Boolean(left);
  }

  private parseValue(): unknown {
    const token = this.peek();

    if (token.type === 'NUMBER') {
      this.advance();
      return parseFloat(token.value);
    }
    if (token.type === 'STRING') {
      this.advance();
      return token.value;
    }
    if (token.type === 'BOOL') {
      this.advance();
      return token.value === 'TRUE';
    }
    if (token.type === 'IDENT') {
      this.advance();
      return resolveProperty(token.value, this.context);
    }

    // Fallback: return undefined for EOF or unexpected tokens
    return undefined;
  }

  private parseArray(): unknown[] {
    this.expect('LBRACKET');
    const arr: unknown[] = [];
    while (this.peek().type !== 'RBRACKET' && this.peek().type !== 'EOF') {
      arr.push(this.parseValue());
      if (this.peek().type === 'COMMA') {
        this.advance();
      }
    }
    this.expect('RBRACKET');
    return arr;
  }

  private compare(left: unknown, op: string, right: unknown): boolean {
    // Coerce for comparison
    const l = typeof left === 'string' ? left : Number(left);
    const r = typeof right === 'string' ? right : Number(right);

    switch (op) {
      case '==': return left == right;
      case '!=': return left != right;
      case '<':  return l < r;
      case '<=': return l <= r;
      case '>':  return l > r;
      case '>=': return l >= r;
      default:   return false;
    }
  }
}

/**
 * Evaluate a simple expression against a context object.
 * Returns true if the expression matches, false otherwise.
 * On parse errors, logs a warning and returns true (fail-open).
 */
export function evaluate(expr: string, context: Record<string, unknown>): boolean {
  if (!expr || expr.trim() === '') return true;

  try {
    const tokens = tokenize(expr);
    const parser = new Parser(tokens, context);
    return parser.parse();
  } catch (err) {
    console.warn(`[compliance/evaluator] Failed to evaluate expression: "${expr}"`, err);
    return true; // fail-open
  }
}

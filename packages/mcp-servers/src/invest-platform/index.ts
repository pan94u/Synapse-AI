import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// ── Configuration ──────────────────────────────────────────────
const API_URL = (process.env.INVEST_API_URL ?? 'http://localhost:3000/api').replace(/\/$/, '');
const USER_EMAIL = process.env.INVEST_USER_EMAIL ?? 'admin@invest.com';
const USER_PASSWORD = process.env.INVEST_USER_PASSWORD ?? 'admin123';

// ── JWT Token Management ───────────────────────────────────────
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function login(): Promise<string> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: USER_EMAIL, password: USER_PASSWORD }),
  });
  if (!res.ok) {
    throw new Error(`Login failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string };
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + 55 * 60 * 1000; // cache 55 min
  return cachedToken;
}

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;
  return login();
}

// ── HTTP Helpers (with 401 auto-retry) ─────────────────────────
async function apiGet(path: string): Promise<unknown> {
  const doRequest = async (token: string) => {
    const url = `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
    return fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  };

  let token = await getToken();
  let res = await doRequest(token);

  if (res.status === 401) {
    token = await login();
    res = await doRequest(token);
  }

  if (!res.ok) {
    throw new Error(`GET ${path} failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function apiPost(path: string, body: unknown): Promise<unknown> {
  const doRequest = async (token: string) => {
    const url = `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
    return fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  };

  let token = await getToken();
  let res = await doRequest(token);

  if (res.status === 401) {
    token = await login();
    res = await doRequest(token);
  }

  if (!res.ok) {
    throw new Error(`POST ${path} failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

// ── Helpers ────────────────────────────────────────────────────
function jsonContent(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

function errorContent(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  return { content: [{ type: 'text' as const, text: JSON.stringify({ error: message }) }], isError: true };
}

// ── MCP Server ─────────────────────────────────────────────────
const server = new McpServer({
  name: 'invest-platform',
  version: '0.1.0',
});

// ─── READ Tools ────────────────────────────────────────────────

server.tool(
  'invest_dashboard',
  '获取投资管理平台全局概览，包含 AUM、项目数、收益等关键指标',
  {},
  async () => {
    try {
      const data = await apiGet('/reports/dashboard');
      return jsonContent(data);
    } catch (err) {
      return errorContent(err);
    }
  },
);

server.tool(
  'invest_list_funds',
  '获取基金列表，包含名称、规模、状态、年份等信息',
  {},
  async () => {
    try {
      const data = await apiGet('/funds');
      return jsonContent(data);
    } catch (err) {
      return errorContent(err);
    }
  },
);

server.tool(
  'invest_get_fund',
  '获取基金详情及催缴记录',
  {
    fundId: z.number().describe('基金ID'),
  },
  async ({ fundId }) => {
    try {
      const [fund, capitalCalls] = await Promise.all([
        apiGet(`/funds/${fundId}`),
        apiGet(`/funds/${fundId}/capital-calls`),
      ]);
      return jsonContent({ fund, capitalCalls });
    } catch (err) {
      return errorContent(err);
    }
  },
);

server.tool(
  'invest_list_deals',
  '获取项目列表，包含项目名称、阶段、估值等信息',
  {},
  async () => {
    try {
      const data = await apiGet('/deals');
      return jsonContent(data);
    } catch (err) {
      return errorContent(err);
    }
  },
);

server.tool(
  'invest_deal_kanban',
  '获取项目管线看板数据，按6个阶段分组（SOURCING/SCREENING/DUE_DILIGENCE/INVESTMENT_COMMITTEE/CLOSING/POST_INVESTMENT）',
  {},
  async () => {
    try {
      const data = await apiGet('/deals/kanban');
      return jsonContent(data);
    } catch (err) {
      return errorContent(err);
    }
  },
);

server.tool(
  'invest_get_deal',
  '获取项目详情，包含时间线、估值历史、文档等',
  {
    dealId: z.number().describe('项目ID'),
  },
  async ({ dealId }) => {
    try {
      const data = await apiGet(`/deals/${dealId}`);
      return jsonContent(data);
    } catch (err) {
      return errorContent(err);
    }
  },
);

server.tool(
  'invest_list_portfolios',
  '获取投资组合列表，包含市值、盈亏等信息',
  {},
  async () => {
    try {
      const data = await apiGet('/portfolios');
      return jsonContent(data);
    } catch (err) {
      return errorContent(err);
    }
  },
);

server.tool(
  'invest_get_portfolio',
  '获取投资组合详情，包含持仓和交易记录',
  {
    portfolioId: z.number().describe('组合ID'),
  },
  async ({ portfolioId }) => {
    try {
      const data = await apiGet(`/portfolios/${portfolioId}`);
      return jsonContent(data);
    } catch (err) {
      return errorContent(err);
    }
  },
);

server.tool(
  'invest_portfolio_metrics',
  '获取投资组合关键指标，包含 IRR/MOIC/盈亏等',
  {
    portfolioId: z.number().describe('组合ID'),
  },
  async ({ portfolioId }) => {
    try {
      const data = await apiGet(`/portfolios/${portfolioId}/metrics`);
      return jsonContent(data);
    } catch (err) {
      return errorContent(err);
    }
  },
);

server.tool(
  'invest_list_lps',
  '获取 LP（有限合伙人）列表，包含类型、承诺金额、已缴金额等',
  {},
  async () => {
    try {
      const data = await apiGet('/lps');
      return jsonContent(data);
    } catch (err) {
      return errorContent(err);
    }
  },
);

server.tool(
  'invest_get_lp',
  '获取 LP 详情及分配记录',
  {
    lpId: z.number().describe('LP ID'),
  },
  async ({ lpId }) => {
    try {
      const data = await apiGet(`/lps/${lpId}`);
      return jsonContent(data);
    } catch (err) {
      return errorContent(err);
    }
  },
);

server.tool(
  'invest_revenue_curve',
  '获取月度累计收益曲线数据',
  {},
  async () => {
    try {
      const data = await apiGet('/reports/revenue-curve');
      return jsonContent(data);
    } catch (err) {
      return errorContent(err);
    }
  },
);

server.tool(
  'invest_todo_items',
  '获取待办事项，包含逾期催缴和停滞项目',
  {},
  async () => {
    try {
      const data = await apiGet('/reports/todo-items');
      return jsonContent(data);
    } catch (err) {
      return errorContent(err);
    }
  },
);

// ─── WRITE Tools ───────────────────────────────────────────────

server.tool(
  'invest_create_deal',
  '创建新的投资项目（需审批）',
  {
    fundId: z.number().describe('所属基金ID'),
    name: z.string().describe('项目名称'),
    industry: z.string().optional().describe('所属行业'),
    valuation: z.number().optional().describe('估值（万元）'),
    notes: z.string().optional().describe('备注'),
  },
  async (args) => {
    try {
      const data = await apiPost('/deals', args);
      return jsonContent(data);
    } catch (err) {
      return errorContent(err);
    }
  },
);

server.tool(
  'invest_advance_deal',
  '推进项目到下一阶段（需审批）',
  {
    dealId: z.number().describe('项目ID'),
    stage: z
      .enum([
        'SOURCING',
        'SCREENING',
        'DUE_DILIGENCE',
        'INVESTMENT_COMMITTEE',
        'CLOSING',
        'POST_INVESTMENT',
      ])
      .describe('目标阶段'),
    notes: z.string().optional().describe('推进备注'),
  },
  async ({ dealId, ...body }) => {
    try {
      const data = await apiPost(`/deals/${dealId}/advance`, body);
      return jsonContent(data);
    } catch (err) {
      return errorContent(err);
    }
  },
);

server.tool(
  'invest_add_valuation',
  '为项目添加新的估值记录（需审批）',
  {
    dealId: z.number().describe('项目ID'),
    amount: z.number().describe('估值金额（万元）'),
    date: z.string().optional().describe('估值日期 (YYYY-MM-DD)'),
    notes: z.string().optional().describe('估值备注'),
  },
  async ({ dealId, ...body }) => {
    try {
      const data = await apiPost(`/deals/${dealId}/valuations`, body);
      return jsonContent(data);
    } catch (err) {
      return errorContent(err);
    }
  },
);

server.tool(
  'invest_create_capital_call',
  '创建基金催缴通知（需审批）',
  {
    fundId: z.number().describe('基金ID'),
    amount: z.number().describe('催缴金额（万元）'),
    dueDate: z.string().describe('截止日期 (YYYY-MM-DD)'),
    notes: z.string().optional().describe('催缴说明'),
  },
  async ({ fundId, ...body }) => {
    try {
      const data = await apiPost(`/funds/${fundId}/capital-calls`, body);
      return jsonContent(data);
    } catch (err) {
      return errorContent(err);
    }
  },
);

// ── Start ──────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);

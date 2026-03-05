import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// ============================================================
// Finance MCP Server — 财务管理
// Mock 数据：部门预算、费用报销、收入/现金流快照
// ============================================================

interface Budget {
  id: string;
  department: string;
  year: number;
  totalBudget: number;
  used: number;
  remaining: number;
  categories: { name: string; allocated: number; spent: number }[];
}

interface Expense {
  id: string;
  department: string;
  applicant: string;
  category: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'reimbursed';
  submitDate: string;
  description: string;
  receiptCount: number;
}

interface RevenueData {
  period: string;
  revenue: number;
  cost: number;
  grossProfit: number;
  breakdown: { source: string; amount: number }[];
}

interface CashflowData {
  period: string;
  inflow: number;
  outflow: number;
  net: number;
  categories: { name: string; amount: number; direction: 'in' | 'out' }[];
}

const budgets: Budget[] = [
  {
    id: 'B001', department: '工程部', year: 2025, totalBudget: 2400000, used: 580000, remaining: 1820000,
    categories: [
      { name: '人力成本', allocated: 1800000, spent: 450000 },
      { name: '云服务', allocated: 300000, spent: 75000 },
      { name: '软件许可', allocated: 200000, spent: 40000 },
      { name: '培训', allocated: 100000, spent: 15000 },
    ],
  },
  {
    id: 'B002', department: '产品部', year: 2025, totalBudget: 1200000, used: 310000, remaining: 890000,
    categories: [
      { name: '人力成本', allocated: 900000, spent: 240000 },
      { name: '用户研究', allocated: 150000, spent: 40000 },
      { name: '设计工具', allocated: 100000, spent: 20000 },
      { name: '差旅', allocated: 50000, spent: 10000 },
    ],
  },
  {
    id: 'B003', department: '市场部', year: 2025, totalBudget: 1600000, used: 520000, remaining: 1080000,
    categories: [
      { name: '人力成本', allocated: 800000, spent: 200000 },
      { name: '广告投放', allocated: 500000, spent: 220000 },
      { name: '活动会展', allocated: 200000, spent: 80000 },
      { name: '内容制作', allocated: 100000, spent: 20000 },
    ],
  },
  {
    id: 'B004', department: '人力行政部', year: 2025, totalBudget: 800000, used: 205000, remaining: 595000,
    categories: [
      { name: '人力成本', allocated: 500000, spent: 130000 },
      { name: '办公用品', allocated: 100000, spent: 25000 },
      { name: '招聘费用', allocated: 120000, spent: 35000 },
      { name: '员工福利', allocated: 80000, spent: 15000 },
    ],
  },
];

const expenses: Expense[] = [
  { id: 'EX001', department: '工程部', applicant: '李娜', category: '差旅', amount: 3500, status: 'approved', submitDate: '2025-01-15', description: '客户现场技术支持差旅', receiptCount: 4 },
  { id: 'EX002', department: '工程部', applicant: '刘洋', category: '软件许可', amount: 12000, status: 'reimbursed', submitDate: '2025-01-10', description: 'JetBrains 全产品年度许可续费', receiptCount: 1 },
  { id: 'EX003', department: '市场部', applicant: '何勇', category: '广告投放', amount: 50000, status: 'pending', submitDate: '2025-01-18', description: 'Q1 搜索引擎广告投放', receiptCount: 2 },
  { id: 'EX004', department: '市场部', applicant: '罗芳', category: '内容制作', amount: 8000, status: 'approved', submitDate: '2025-01-16', description: '产品宣传视频制作', receiptCount: 3 },
  { id: 'EX005', department: '产品部', applicant: '马云飞', category: '设计工具', amount: 5600, status: 'reimbursed', submitDate: '2025-01-08', description: 'Figma 团队版续费', receiptCount: 1 },
  { id: 'EX006', department: '人力行政部', applicant: '唐杰', category: '招聘费用', amount: 15000, status: 'approved', submitDate: '2025-01-12', description: '猎头服务费——高级工程师岗位', receiptCount: 1 },
  { id: 'EX007', department: '工程部', applicant: '陈刚', category: '培训', amount: 4200, status: 'pending', submitDate: '2025-01-19', description: 'React 高级培训课程', receiptCount: 1 },
  { id: 'EX008', department: '产品部', applicant: '郑丽', category: '差旅', amount: 6800, status: 'rejected', submitDate: '2025-01-14', description: '行业峰会参会费用（超出预算）', receiptCount: 5 },
  { id: 'EX009', department: '工程部', applicant: '王强', category: '云服务', amount: 28000, status: 'approved', submitDate: '2025-01-05', description: 'AWS 1 月账单', receiptCount: 1 },
  { id: 'EX010', department: '人力行政部', applicant: '冯磊', category: '办公用品', amount: 3200, status: 'reimbursed', submitDate: '2025-01-06', description: '办公设备采购（显示器×2）', receiptCount: 2 },
  { id: 'EX011', department: '市场部', applicant: '林静', category: '活动会展', amount: 35000, status: 'pending', submitDate: '2025-01-20', description: '春季产品发布会场地及布展', receiptCount: 6 },
  { id: 'EX012', department: '工程部', applicant: '赵敏', category: '培训', amount: 2800, status: 'approved', submitDate: '2025-01-17', description: 'Kubernetes 在线认证考试', receiptCount: 1 },
];

const revenueData: RevenueData[] = [
  {
    period: '2025-01', revenue: 1850000, cost: 1200000, grossProfit: 650000,
    breakdown: [
      { source: 'SaaS 订阅', amount: 1200000 },
      { source: '专业服务', amount: 380000 },
      { source: '培训收入', amount: 120000 },
      { source: '定制开发', amount: 150000 },
    ],
  },
  {
    period: '2024-Q4', revenue: 5200000, cost: 3400000, grossProfit: 1800000,
    breakdown: [
      { source: 'SaaS 订阅', amount: 3400000 },
      { source: '专业服务', amount: 1050000 },
      { source: '培训收入', amount: 320000 },
      { source: '定制开发', amount: 430000 },
    ],
  },
  {
    period: '2024', revenue: 19500000, cost: 12800000, grossProfit: 6700000,
    breakdown: [
      { source: 'SaaS 订阅', amount: 12800000 },
      { source: '专业服务', amount: 3900000 },
      { source: '培训收入', amount: 1200000 },
      { source: '定制开发', amount: 1600000 },
    ],
  },
];

const cashflowData: CashflowData[] = [
  {
    period: '2025-01', inflow: 2100000, outflow: 1650000, net: 450000,
    categories: [
      { name: '客户回款', amount: 1850000, direction: 'in' },
      { name: '投资收益', amount: 250000, direction: 'in' },
      { name: '工资社保', amount: 980000, direction: 'out' },
      { name: '办公租金', amount: 180000, direction: 'out' },
      { name: '云服务费', amount: 120000, direction: 'out' },
      { name: '市场费用', amount: 200000, direction: 'out' },
      { name: '其他运营', amount: 170000, direction: 'out' },
    ],
  },
  {
    period: '2024-Q4', inflow: 5800000, outflow: 4600000, net: 1200000,
    categories: [
      { name: '客户回款', amount: 5200000, direction: 'in' },
      { name: '投资收益', amount: 600000, direction: 'in' },
      { name: '工资社保', amount: 2800000, direction: 'out' },
      { name: '办公租金', amount: 540000, direction: 'out' },
      { name: '云服务费', amount: 350000, direction: 'out' },
      { name: '市场费用', amount: 580000, direction: 'out' },
      { name: '其他运营', amount: 330000, direction: 'out' },
    ],
  },
];

// --- MCP Server ---

const server = new McpServer({
  name: 'finance',
  version: '0.1.0',
});

server.tool(
  'finance_query_budget',
  '查询部门预算信息，包括总预算、已用、剩余及各分类明细',
  {
    department: z.string().optional().describe('部门名称'),
    year: z.number().optional().describe('年份，默认 2025'),
  },
  async ({ department, year }) => {
    const targetYear = year ?? 2025;
    let results = budgets.filter((b) => b.year === targetYear);
    if (department) {
      results = results.filter((b) => b.department === department);
    }
    return {
      content: [
        { type: 'text' as const, text: JSON.stringify({ budgets: results, total: results.length }, null, 2) },
      ],
    };
  },
);

server.tool(
  'finance_list_expenses',
  '查询费用报销记录，支持按部门、状态筛选',
  {
    department: z.string().optional().describe('部门名称'),
    status: z.enum(['pending', 'approved', 'rejected', 'reimbursed']).optional().describe('报销状态'),
    limit: z.number().optional().describe('返回数量限制，默认 20'),
  },
  async ({ department, status, limit }) => {
    let results = [...expenses];
    if (department) {
      results = results.filter((e) => e.department === department);
    }
    if (status) {
      results = results.filter((e) => e.status === status);
    }
    const total = results.length;
    results = results.slice(0, limit ?? 20);
    const totalAmount = results.reduce((sum, e) => sum + e.amount, 0);
    return {
      content: [
        { type: 'text' as const, text: JSON.stringify({ expenses: results, total, totalAmount }, null, 2) },
      ],
    };
  },
);

server.tool(
  'finance_get_revenue',
  '获取收入概览，支持按月度/季度/年度查看',
  {
    period: z.enum(['monthly', 'quarterly', 'yearly']).optional().describe('周期，默认 monthly'),
  },
  async ({ period }) => {
    const p = period ?? 'monthly';
    const periodMap: Record<string, string> = { monthly: '2025-01', quarterly: '2024-Q4', yearly: '2024' };
    const data = revenueData.find((r) => r.period === periodMap[p]);
    if (!data) {
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ error: '无对应周期数据' }) }],
        isError: true,
      };
    }
    const marginRate = ((data.grossProfit / data.revenue) * 100).toFixed(1);
    return {
      content: [
        { type: 'text' as const, text: JSON.stringify({ revenue: data, marginRate: `${marginRate}%` }, null, 2) },
      ],
    };
  },
);

server.tool(
  'finance_get_cashflow',
  '获取现金流概览，包括流入、流出、净额及分类明细',
  {
    period: z.enum(['monthly', 'quarterly']).optional().describe('周期，默认 monthly'),
  },
  async ({ period }) => {
    const p = period ?? 'monthly';
    const periodMap: Record<string, string> = { monthly: '2025-01', quarterly: '2024-Q4' };
    const data = cashflowData.find((c) => c.period === periodMap[p]);
    if (!data) {
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ error: '无对应周期数据' }) }],
        isError: true,
      };
    }
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            period: data.period, inflow: data.inflow, outflow: data.outflow, net: data.net,
            trend: data.net > 0 ? 'positive' : 'negative',
            inflowBreakdown: data.categories.filter((c) => c.direction === 'in'),
            outflowBreakdown: data.categories.filter((c) => c.direction === 'out'),
          }, null, 2),
        },
      ],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);

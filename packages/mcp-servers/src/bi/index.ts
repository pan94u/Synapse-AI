import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// ============================================================
// BI MCP Server — 商业智能
// Mock 数据：KPI 快照、仪表盘聚合数据、报表
// ============================================================

interface KPI {
  id: string;
  name: string;
  department: string;
  category: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'flat';
  changePercent: number;
  period: string;
  status: 'on_track' | 'at_risk' | 'off_track';
}

interface Dashboard {
  id: string;
  name: string;
  description: string;
  owner: string;
  widgets: { id: string; type: string; title: string; data: Record<string, unknown> }[];
  lastUpdated: string;
}

interface ReportResult {
  reportType: string;
  generatedAt: string;
  period: string;
  data: Record<string, unknown>;
}

const kpis: KPI[] = [
  // 公司级
  { id: 'KPI001', name: '月度经常性收入 (MRR)', department: '公司', category: '营收', value: 1850000, target: 2000000, unit: 'CNY', trend: 'up', changePercent: 8.5, period: '2025-01', status: 'at_risk' },
  { id: 'KPI002', name: '年度经常性收入 (ARR)', department: '公司', category: '营收', value: 22200000, target: 24000000, unit: 'CNY', trend: 'up', changePercent: 12.3, period: '2025-01', status: 'on_track' },
  { id: 'KPI003', name: '毛利率', department: '公司', category: '利润', value: 65.2, target: 70, unit: '%', trend: 'down', changePercent: -2.1, period: '2025-01', status: 'at_risk' },
  { id: 'KPI004', name: '净利率', department: '公司', category: '利润', value: 15.8, target: 20, unit: '%', trend: 'flat', changePercent: 0.3, period: '2025-01', status: 'off_track' },
  { id: 'KPI005', name: '客户流失率', department: '公司', category: '客户', value: 3.2, target: 5, unit: '%', trend: 'down', changePercent: -15, period: '2025-01', status: 'on_track' },
  { id: 'KPI006', name: '净推荐值 (NPS)', department: '公司', category: '客户', value: 62, target: 50, unit: '分', trend: 'up', changePercent: 5, period: '2025-01', status: 'on_track' },
  // 工程部
  { id: 'KPI007', name: '部署频率', department: '工程部', category: '效能', value: 12, target: 15, unit: '次/月', trend: 'up', changePercent: 20, period: '2025-01', status: 'at_risk' },
  { id: 'KPI008', name: '变更失败率', department: '工程部', category: '质量', value: 4.2, target: 5, unit: '%', trend: 'down', changePercent: -30, period: '2025-01', status: 'on_track' },
  { id: 'KPI009', name: '平均恢复时间 (MTTR)', department: '工程部', category: '质量', value: 45, target: 60, unit: '分钟', trend: 'down', changePercent: -25, period: '2025-01', status: 'on_track' },
  { id: 'KPI010', name: '代码覆盖率', department: '工程部', category: '质量', value: 82, target: 80, unit: '%', trend: 'up', changePercent: 3, period: '2025-01', status: 'on_track' },
  { id: 'KPI011', name: 'Sprint 完成率', department: '工程部', category: '效能', value: 88, target: 90, unit: '%', trend: 'flat', changePercent: 1, period: '2025-01', status: 'at_risk' },
  // 市场部
  { id: 'KPI012', name: '获客成本 (CAC)', department: '市场部', category: '获客', value: 15000, target: 12000, unit: 'CNY', trend: 'up', changePercent: 8, period: '2025-01', status: 'off_track' },
  { id: 'KPI013', name: '网站月独立访客', department: '市场部', category: '流量', value: 125000, target: 100000, unit: '人', trend: 'up', changePercent: 15, period: '2025-01', status: 'on_track' },
  { id: 'KPI014', name: 'MQL 转 SQL 率', department: '市场部', category: '转化', value: 22, target: 25, unit: '%', trend: 'down', changePercent: -5, period: '2025-01', status: 'at_risk' },
  { id: 'KPI015', name: '内容发布数', department: '市场部', category: '内容', value: 18, target: 20, unit: '篇/月', trend: 'up', changePercent: 12, period: '2025-01', status: 'at_risk' },
  // 产品部
  { id: 'KPI016', name: '功能采纳率', department: '产品部', category: '产品', value: 45, target: 50, unit: '%', trend: 'up', changePercent: 10, period: '2025-01', status: 'at_risk' },
  { id: 'KPI017', name: '用户满意度 (CSAT)', department: '产品部', category: '满意度', value: 4.2, target: 4.0, unit: '/5', trend: 'up', changePercent: 5, period: '2025-01', status: 'on_track' },
  // 人力行政
  { id: 'KPI018', name: '员工满意度', department: '人力行政部', category: '人员', value: 78, target: 80, unit: '%', trend: 'flat', changePercent: 0, period: '2025-01', status: 'at_risk' },
  { id: 'KPI019', name: '招聘完成率', department: '人力行政部', category: '招聘', value: 85, target: 90, unit: '%', trend: 'up', changePercent: 10, period: '2025-01', status: 'at_risk' },
  { id: 'KPI020', name: '人均产出', department: '人力行政部', category: '效能', value: 92500, target: 100000, unit: 'CNY/人/月', trend: 'up', changePercent: 6, period: '2025-01', status: 'at_risk' },
];

const dashboards: Dashboard[] = [
  {
    id: 'DASH001', name: 'CEO 全局看板', description: '公司核心经营指标总览', owner: 'CEO', lastUpdated: '2025-01-20',
    widgets: [
      { id: 'W001', type: 'metric', title: 'MRR', data: { value: 1850000, target: 2000000, trend: 'up' } },
      { id: 'W002', type: 'metric', title: 'ARR', data: { value: 22200000, target: 24000000, trend: 'up' } },
      { id: 'W003', type: 'chart', title: '月度收入趋势', data: { months: ['2024-08', '2024-09', '2024-10', '2024-11', '2024-12', '2025-01'], values: [1520000, 1580000, 1620000, 1700000, 1750000, 1850000] } },
      { id: 'W004', type: 'pie', title: '收入构成', data: { labels: ['SaaS 订阅', '专业服务', '培训', '定制开发'], values: [1200000, 380000, 120000, 150000] } },
      { id: 'W005', type: 'metric', title: '客户总数', data: { value: 28, active: 22, churned: 2, prospect: 6 } },
      { id: 'W006', type: 'metric', title: '员工数', data: { value: 19, active: 18, onLeave: 1 } },
    ],
  },
  {
    id: 'DASH002', name: '销售管线看板', description: '销售漏斗和商机跟踪', owner: '吴涛', lastUpdated: '2025-01-20',
    widgets: [
      { id: 'W007', type: 'funnel', title: '销售漏斗', data: { stages: ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won'], counts: [2, 3, 3, 2, 1], values: [2300000, 8900000, 2900000, 2350000, 1200000] } },
      { id: 'W008', type: 'metric', title: '管线总价值', data: { value: 17650000, weighted: 6765000 } },
      { id: 'W009', type: 'table', title: 'Top 5 商机', data: { items: ['字节跳动 5M', '比亚迪 3M', '华为 2M', '蔚来 1.8M', '阿里 1.5M'] } },
      { id: 'W010', type: 'metric', title: '本月赢单', data: { count: 1, value: 1200000 } },
    ],
  },
  {
    id: 'DASH003', name: '研发效能看板', description: 'DORA 指标和团队效能', owner: '张伟', lastUpdated: '2025-01-20',
    widgets: [
      { id: 'W011', type: 'metric', title: '部署频率', data: { value: 12, target: 15, unit: '次/月' } },
      { id: 'W012', type: 'metric', title: '变更失败率', data: { value: 4.2, target: 5, unit: '%' } },
      { id: 'W013', type: 'metric', title: 'MTTR', data: { value: 45, target: 60, unit: '分钟' } },
      { id: 'W014', type: 'metric', title: '代码覆盖率', data: { value: 82, target: 80, unit: '%' } },
      { id: 'W015', type: 'chart', title: 'Sprint 燃尽图', data: { days: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], planned: [40, 36, 32, 28, 24, 20, 16, 12, 8, 0], actual: [40, 38, 35, 30, 26, 22, 18, 15, 10, 5] } },
    ],
  },
];

const reportTemplates: Record<string, (params: Record<string, string>) => ReportResult> = {
  revenue_summary: (params) => ({
    reportType: 'revenue_summary',
    generatedAt: new Date().toISOString(),
    period: params.period ?? '2025-01',
    data: {
      totalRevenue: 1850000,
      revenueBySource: { 'SaaS 订阅': 1200000, '专业服务': 380000, '培训收入': 120000, '定制开发': 150000 },
      growthRate: '8.5%',
      topCustomers: [
        { name: '华为技术', revenue: 260000 },
        { name: '美团', revenue: 170000 },
        { name: '小米集团', revenue: 125000 },
        { name: 'PingCAP', revenue: 110000 },
        { name: '用友网络', revenue: 100000 },
      ],
      forecast: { nextMonth: 1950000, nextQuarter: 5800000 },
    },
  }),
  department_performance: (params) => ({
    reportType: 'department_performance',
    generatedAt: new Date().toISOString(),
    period: params.period ?? '2025-01',
    data: {
      departments: [
        { name: '工程部', headcount: 8, budgetUsed: '24.2%', kpiScore: 85, highlights: ['MTTR 降至 45 分钟', '代码覆盖率 82%'] },
        { name: '产品部', headcount: 4, budgetUsed: '25.8%', kpiScore: 78, highlights: ['CSAT 4.2/5', '功能采纳率需提升'] },
        { name: '市场部', headcount: 4, budgetUsed: '32.5%', kpiScore: 72, highlights: ['网站流量超标 25%', 'CAC 偏高'] },
        { name: '人力行政部', headcount: 4, budgetUsed: '25.6%', kpiScore: 80, highlights: ['招聘完成率 85%', '员工满意度待提升'] },
      ],
      overallScore: 79,
    },
  }),
  sales_pipeline: (params) => ({
    reportType: 'sales_pipeline',
    generatedAt: new Date().toISOString(),
    period: params.period ?? '2025-01',
    data: {
      totalPipeline: 17650000,
      weightedPipeline: 6765000,
      stageBreakdown: {
        prospecting: { count: 2, value: 2300000 },
        qualification: { count: 3, value: 8900000 },
        proposal: { count: 3, value: 2900000 },
        negotiation: { count: 2, value: 2350000 },
        closed_won: { count: 1, value: 1200000 },
        closed_lost: { count: 1, value: 400000 },
      },
      winRate: '50%',
      avgDealSize: 1470833,
      avgSalesCycle: 95,
    },
  }),
  inventory_health: (params) => ({
    reportType: 'inventory_health',
    generatedAt: new Date().toISOString(),
    period: params.period ?? '2025-01',
    data: {
      totalSKUs: 25,
      totalValue: 12863605,
      lowStockItems: 4,
      overstockItems: 2,
      turnoverRate: 3.2,
      topValueItems: [
        { name: 'AI 推理服务器 A100', value: 3000000 },
        { name: 'AI 推理服务器 H100', value: 2700000 },
        { name: '定制开发工时包（100h）', value: 1200000 },
      ],
    },
  }),
};

// --- MCP Server ---

const server = new McpServer({
  name: 'bi',
  version: '0.1.0',
});

server.tool(
  'bi_query_kpi',
  '查询 KPI 指标，支持按 ID、部门、周期筛选',
  {
    kpiId: z.string().optional().describe('KPI ID'),
    department: z.string().optional().describe('部门名称'),
    period: z.string().optional().describe('周期，如 2025-01'),
  },
  async ({ kpiId, department, period }) => {
    let results = [...kpis];
    if (kpiId) results = results.filter((k) => k.id === kpiId);
    if (department) results = results.filter((k) => k.department === department);
    if (period) results = results.filter((k) => k.period === period);
    const summary = {
      total: results.length,
      onTrack: results.filter((k) => k.status === 'on_track').length,
      atRisk: results.filter((k) => k.status === 'at_risk').length,
      offTrack: results.filter((k) => k.status === 'off_track').length,
    };
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ kpis: results, summary }, null, 2) }],
    };
  },
);

server.tool(
  'bi_get_dashboard',
  '获取仪表盘详情，包括所有组件和数据',
  {
    dashboardId: z.string().describe('仪表盘 ID，如 DASH001'),
  },
  async ({ dashboardId }) => {
    const dashboard = dashboards.find((d) => d.id === dashboardId);
    if (!dashboard) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: `仪表盘 ${dashboardId} 不存在`, available: dashboards.map((d) => ({ id: d.id, name: d.name })) }) }], isError: true };
    }
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ dashboard }, null, 2) }],
    };
  },
);

server.tool(
  'bi_run_report',
  '运行报表，支持 revenue_summary / department_performance / sales_pipeline / inventory_health',
  {
    reportType: z.enum(['revenue_summary', 'department_performance', 'sales_pipeline', 'inventory_health']).describe('报表类型'),
    params: z.record(z.string()).optional().describe('报表参数，如 { "period": "2025-01" }'),
  },
  async ({ reportType, params }) => {
    const generator = reportTemplates[reportType];
    if (!generator) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: `报表类型 ${reportType} 不存在` }) }], isError: true };
    }
    const result = generator(params ?? {});
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ report: result }, null, 2) }],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);

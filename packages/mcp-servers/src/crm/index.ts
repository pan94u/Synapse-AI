import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// ============================================================
// CRM MCP Server — 客户关系管理
// Mock 数据：30 个客户、销售机会、互动记录
// ============================================================

interface Customer {
  id: string;
  name: string;
  industry: string;
  tier: 'enterprise' | 'mid_market' | 'smb';
  status: 'active' | 'churned' | 'prospect';
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  annualRevenue: number;
  employeeCount: number;
  region: string;
  createdAt: string;
  lastContactDate: string;
  tags: string[];
}

interface Opportunity {
  id: string;
  customerId: string;
  title: string;
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  value: number;
  probability: number;
  ownerId: string;
  ownerName: string;
  expectedCloseDate: string;
  createdAt: string;
  product: string;
}

interface Activity {
  id: string;
  customerId: string;
  type: 'call' | 'email' | 'meeting' | 'demo' | 'note';
  content: string;
  createdAt: string;
  createdBy: string;
}

const customers: Customer[] = [
  { id: 'CU001', name: '华为技术有限公司', industry: 'ICT', tier: 'enterprise', status: 'active', contactPerson: '李明', contactEmail: 'liming@huawei.com', contactPhone: '13900000001', annualRevenue: 600000000000, employeeCount: 195000, region: '华南', createdAt: '2023-01-15', lastContactDate: '2025-01-18', tags: ['战略客户', 'AI'] },
  { id: 'CU002', name: '腾讯科技', industry: '互联网', tier: 'enterprise', status: 'active', contactPerson: '王芳', contactEmail: 'wangfang@tencent.com', contactPhone: '13900000002', annualRevenue: 550000000000, employeeCount: 108000, region: '华南', createdAt: '2023-03-20', lastContactDate: '2025-01-15', tags: ['战略客户', '云'] },
  { id: 'CU003', name: '字节跳动', industry: '互联网', tier: 'enterprise', status: 'active', contactPerson: '陈磊', contactEmail: 'chenlei@bytedance.com', contactPhone: '13900000003', annualRevenue: 800000000000, employeeCount: 150000, region: '华北', createdAt: '2023-05-10', lastContactDate: '2025-01-10', tags: ['战略客户', 'AI', '国际化'] },
  { id: 'CU004', name: '阿里巴巴集团', industry: '电商', tier: 'enterprise', status: 'active', contactPerson: '张华', contactEmail: 'zhanghua@alibaba.com', contactPhone: '13900000004', annualRevenue: 900000000000, employeeCount: 235000, region: '华东', createdAt: '2023-02-08', lastContactDate: '2025-01-20', tags: ['战略客户', '云', '电商'] },
  { id: 'CU005', name: '美团', industry: '本地生活', tier: 'enterprise', status: 'active', contactPerson: '刘杰', contactEmail: 'liujie@meituan.com', contactPhone: '13900000005', annualRevenue: 220000000000, employeeCount: 80000, region: '华北', createdAt: '2023-06-15', lastContactDate: '2025-01-12', tags: ['大客户'] },
  { id: 'CU006', name: '京东集团', industry: '电商', tier: 'enterprise', status: 'active', contactPerson: '孙静', contactEmail: 'sunjing@jd.com', contactPhone: '13900000006', annualRevenue: 1000000000000, employeeCount: 550000, region: '华北', createdAt: '2023-04-01', lastContactDate: '2025-01-08', tags: ['大客户', '物流'] },
  { id: 'CU007', name: '网易', industry: '互联网', tier: 'enterprise', status: 'prospect', contactPerson: '赵勇', contactEmail: 'zhaoyong@netease.com', contactPhone: '13900000007', annualRevenue: 100000000000, employeeCount: 30000, region: '华东', createdAt: '2024-08-20', lastContactDate: '2025-01-05', tags: ['游戏', '音乐'] },
  { id: 'CU008', name: '小米集团', industry: '消费电子', tier: 'enterprise', status: 'active', contactPerson: '周涛', contactEmail: 'zhoutao@xiaomi.com', contactPhone: '13900000008', annualRevenue: 270000000000, employeeCount: 32000, region: '华北', createdAt: '2023-07-10', lastContactDate: '2025-01-16', tags: ['IoT', '智能硬件'] },
  { id: 'CU009', name: '比亚迪股份', industry: '汽车', tier: 'enterprise', status: 'prospect', contactPerson: '吴婷', contactEmail: 'wuting@byd.com', contactPhone: '13900000009', annualRevenue: 600000000000, employeeCount: 290000, region: '华南', createdAt: '2024-10-05', lastContactDate: '2025-01-03', tags: ['新能源', '制造'] },
  { id: 'CU010', name: '中兴通讯', industry: 'ICT', tier: 'enterprise', status: 'active', contactPerson: '郑磊', contactEmail: 'zhenglei@zte.com', contactPhone: '13900000010', annualRevenue: 120000000000, employeeCount: 74000, region: '华南', createdAt: '2023-09-15', lastContactDate: '2024-12-20', tags: ['5G', '通信'] },
  { id: 'CU011', name: '用友网络', industry: '企业软件', tier: 'mid_market', status: 'active', contactPerson: '钱浩', contactEmail: 'qianhao@yonyou.com', contactPhone: '13900000011', annualRevenue: 9000000000, employeeCount: 20000, region: '华北', createdAt: '2023-11-01', lastContactDate: '2025-01-14', tags: ['ERP', 'SaaS'] },
  { id: 'CU012', name: '金蝶国际', industry: '企业软件', tier: 'mid_market', status: 'active', contactPerson: '何丽', contactEmail: 'heli@kingdee.com', contactPhone: '13900000012', annualRevenue: 5000000000, employeeCount: 10000, region: '华南', createdAt: '2024-01-20', lastContactDate: '2025-01-11', tags: ['ERP', '云'] },
  { id: 'CU013', name: '明源云', industry: '房地产科技', tier: 'mid_market', status: 'active', contactPerson: '徐明', contactEmail: 'xuming@mingyuanyun.com', contactPhone: '13900000013', annualRevenue: 3000000000, employeeCount: 5000, region: '华南', createdAt: '2024-03-15', lastContactDate: '2025-01-09', tags: ['SaaS', '地产'] },
  { id: 'CU014', name: '深信服科技', industry: '网络安全', tier: 'mid_market', status: 'active', contactPerson: '马强', contactEmail: 'maqiang@sangfor.com', contactPhone: '13900000014', annualRevenue: 8000000000, employeeCount: 9000, region: '华南', createdAt: '2024-02-10', lastContactDate: '2025-01-07', tags: ['安全', '云'] },
  { id: 'CU015', name: '奇安信', industry: '网络安全', tier: 'mid_market', status: 'prospect', contactPerson: '黄涛', contactEmail: 'huangtao@qianxin.com', contactPhone: '13900000015', annualRevenue: 6000000000, employeeCount: 8000, region: '华北', createdAt: '2024-09-01', lastContactDate: '2024-12-15', tags: ['安全'] },
  { id: 'CU016', name: '有赞', industry: '电商', tier: 'mid_market', status: 'churned', contactPerson: '冯磊', contactEmail: 'fenglei@youzan.com', contactPhone: '13900000016', annualRevenue: 1500000000, employeeCount: 3000, region: '华东', createdAt: '2023-08-10', lastContactDate: '2024-08-20', tags: ['SaaS', '电商'] },
  { id: 'CU017', name: 'PingCAP', industry: '数据库', tier: 'mid_market', status: 'active', contactPerson: '杨明', contactEmail: 'yangming@pingcap.com', contactPhone: '13900000017', annualRevenue: 500000000, employeeCount: 800, region: '华北', createdAt: '2024-04-20', lastContactDate: '2025-01-17', tags: ['开源', '数据库'] },
  { id: 'CU018', name: '涛思数据', industry: 'IoT', tier: 'smb', status: 'active', contactPerson: '陶涛', contactEmail: 'taotao@taosdata.com', contactPhone: '13900000018', annualRevenue: 200000000, employeeCount: 300, region: '华北', createdAt: '2024-05-15', lastContactDate: '2025-01-13', tags: ['时序数据库', 'IoT'] },
  { id: 'CU019', name: 'Jina AI', industry: 'AI', tier: 'smb', status: 'active', contactPerson: '韩磊', contactEmail: 'hanlei@jina.ai', contactPhone: '13900000019', annualRevenue: 50000000, employeeCount: 120, region: '华北', createdAt: '2024-06-01', lastContactDate: '2025-01-06', tags: ['AI', '搜索'] },
  { id: 'CU020', name: 'StreamNative', industry: '数据基础设施', tier: 'smb', status: 'active', contactPerson: '翟磊', contactEmail: 'zhailei@streamnative.io', contactPhone: '13900000020', annualRevenue: 100000000, employeeCount: 200, region: '华北', createdAt: '2024-07-10', lastContactDate: '2025-01-04', tags: ['消息队列', '开源'] },
  { id: 'CU021', name: '白鲸开源', industry: '大数据', tier: 'smb', status: 'active', contactPerson: '罗峰', contactEmail: 'luofeng@whaleops.com', contactPhone: '13900000021', annualRevenue: 80000000, employeeCount: 150, region: '华东', createdAt: '2024-08-15', lastContactDate: '2025-01-02', tags: ['调度', '开源'] },
  { id: 'CU022', name: '极狐GitLab', industry: 'DevOps', tier: 'smb', status: 'active', contactPerson: '秦涛', contactEmail: 'qintao@jihulab.com', contactPhone: '13900000022', annualRevenue: 150000000, employeeCount: 250, region: '华北', createdAt: '2024-03-01', lastContactDate: '2025-01-19', tags: ['DevOps', '开源'] },
  { id: 'CU023', name: '思码逸', industry: 'DevOps', tier: 'smb', status: 'prospect', contactPerson: '谢明', contactEmail: 'xieming@merico.dev', contactPhone: '13900000023', annualRevenue: 30000000, employeeCount: 80, region: '华北', createdAt: '2024-11-01', lastContactDate: '2024-12-28', tags: ['研发效能'] },
  { id: 'CU024', name: '云起无垠', industry: '安全', tier: 'smb', status: 'prospect', contactPerson: '许峰', contactEmail: 'xufeng@yunqi.ai', contactPhone: '13900000024', annualRevenue: 20000000, employeeCount: 50, region: '华北', createdAt: '2024-12-01', lastContactDate: '2025-01-15', tags: ['AI安全'] },
  { id: 'CU025', name: '华大九天', industry: 'EDA', tier: 'mid_market', status: 'active', contactPerson: '田宇', contactEmail: 'tianyu@empyrean.com.cn', contactPhone: '13900000025', annualRevenue: 2000000000, employeeCount: 2000, region: '华南', createdAt: '2024-06-20', lastContactDate: '2025-01-08', tags: ['EDA', '半导体'] },
  { id: 'CU026', name: '芯华章', industry: 'EDA', tier: 'smb', status: 'active', contactPerson: '方勇', contactEmail: 'fangyong@x-epic.com', contactPhone: '13900000026', annualRevenue: 300000000, employeeCount: 400, region: '华南', createdAt: '2024-09-10', lastContactDate: '2025-01-12', tags: ['EDA', '验证'] },
  { id: 'CU027', name: '蔚来汽车', industry: '汽车', tier: 'enterprise', status: 'active', contactPerson: '林浩', contactEmail: 'linhao@nio.com', contactPhone: '13900000027', annualRevenue: 55000000000, employeeCount: 32000, region: '华东', createdAt: '2024-01-05', lastContactDate: '2025-01-17', tags: ['新能源', '智能座舱'] },
  { id: 'CU028', name: '理想汽车', industry: '汽车', tier: 'enterprise', status: 'prospect', contactPerson: '杜磊', contactEmail: 'dulei@lixiang.com', contactPhone: '13900000028', annualRevenue: 120000000000, employeeCount: 35000, region: '华北', createdAt: '2024-11-15', lastContactDate: '2025-01-10', tags: ['新能源'] },
  { id: 'CU029', name: '商汤科技', industry: 'AI', tier: 'mid_market', status: 'active', contactPerson: '吕涛', contactEmail: 'lvtao@sensetime.com', contactPhone: '13900000029', annualRevenue: 3000000000, employeeCount: 5000, region: '华东', createdAt: '2024-04-10', lastContactDate: '2025-01-14', tags: ['AI', '计算机视觉'] },
  { id: 'CU030', name: '旷视科技', industry: 'AI', tier: 'mid_market', status: 'churned', contactPerson: '曹峰', contactEmail: 'caofeng@megvii.com', contactPhone: '13900000030', annualRevenue: 2000000000, employeeCount: 3000, region: '华北', createdAt: '2023-10-20', lastContactDate: '2024-07-15', tags: ['AI', '安防'] },
];

const opportunities: Opportunity[] = [
  { id: 'OP001', customerId: 'CU001', title: 'Forge 企业版部署', stage: 'negotiation', value: 2000000, probability: 75, ownerId: 'E009', ownerName: '吴涛', expectedCloseDate: '2025-03-31', createdAt: '2024-10-15', product: 'Forge Enterprise' },
  { id: 'OP002', customerId: 'CU002', title: 'AI 交付平台 POC', stage: 'proposal', value: 500000, probability: 50, ownerId: 'E010', ownerName: '郑丽', expectedCloseDate: '2025-04-15', createdAt: '2024-11-20', product: 'Forge Platform' },
  { id: 'OP003', customerId: 'CU003', title: '全球研发工具标准化', stage: 'qualification', value: 5000000, probability: 30, ownerId: 'E009', ownerName: '吴涛', expectedCloseDate: '2025-06-30', createdAt: '2025-01-05', product: 'Forge Enterprise+' },
  { id: 'OP004', customerId: 'CU004', title: '达摩院 AI 辅助编码', stage: 'prospecting', value: 1500000, probability: 15, ownerId: 'E011', ownerName: '孙浩', expectedCloseDate: '2025-09-30', createdAt: '2025-01-10', product: 'Forge Platform' },
  { id: 'OP005', customerId: 'CU007', title: '网易游戏技术中台', stage: 'prospecting', value: 800000, probability: 10, ownerId: 'E010', ownerName: '郑丽', expectedCloseDate: '2025-08-31', createdAt: '2025-01-12', product: 'Forge Platform' },
  { id: 'OP006', customerId: 'CU009', title: '比亚迪智能制造', stage: 'qualification', value: 3000000, probability: 25, ownerId: 'E009', ownerName: '吴涛', expectedCloseDate: '2025-07-31', createdAt: '2024-12-01', product: 'Forge Enterprise' },
  { id: 'OP007', customerId: 'CU011', title: '用友云原生升级', stage: 'proposal', value: 600000, probability: 60, ownerId: 'E011', ownerName: '孙浩', expectedCloseDate: '2025-03-15', createdAt: '2024-09-20', product: 'Forge Platform' },
  { id: 'OP008', customerId: 'CU008', title: '小米 IoT 平台增强', stage: 'closed_won', value: 1200000, probability: 100, ownerId: 'E009', ownerName: '吴涛', expectedCloseDate: '2025-01-15', createdAt: '2024-08-10', product: 'Forge Enterprise' },
  { id: 'OP009', customerId: 'CU017', title: 'PingCAP 研发效能', stage: 'negotiation', value: 350000, probability: 70, ownerId: 'E010', ownerName: '郑丽', expectedCloseDate: '2025-02-28', createdAt: '2024-11-05', product: 'Forge Platform' },
  { id: 'OP010', customerId: 'CU027', title: '蔚来自动驾驶研发工具', stage: 'proposal', value: 1800000, probability: 45, ownerId: 'E009', ownerName: '吴涛', expectedCloseDate: '2025-05-31', createdAt: '2024-12-15', product: 'Forge Enterprise' },
  { id: 'OP011', customerId: 'CU016', title: '有赞续约', stage: 'closed_lost', value: 400000, probability: 0, ownerId: 'E011', ownerName: '孙浩', expectedCloseDate: '2024-08-31', createdAt: '2024-06-01', product: 'Forge Platform' },
  { id: 'OP012', customerId: 'CU029', title: '商汤 AI 工程化平台', stage: 'qualification', value: 900000, probability: 35, ownerId: 'E010', ownerName: '郑丽', expectedCloseDate: '2025-06-30', createdAt: '2025-01-08', product: 'Forge Platform' },
];

const activities: Activity[] = [
  { id: 'AC001', customerId: 'CU001', type: 'meeting', content: '与华为 IT 部门讨论 Forge 企业版部署方案，确认技术架构和安全要求', createdAt: '2025-01-18', createdBy: '吴涛' },
  { id: 'AC002', customerId: 'CU001', type: 'email', content: '发送定制化报价方案和 ROI 分析报告', createdAt: '2025-01-16', createdBy: '郑丽' },
  { id: 'AC003', customerId: 'CU002', type: 'demo', content: '为腾讯云团队演示 AI 交付闭环，重点展示 SuperAgent + Skill 体系', createdAt: '2025-01-15', createdBy: '吴涛' },
  { id: 'AC004', customerId: 'CU003', type: 'call', content: '与字节跳动技术总监初步沟通全球研发工具标准化需求', createdAt: '2025-01-10', createdBy: '吴涛' },
  { id: 'AC005', customerId: 'CU008', type: 'meeting', content: '小米 IoT 平台项目签约庆祝会，确认实施时间表', createdAt: '2025-01-16', createdBy: '吴涛' },
  { id: 'AC006', customerId: 'CU011', type: 'email', content: '发送用友云原生升级方案更新版，增加容灾设计', createdAt: '2025-01-14', createdBy: '孙浩' },
  { id: 'AC007', customerId: 'CU017', type: 'call', content: '与 PingCAP 确认合同条款，预计月底签约', createdAt: '2025-01-17', createdBy: '郑丽' },
  { id: 'AC008', customerId: 'CU027', type: 'demo', content: '为蔚来展示代码审查和自动化测试能力', createdAt: '2025-01-17', createdBy: '吴涛' },
  { id: 'AC009', customerId: 'CU009', type: 'note', content: '比亚迪项目需等待内部审批流程，预计 2 月有进展', createdAt: '2025-01-03', createdBy: '吴涛' },
  { id: 'AC010', customerId: 'CU022', type: 'meeting', content: '与极狐 GitLab 探讨联合解决方案可能性', createdAt: '2025-01-19', createdBy: '郑丽' },
];

// --- MCP Server ---

const server = new McpServer({
  name: 'crm',
  version: '0.1.0',
});

server.tool(
  'crm_search_customers',
  '搜索客户，支持按名称/行业模糊搜索、等级筛选',
  {
    query: z.string().optional().describe('搜索关键词（公司名称、联系人、标签）'),
    tier: z.enum(['enterprise', 'mid_market', 'smb']).optional().describe('客户等级'),
    industry: z.string().optional().describe('行业'),
  },
  async ({ query, tier, industry }) => {
    let results = [...customers];
    if (query) {
      const q = query.toLowerCase();
      results = results.filter(
        (c) => c.name.toLowerCase().includes(q) || c.contactPerson.toLowerCase().includes(q) || c.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    if (tier) results = results.filter((c) => c.tier === tier);
    if (industry) results = results.filter((c) => c.industry === industry);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ customers: results, total: results.length }, null, 2) }],
    };
  },
);

server.tool(
  'crm_get_customer',
  '获取客户详情，包括基本信息、最近活动和相关商机',
  {
    customerId: z.string().describe('客户 ID，如 CU001'),
  },
  async ({ customerId }) => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: `客户 ${customerId} 不存在` }) }], isError: true };
    }
    const recentActivities = activities.filter((a) => a.customerId === customerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
    const customerOpps = opportunities.filter((o) => o.customerId === customerId);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ customer, recentActivities, opportunities: customerOpps }, null, 2) }],
    };
  },
);

server.tool(
  'crm_list_opportunities',
  '查询销售管线，支持按阶段和负责人筛选',
  {
    stage: z.enum(['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).optional().describe('销售阶段'),
    ownerId: z.string().optional().describe('负责人员工 ID'),
  },
  async ({ stage, ownerId }) => {
    let results = [...opportunities];
    if (stage) results = results.filter((o) => o.stage === stage);
    if (ownerId) results = results.filter((o) => o.ownerId === ownerId);
    const totalValue = results.reduce((sum, o) => sum + o.value, 0);
    const weightedValue = results.reduce((sum, o) => sum + o.value * (o.probability / 100), 0);
    const enriched = results.map((o) => {
      const customer = customers.find((c) => c.id === o.customerId);
      return { ...o, customerName: customer?.name ?? '未知' };
    });
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ opportunities: enriched, total: enriched.length, totalValue, weightedValue: Math.round(weightedValue) }, null, 2) }],
    };
  },
);

server.tool(
  'crm_log_activity',
  '为客户记录一条互动活动（通话、邮件、会议、演示、备注）',
  {
    customerId: z.string().describe('客户 ID'),
    type: z.enum(['call', 'email', 'meeting', 'demo', 'note']).describe('活动类型'),
    content: z.string().describe('活动内容描述'),
  },
  async ({ customerId, type, content }) => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: `客户 ${customerId} 不存在` }) }], isError: true };
    }
    const newActivity: Activity = {
      id: `AC${String(activities.length + 1).padStart(3, '0')}`,
      customerId,
      type,
      content,
      createdAt: new Date().toISOString().split('T')[0],
      createdBy: '当前用户',
    };
    activities.push(newActivity);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ activity: newActivity, message: '活动记录已创建' }, null, 2) }],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);

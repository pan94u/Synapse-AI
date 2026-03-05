import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// ============================================================
// Legal MCP Server — 法务合同管理
// Mock 数据：15 份合同、合规检查记录、审批流
// ============================================================

interface Contract {
  id: string;
  title: string;
  type: 'service' | 'nda' | 'employment' | 'procurement' | 'partnership' | 'license';
  counterparty: string;
  status: 'draft' | 'under_review' | 'active' | 'expired' | 'terminated';
  amount: number;
  currency: string;
  startDate: string;
  endDate: string;
  signDate: string | null;
  owner: string;
  keyTerms: string[];
  renewalType: 'auto' | 'manual' | 'none';
}

interface ComplianceCheck {
  id: string;
  area: string;
  title: string;
  status: 'pass' | 'fail' | 'warning' | 'pending';
  lastChecked: string;
  details: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface Approval {
  id: string;
  type: string;
  title: string;
  applicant: string;
  status: 'pending' | 'approved' | 'rejected';
  submitDate: string;
  reviewers: { name: string; decision: 'pending' | 'approved' | 'rejected'; comment?: string }[];
  relatedContractId?: string;
}

const contracts: Contract[] = [
  { id: 'C001', title: '云服务托管协议', type: 'service', counterparty: '阿里云计算有限公司', status: 'active', amount: 360000, currency: 'CNY', startDate: '2024-01-01', endDate: '2025-12-31', signDate: '2023-12-15', owner: '刘洋', keyTerms: ['SLA 99.95%', '数据本地化', '30天通知期'], renewalType: 'auto' },
  { id: 'C002', title: '办公场地租赁合同', type: 'service', counterparty: '万科物业管理', status: 'active', amount: 2160000, currency: 'CNY', startDate: '2023-07-01', endDate: '2026-06-30', signDate: '2023-06-20', owner: '冯磊', keyTerms: ['3年锁定期', '年递增5%', '免租期2个月'], renewalType: 'manual' },
  { id: 'C003', title: '保密协议（甲方模板）', type: 'nda', counterparty: '星辰科技有限公司', status: 'active', amount: 0, currency: 'CNY', startDate: '2024-06-01', endDate: '2027-05-31', signDate: '2024-05-28', owner: '张伟', keyTerms: ['3年保密期', '违约金50万', '竞业限制'], renewalType: 'none' },
  { id: 'C004', title: '高级工程师劳动合同', type: 'employment', counterparty: '李娜', status: 'active', amount: 420000, currency: 'CNY', startDate: '2020-06-01', endDate: '2026-05-31', signDate: '2020-05-25', owner: '唐杰', keyTerms: ['无固定期限候选', '竞业补偿30%', '6个月试用期'], renewalType: 'auto' },
  { id: 'C005', title: 'JetBrains 软件许可协议', type: 'license', counterparty: 'JetBrains s.r.o.', status: 'active', amount: 120000, currency: 'CNY', startDate: '2025-01-01', endDate: '2025-12-31', signDate: '2024-12-20', owner: '刘洋', keyTerms: ['10个席位', '全产品套装', '自动续费'], renewalType: 'auto' },
  { id: 'C006', title: '猎头服务框架协议', type: 'service', counterparty: '锐仕方达人才', status: 'active', amount: 200000, currency: 'CNY', startDate: '2024-07-01', endDate: '2025-06-30', signDate: '2024-06-25', owner: '唐杰', keyTerms: ['佣金比例20%', '保证期90天', '独家猎聘'], renewalType: 'manual' },
  { id: 'C007', title: '数据处理协议 (DPA)', type: 'service', counterparty: '腾讯云计算', status: 'active', amount: 0, currency: 'CNY', startDate: '2024-03-01', endDate: '2026-02-28', signDate: '2024-02-20', owner: '张伟', keyTerms: ['GDPR 合规', '数据删除30天', '安全审计权'], renewalType: 'auto' },
  { id: 'C008', title: '市场推广服务合同', type: 'service', counterparty: '蓝色光标数字营销', status: 'active', amount: 500000, currency: 'CNY', startDate: '2025-01-01', endDate: '2025-06-30', signDate: '2024-12-18', owner: '林静', keyTerms: ['KPI绑定付款', '月度报告', '知识产权归属'], renewalType: 'manual' },
  { id: 'C009', title: '战略合作框架协议', type: 'partnership', counterparty: '华为技术有限公司', status: 'under_review', amount: 0, currency: 'CNY', startDate: '2025-03-01', endDate: '2028-02-28', signDate: null, owner: '吴涛', keyTerms: ['联合解决方案', '渠道合作', '技术共享'], renewalType: 'manual' },
  { id: 'C010', title: 'IT 外包服务合同', type: 'service', counterparty: '中软国际', status: 'draft', amount: 480000, currency: 'CNY', startDate: '2025-04-01', endDate: '2026-03-31', signDate: null, owner: '张伟', keyTerms: ['4名外包人员', '现场办公', '月结'], renewalType: 'manual' },
  { id: 'C011', title: '保密协议（乙方模板）', type: 'nda', counterparty: '银河数据科技', status: 'expired', amount: 0, currency: 'CNY', startDate: '2022-01-01', endDate: '2024-12-31', signDate: '2021-12-20', owner: '张伟', keyTerms: ['3年保密期', '信息范围限定'], renewalType: 'none' },
  { id: 'C012', title: '服务器硬件采购合同', type: 'procurement', counterparty: '戴尔科技', status: 'active', amount: 850000, currency: 'CNY', startDate: '2024-09-01', endDate: '2027-08-31', signDate: '2024-08-25', owner: '刘洋', keyTerms: ['3年保修', '次日上门', '分期付款'], renewalType: 'none' },
  { id: 'C013', title: 'Figma 企业版许可', type: 'license', counterparty: 'Figma, Inc.', status: 'active', amount: 56000, currency: 'CNY', startDate: '2025-01-01', endDate: '2025-12-31', signDate: '2024-12-10', owner: '马云飞', keyTerms: ['5个编辑席位', '无限查看', 'SSO集成'], renewalType: 'auto' },
  { id: 'C014', title: '信息安全咨询合同', type: 'service', counterparty: '安恒信息技术', status: 'terminated', amount: 150000, currency: 'CNY', startDate: '2024-01-01', endDate: '2024-12-31', signDate: '2023-12-28', owner: '张伟', keyTerms: ['渗透测试', '漏洞报告', '90天修复期'], renewalType: 'none' },
  { id: 'C015', title: 'AWS 企业支持计划', type: 'service', counterparty: 'Amazon Web Services', status: 'active', amount: 180000, currency: 'CNY', startDate: '2025-01-01', endDate: '2025-12-31', signDate: '2024-12-22', owner: '刘洋', keyTerms: ['24/7技术支持', 'TAM服务', '15分钟响应'], renewalType: 'auto' },
];

const complianceChecks: ComplianceCheck[] = [
  { id: 'CC001', area: '数据隐私', title: '个人信息保护法 (PIPL) 合规', status: 'pass', lastChecked: '2025-01-15', details: '数据处理协议已签署，用户同意机制已上线', severity: 'high' },
  { id: 'CC002', area: '数据隐私', title: 'GDPR 数据主体权利', status: 'warning', lastChecked: '2025-01-15', details: '数据删除流程需优化，当前需 15 个工作日（要求 30 天内）', severity: 'medium' },
  { id: 'CC003', area: '信息安全', title: '等保 2.0 三级', status: 'pass', lastChecked: '2024-12-01', details: '年度评估通过，有效期至 2025-11-30', severity: 'critical' },
  { id: 'CC004', area: '信息安全', title: '漏洞扫描', status: 'fail', lastChecked: '2025-01-18', details: '发现 2 个高危漏洞（Log4j 残留依赖、SSL 证书即将过期）', severity: 'critical' },
  { id: 'CC005', area: '知识产权', title: '开源许可证合规', status: 'warning', lastChecked: '2025-01-10', details: '3 个依赖使用 AGPL 许可证，需评估是否合规', severity: 'medium' },
  { id: 'CC006', area: '知识产权', title: '商标注册', status: 'pass', lastChecked: '2025-01-05', details: 'Forge 商标已注册（第 9/42 类），有效期至 2033 年', severity: 'low' },
  { id: 'CC007', area: '劳动合规', title: '劳动合同签署率', status: 'pass', lastChecked: '2025-01-20', details: '在职员工 100% 已签署劳动合同', severity: 'high' },
  { id: 'CC008', area: '劳动合规', title: '社保公积金', status: 'pass', lastChecked: '2025-01-20', details: '全员足额缴纳，无遗漏', severity: 'high' },
  { id: 'CC009', area: '财务合规', title: '发票管理', status: 'pending', lastChecked: '2025-01-01', details: 'Q1 发票核查尚未开始', severity: 'medium' },
  { id: 'CC010', area: '财务合规', title: '反洗钱筛查', status: 'pass', lastChecked: '2025-01-12', details: '所有合作方已通过反洗钱/制裁名单筛查', severity: 'high' },
];

const approvals: Approval[] = [
  {
    id: 'AP001', type: '合同审批', title: '战略合作框架协议 — 华为', applicant: '吴涛', status: 'pending', submitDate: '2025-01-18', relatedContractId: 'C009',
    reviewers: [
      { name: '张伟', decision: 'approved', comment: '技术条款无异议' },
      { name: '林静', decision: 'approved', comment: '市场合作价值大' },
      { name: '韩梅', decision: 'pending' },
    ],
  },
  {
    id: 'AP002', type: '合同审批', title: 'IT 外包服务合同 — 中软国际', applicant: '张伟', status: 'pending', submitDate: '2025-01-19', relatedContractId: 'C010',
    reviewers: [
      { name: '韩梅', decision: 'approved', comment: '人力编制符合' },
      { name: '吴涛', decision: 'pending' },
    ],
  },
  {
    id: 'AP003', type: '合规豁免', title: 'AGPL 开源组件使用申请', applicant: '王强', status: 'pending', submitDate: '2025-01-17',
    reviewers: [
      { name: '张伟', decision: 'pending' },
      { name: '韩梅', decision: 'pending' },
    ],
  },
  {
    id: 'AP004', type: '合同审批', title: '市场推广服务合同续签', applicant: '林静', status: 'approved', submitDate: '2025-01-10',
    reviewers: [
      { name: '吴涛', decision: 'approved', comment: 'ROI 达标' },
      { name: '韩梅', decision: 'approved', comment: '预算充足' },
    ],
  },
  {
    id: 'AP005', type: '数据出境', title: 'AWS 美国区域数据存储申请', applicant: '刘洋', status: 'rejected', submitDate: '2025-01-08',
    reviewers: [
      { name: '张伟', decision: 'rejected', comment: '需先完成数据出境安全评估' },
    ],
  },
];

// --- MCP Server ---

const server = new McpServer({
  name: 'legal',
  version: '0.1.0',
});

server.tool(
  'legal_search_contracts',
  '搜索合同，支持按关键词、状态、类型筛选',
  {
    query: z.string().optional().describe('搜索关键词（标题、对方名称）'),
    status: z.enum(['draft', 'under_review', 'active', 'expired', 'terminated']).optional().describe('合同状态'),
    type: z.enum(['service', 'nda', 'employment', 'procurement', 'partnership', 'license']).optional().describe('合同类型'),
  },
  async ({ query, status, type }) => {
    let results = [...contracts];
    if (query) {
      const q = query.toLowerCase();
      results = results.filter((c) => c.title.toLowerCase().includes(q) || c.counterparty.toLowerCase().includes(q));
    }
    if (status) results = results.filter((c) => c.status === status);
    if (type) results = results.filter((c) => c.type === type);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ contracts: results, total: results.length }, null, 2) }],
    };
  },
);

server.tool(
  'legal_get_contract',
  '获取指定合同的详细信息',
  {
    contractId: z.string().describe('合同 ID，如 C001'),
  },
  async ({ contractId }) => {
    const contract = contracts.find((c) => c.id === contractId);
    if (!contract) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: `合同 ${contractId} 不存在` }) }], isError: true };
    }
    const relatedApprovals = approvals.filter((a) => a.relatedContractId === contractId);
    const daysToExpiry = Math.ceil((new Date(contract.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ contract, daysToExpiry, relatedApprovals }, null, 2) }],
    };
  },
);

server.tool(
  'legal_check_compliance',
  '查询合规检查状态，可按领域筛选',
  {
    area: z.string().optional().describe('合规领域（数据隐私、信息安全、知识产权、劳动合规、财务合规）'),
  },
  async ({ area }) => {
    let checks = [...complianceChecks];
    if (area) checks = checks.filter((c) => c.area === area);
    const issues = checks.filter((c) => c.status === 'fail' || c.status === 'warning');
    const summary = {
      total: checks.length,
      pass: checks.filter((c) => c.status === 'pass').length,
      fail: checks.filter((c) => c.status === 'fail').length,
      warning: checks.filter((c) => c.status === 'warning').length,
      pending: checks.filter((c) => c.status === 'pending').length,
    };
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ checks, issues, summary }, null, 2) }],
    };
  },
);

server.tool(
  'legal_list_approvals',
  '查询审批列表，支持按状态筛选',
  {
    status: z.enum(['pending', 'approved', 'rejected']).optional().describe('审批状态'),
  },
  async ({ status }) => {
    let results = [...approvals];
    if (status) results = results.filter((a) => a.status === status);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ approvals: results, total: results.length }, null, 2) }],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);

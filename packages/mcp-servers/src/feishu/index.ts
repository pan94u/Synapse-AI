import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// ============================================================
// Feishu MCP Server — 飞书协作
// Mock 数据：消息记录、日历事件、审批单
// ============================================================

interface Message {
  id: string;
  chatId: string;
  chatName: string;
  senderId: string;
  senderName: string;
  msgType: 'text' | 'image' | 'file' | 'card';
  content: string;
  sentAt: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  organizer: string;
  attendees: string[];
  startTime: string;
  endTime: string;
  location: string;
  description: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
  isAllDay: boolean;
  recurrence?: string;
}

interface ApprovalInstance {
  id: string;
  templateId: string;
  templateName: string;
  applicant: string;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  createdAt: string;
  updatedAt: string;
  formData: Record<string, unknown>;
  approvers: { name: string; status: 'pending' | 'approved' | 'rejected'; comment?: string; decidedAt?: string }[];
}

const chats = [
  { id: 'CHAT001', name: '全员群', type: 'group', memberCount: 20 },
  { id: 'CHAT002', name: '工程部群', type: 'group', memberCount: 8 },
  { id: 'CHAT003', name: '产品部群', type: 'group', memberCount: 4 },
  { id: 'CHAT004', name: '管理层群', type: 'group', memberCount: 5 },
  { id: 'CHAT005', name: 'Forge v2 项目群', type: 'group', memberCount: 10 },
  { id: 'CHAT006', name: '值班告警群', type: 'group', memberCount: 6 },
];

const messages: Message[] = [
  { id: 'MSG001', chatId: 'CHAT001', chatName: '全员群', senderId: 'E017', senderName: '韩梅', msgType: 'text', content: '各位同事，本月全员大会定在周五下午 3 点，请大家准时参加', sentAt: '2025-01-20 09:00:00' },
  { id: 'MSG002', chatId: 'CHAT001', chatName: '全员群', senderId: 'E009', senderName: '吴涛', msgType: 'text', content: '好的，会准时参加', sentAt: '2025-01-20 09:05:00' },
  { id: 'MSG003', chatId: 'CHAT002', chatName: '工程部群', senderId: 'E001', senderName: '张伟', msgType: 'text', content: 'Forge v2.1 版本今天发布，大家注意监控告警', sentAt: '2025-01-20 10:00:00' },
  { id: 'MSG004', chatId: 'CHAT002', chatName: '工程部群', senderId: 'E006', senderName: '刘洋', msgType: 'text', content: '部署流水线已启动，预计 30 分钟完成', sentAt: '2025-01-20 10:05:00' },
  { id: 'MSG005', chatId: 'CHAT002', chatName: '工程部群', senderId: 'E006', senderName: '刘洋', msgType: 'text', content: '部署完成，所有健康检查通过 ✓', sentAt: '2025-01-20 10:32:00' },
  { id: 'MSG006', chatId: 'CHAT005', chatName: 'Forge v2 项目群', senderId: 'E009', senderName: '吴涛', msgType: 'text', content: '华为那边确认了企业版技术方案，需要在 2 月底前完成定制化部署', sentAt: '2025-01-20 11:00:00' },
  { id: 'MSG007', chatId: 'CHAT005', chatName: 'Forge v2 项目群', senderId: 'E001', senderName: '张伟', msgType: 'text', content: '收到，我来评估技术工时，明天给排期', sentAt: '2025-01-20 11:10:00' },
  { id: 'MSG008', chatId: 'CHAT006', chatName: '值班告警群', senderId: 'E006', senderName: '刘洋', msgType: 'card', content: '[告警] CPU 使用率超过 80%，节点: prod-worker-03，时间: 14:23', sentAt: '2025-01-20 14:23:00' },
  { id: 'MSG009', chatId: 'CHAT006', chatName: '值班告警群', senderId: 'E002', senderName: '李娜', msgType: 'text', content: '正在排查，疑似批量任务导致', sentAt: '2025-01-20 14:25:00' },
  { id: 'MSG010', chatId: 'CHAT006', chatName: '值班告警群', senderId: 'E002', senderName: '李娜', msgType: 'text', content: '已定位，是定时数据同步任务堆积，已手动清理队列并重启 worker', sentAt: '2025-01-20 14:45:00' },
  { id: 'MSG011', chatId: 'CHAT004', chatName: '管理层群', senderId: 'E013', senderName: '林静', msgType: 'text', content: '春季产品发布会场地已确认，3 月 15 日在深圳万象城，预算 35 万', sentAt: '2025-01-20 15:00:00' },
  { id: 'MSG012', chatId: 'CHAT003', chatName: '产品部群', senderId: 'E010', senderName: '郑丽', msgType: 'text', content: 'v2.2 需求文档已更新到飞书文档，请大家评审', sentAt: '2025-01-20 16:00:00' },
];

const calendarEvents: CalendarEvent[] = [
  { id: 'EVT001', title: '全员月度大会', organizer: '韩梅', attendees: ['全员'], startTime: '2025-01-24 15:00', endTime: '2025-01-24 16:30', location: '大会议室', description: '1月经营数据通报 + 2月规划', status: 'confirmed', isAllDay: false },
  { id: 'EVT002', title: '工程部周会', organizer: '张伟', attendees: ['张伟', '李娜', '王强', '赵敏', '陈刚', '刘洋', '黄磊', '周芳'], startTime: '2025-01-21 10:00', endTime: '2025-01-21 11:00', location: '会议室 A', description: 'Sprint Review + 下周计划', status: 'confirmed', isAllDay: false, recurrence: '每周二' },
  { id: 'EVT003', title: '产品需求评审', organizer: '吴涛', attendees: ['吴涛', '郑丽', '孙浩', '张伟', '李娜'], startTime: '2025-01-22 14:00', endTime: '2025-01-22 16:00', location: '会议室 B', description: 'v2.2 需求评审', status: 'confirmed', isAllDay: false },
  { id: 'EVT004', title: '华为技术方案评审', organizer: '吴涛', attendees: ['吴涛', '张伟', '李娜', '刘洋'], startTime: '2025-01-23 09:30', endTime: '2025-01-23 11:30', location: '会议室 A + 线上', description: '华为企业版部署方案技术评审', status: 'confirmed', isAllDay: false },
  { id: 'EVT005', title: '管理层季度复盘', organizer: '韩梅', attendees: ['张伟', '吴涛', '林静', '韩梅'], startTime: '2025-01-25 09:00', endTime: '2025-01-25 12:00', location: '大会议室', description: 'Q4 复盘 + Q1 规划', status: 'confirmed', isAllDay: false },
  { id: 'EVT006', title: '候选人终面 — 高级后端工程师', organizer: '唐杰', attendees: ['唐杰', '张伟', '李娜'], startTime: '2025-01-22 10:00', endTime: '2025-01-22 11:00', location: '面试间', description: '终面候选人：陈某某，5 年 Go/Java 经验', status: 'confirmed', isAllDay: false },
  { id: 'EVT007', title: '腾讯 POC Demo', organizer: '吴涛', attendees: ['吴涛', '郑丽', '张伟'], startTime: '2025-01-24 10:00', endTime: '2025-01-24 11:30', location: '线上（腾讯会议）', description: '为腾讯云团队演示 AI 交付平台 POC', status: 'tentative', isAllDay: false },
  { id: 'EVT008', title: '春节假期', organizer: '韩梅', attendees: ['全员'], startTime: '2025-01-28', endTime: '2025-02-04', location: '', description: '春节假期，1月28日至2月4日', status: 'confirmed', isAllDay: true },
];

const approvalInstances: ApprovalInstance[] = [
  {
    id: 'APPR001', templateId: 'TPL_LEAVE', templateName: '请假审批', applicant: '黄磊', status: 'approved', createdAt: '2025-01-18 09:00', updatedAt: '2025-01-18 10:30',
    formData: { type: '病假', startDate: '2025-01-20', endDate: '2025-01-21', days: 2, reason: '感冒发烧' },
    approvers: [{ name: '张伟', status: 'approved', comment: '注意休息', decidedAt: '2025-01-18 10:30' }],
  },
  {
    id: 'APPR002', templateId: 'TPL_EXPENSE', templateName: '费用报销', applicant: '何勇', status: 'pending', createdAt: '2025-01-18 14:00', updatedAt: '2025-01-18 14:00',
    formData: { category: '广告投放', amount: 50000, description: 'Q1 搜索引擎广告投放', receipts: 2 },
    approvers: [{ name: '林静', status: 'pending' }, { name: '韩梅', status: 'pending' }],
  },
  {
    id: 'APPR003', templateId: 'TPL_PROCUREMENT', templateName: '采购审批', applicant: '刘洋', status: 'approved', createdAt: '2025-01-15 11:00', updatedAt: '2025-01-16 09:00',
    formData: { items: 'AI 推理服务器 A100 × 5', supplier: '戴尔科技', amount: 1160000, reason: '客户项目扩容需求' },
    approvers: [{ name: '张伟', status: 'approved', comment: '项目需求确认', decidedAt: '2025-01-15 15:00' }, { name: '韩梅', status: 'approved', comment: '预算充足', decidedAt: '2025-01-16 09:00' }],
  },
  {
    id: 'APPR004', templateId: 'TPL_LEAVE', templateName: '请假审批', applicant: '孙浩', status: 'approved', createdAt: '2025-01-20 08:00', updatedAt: '2025-01-20 09:00',
    formData: { type: '事假', startDate: '2025-01-22', endDate: '2025-01-22', days: 1, reason: '办理证件' },
    approvers: [{ name: '吴涛', status: 'approved', comment: '同意', decidedAt: '2025-01-20 09:00' }],
  },
  {
    id: 'APPR005', templateId: 'TPL_EXPENSE', templateName: '费用报销', applicant: '林静', status: 'pending', createdAt: '2025-01-20 10:00', updatedAt: '2025-01-20 10:00',
    formData: { category: '活动会展', amount: 35000, description: '春季产品发布会场地及布展', receipts: 6 },
    approvers: [{ name: '韩梅', status: 'pending' }],
  },
  {
    id: 'APPR006', templateId: 'TPL_CONTRACT', templateName: '合同审批', applicant: '吴涛', status: 'pending', createdAt: '2025-01-18 16:00', updatedAt: '2025-01-19 11:00',
    formData: { contractTitle: '战略合作框架协议', counterparty: '华为技术有限公司', amount: 0, type: '战略合作' },
    approvers: [{ name: '张伟', status: 'approved', comment: '技术条款无异议', decidedAt: '2025-01-19 10:00' }, { name: '林静', status: 'approved', comment: '市场合作价值大', decidedAt: '2025-01-19 11:00' }, { name: '韩梅', status: 'pending' }],
  },
];

const approvalTemplates = [
  { id: 'TPL_LEAVE', name: '请假审批', fields: ['type', 'startDate', 'endDate', 'days', 'reason'] },
  { id: 'TPL_EXPENSE', name: '费用报销', fields: ['category', 'amount', 'description', 'receipts'] },
  { id: 'TPL_PROCUREMENT', name: '采购审批', fields: ['items', 'supplier', 'amount', 'reason'] },
  { id: 'TPL_CONTRACT', name: '合同审批', fields: ['contractTitle', 'counterparty', 'amount', 'type'] },
  { id: 'TPL_OVERTIME', name: '加班申请', fields: ['date', 'hours', 'reason', 'project'] },
];

// --- MCP Server ---

const server = new McpServer({
  name: 'feishu',
  version: '0.1.0',
});

server.tool(
  'feishu_send_message',
  '向飞书群组发送消息',
  {
    chatId: z.string().describe('群组 ID，如 CHAT001'),
    content: z.string().describe('消息内容'),
    msgType: z.enum(['text', 'card']).optional().describe('消息类型，默认 text'),
  },
  async ({ chatId, content, msgType }) => {
    const chat = chats.find((c) => c.id === chatId);
    if (!chat) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: `群组 ${chatId} 不存在`, availableChats: chats.map((c) => ({ id: c.id, name: c.name })) }) }], isError: true };
    }
    const newMsg: Message = {
      id: `MSG${String(messages.length + 1).padStart(3, '0')}`,
      chatId,
      chatName: chat.name,
      senderId: 'SYSTEM',
      senderName: 'Synapse AI',
      msgType: msgType ?? 'text',
      content,
      sentAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    messages.push(newMsg);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ messageId: newMsg.id, sentAt: newMsg.sentAt, chatName: chat.name }, null, 2) }],
    };
  },
);

server.tool(
  'feishu_list_calendar',
  '查询日历事件，支持按用户和日期范围筛选',
  {
    userId: z.string().optional().describe('用户姓名，筛选参与的事件'),
    dateFrom: z.string().optional().describe('开始日期，格式 YYYY-MM-DD'),
    dateTo: z.string().optional().describe('结束日期，格式 YYYY-MM-DD'),
  },
  async ({ userId, dateFrom, dateTo }) => {
    let events = [...calendarEvents];
    if (userId) {
      events = events.filter((e) => e.organizer === userId || e.attendees.includes(userId) || e.attendees.includes('全员'));
    }
    if (dateFrom) {
      events = events.filter((e) => e.startTime.slice(0, 10) >= dateFrom);
    }
    if (dateTo) {
      events = events.filter((e) => e.startTime.slice(0, 10) <= dateTo);
    }
    events.sort((a, b) => a.startTime.localeCompare(b.startTime));
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ events, total: events.length }, null, 2) }],
    };
  },
);

server.tool(
  'feishu_create_approval',
  '发起飞书审批流程',
  {
    templateId: z.string().describe('审批模板 ID，如 TPL_LEAVE'),
    formData: z.record(z.unknown()).describe('表单数据，JSON 对象'),
  },
  async ({ templateId, formData }) => {
    const template = approvalTemplates.find((t) => t.id === templateId);
    if (!template) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: `审批模板 ${templateId} 不存在`, availableTemplates: approvalTemplates.map((t) => ({ id: t.id, name: t.name })) }) }], isError: true };
    }
    const newApproval: ApprovalInstance = {
      id: `APPR${String(approvalInstances.length + 1).padStart(3, '0')}`,
      templateId,
      templateName: template.name,
      applicant: '当前用户',
      status: 'pending',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      formData: formData as Record<string, unknown>,
      approvers: [{ name: '待分配', status: 'pending' }],
    };
    approvalInstances.push(newApproval);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ approvalId: newApproval.id, status: newApproval.status, templateName: template.name }, null, 2) }],
    };
  },
);

server.tool(
  'feishu_get_approval',
  '查看审批单详情',
  {
    approvalId: z.string().describe('审批单 ID，如 APPR001'),
  },
  async ({ approvalId }) => {
    const approval = approvalInstances.find((a) => a.id === approvalId);
    if (!approval) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: `审批单 ${approvalId} 不存在` }) }], isError: true };
    }
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ approval }, null, 2) }],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);

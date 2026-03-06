import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// ============================================================
// Feishu MCP Server — 飞书协作
// 真实 API 模式 + Mock 降级（无凭证时自动启用）
// ============================================================

// --- 配置 ---

const FEISHU_APP_ID = process.env.FEISHU_APP_ID ?? '';
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET ?? '';
const useMock = !FEISHU_APP_ID || !FEISHU_APP_SECRET;

if (useMock) {
  console.warn('[feishu] FEISHU_APP_ID / FEISHU_APP_SECRET 未配置，使用 Mock 模式');
} else {
  console.log('[feishu] 真实 API 模式已启用');
}

// ============================================================
// 飞书 API Client
// ============================================================

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function fetchTenantToken(): Promise<string> {
  const res = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: FEISHU_APP_ID, app_secret: FEISHU_APP_SECRET }),
  });
  if (!res.ok) {
    throw new Error(`[feishu] 获取 tenant_access_token 失败: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { tenant_access_token: string; expire: number };
  if (!data.tenant_access_token) {
    throw new Error(`[feishu] tenant_access_token 响应异常: ${JSON.stringify(data)}`);
  }
  cachedToken = data.tenant_access_token;
  // expire 单位秒（通常 7200），提前 5 分钟刷新
  tokenExpiresAt = Date.now() + (data.expire - 300) * 1000;
  return cachedToken;
}

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;
  return fetchTenantToken();
}

async function feishuGet(path: string): Promise<unknown> {
  let token = await getToken();
  let res = await fetch(`https://open.feishu.cn${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (res.status === 401) {
    token = await fetchTenantToken();
    res = await fetch(`https://open.feishu.cn${path}`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`[feishu] GET ${path} → ${res.status}: ${body}`);
  }
  return res.json();
}

async function feishuPost(path: string, body: unknown): Promise<unknown> {
  let token = await getToken();
  let res = await fetch(`https://open.feishu.cn${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (res.status === 401) {
    token = await fetchTenantToken();
    res = await fetch(`https://open.feishu.cn${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[feishu] POST ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

// ============================================================
// Mock 数据
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

const mockDocs = [
  { id: 'DOC001', title: 'v2.2 需求文档', owner: '郑丽', url: 'https://docs.feishu.cn/wiki/DOC001', content: '## v2.2 需求概述\n\n### 功能一：多租户权限\n支持按部门分级管控...\n\n### 功能二：审批流自定义\n管理员可自定义审批节点...' },
  { id: 'DOC002', title: '华为企业版技术方案', owner: '张伟', url: 'https://docs.feishu.cn/wiki/DOC002', content: '## 华为企业版部署方案\n\n### 架构选型\n私有化部署，K8s 集群...\n\n### 数据隔离\n租户级数据库隔离...' },
  { id: 'DOC003', title: 'Q1 OKR', owner: '韩梅', url: 'https://docs.feishu.cn/wiki/DOC003', content: '## 2025 Q1 OKR\n\nO1: 营收增长 30%\n  KR1: 签约 5 个大客户\n  KR2: ARR 突破 2000 万\n\nO2: 产品竞争力\n  KR1: v2.2 发布\n  KR2: NPS > 50' },
  { id: 'DOC004', title: 'API 设计规范', owner: '李娜', url: 'https://docs.feishu.cn/wiki/DOC004', content: '## API 设计规范\n\n### 命名\n- RESTful 风格\n- 路径小写，连字符分隔\n\n### 认证\n- Bearer Token\n- OAuth 2.0' },
];

// ============================================================
// Helper: 统一返回
// ============================================================

function ok(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

function err(msg: string, extra?: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg, ...extra as object }) }], isError: true };
}

// ============================================================
// MCP Server
// ============================================================

const server = new McpServer({
  name: 'feishu',
  version: '0.2.0',
});

// ----------------------------------------------------------
// 1. send_message — 发送消息 (聚合后: feishu_send_message)
// ----------------------------------------------------------
server.tool(
  'send_message',
  '向飞书群组发送消息（文本或富文本卡片）',
  {
    chatId: z.string().describe('群组 chat_id（真实模式为飞书 open chat_id，Mock 模式如 CHAT001）'),
    content: z.string().describe('消息内容（text 模式为纯文本，card 模式为 JSON 卡片模板）'),
    msgType: z.enum(['text', 'interactive']).optional().describe('消息类型，默认 text'),
  },
  async ({ chatId, content, msgType }) => {
    if (useMock) {
      const chat = chats.find((c) => c.id === chatId);
      if (!chat) return err(`群组 ${chatId} 不存在`, { availableChats: chats.map((c) => ({ id: c.id, name: c.name })) });
      const newMsg: Message = {
        id: `MSG${String(messages.length + 1).padStart(3, '0')}`,
        chatId, chatName: chat.name, senderId: 'SYSTEM', senderName: 'Synapse AI',
        msgType: (msgType === 'interactive' ? 'card' : msgType) ?? 'text',
        content, sentAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      };
      messages.push(newMsg);
      return ok({ messageId: newMsg.id, sentAt: newMsg.sentAt, chatName: chat.name, mode: 'mock' });
    }

    const type = msgType ?? 'text';
    const body = type === 'text'
      ? { receive_id: chatId, msg_type: 'text', content: JSON.stringify({ text: content }) }
      : { receive_id: chatId, msg_type: 'interactive', content };
    const data = await feishuPost('/open-apis/im/v1/messages?receive_id_type=chat_id', body);
    return ok(data);
  },
);

// ----------------------------------------------------------
// 2. list_messages — 查询群聊历史消息 (聚合后: feishu_list_messages)
// ----------------------------------------------------------
server.tool(
  'list_messages',
  '查询飞书群聊历史消息',
  {
    chatId: z.string().describe('群组 chat_id'),
    pageSize: z.number().optional().describe('每页条数，默认 20，最大 50'),
    pageToken: z.string().optional().describe('分页 token'),
  },
  async ({ chatId, pageSize, pageToken }) => {
    if (useMock) {
      const filtered = messages.filter((m) => m.chatId === chatId);
      if (filtered.length === 0) return err(`群组 ${chatId} 无消息`, { availableChats: chats.map((c) => ({ id: c.id, name: c.name })) });
      return ok({ messages: filtered, total: filtered.length, mode: 'mock' });
    }

    const params = new URLSearchParams({ container_id_type: 'chat', container_id: chatId });
    if (pageSize) params.set('page_size', String(pageSize));
    if (pageToken) params.set('page_token', pageToken);
    const data = await feishuGet(`/open-apis/im/v1/messages?${params}`);
    return ok(data);
  },
);

// ----------------------------------------------------------
// 3. list_calendar — 查询日历事件 (聚合后: feishu_list_calendar)
// ----------------------------------------------------------
server.tool(
  'list_calendar',
  '查询日历事件，支持按日期范围筛选',
  {
    calendarId: z.string().optional().describe('日历 ID（真实模式必填，Mock 模式可选）'),
    startTime: z.string().optional().describe('开始时间 YYYY-MM-DD 或 Unix 时间戳'),
    endTime: z.string().optional().describe('结束时间 YYYY-MM-DD 或 Unix 时间戳'),
    userId: z.string().optional().describe('[Mock] 用户姓名，筛选参与的事件'),
  },
  async ({ calendarId, startTime, endTime, userId }) => {
    if (useMock) {
      let events = [...calendarEvents];
      if (userId) {
        events = events.filter((e) => e.organizer === userId || e.attendees.includes(userId) || e.attendees.includes('全员'));
      }
      if (startTime) events = events.filter((e) => e.startTime.slice(0, 10) >= startTime);
      if (endTime) events = events.filter((e) => e.startTime.slice(0, 10) <= endTime);
      events.sort((a, b) => a.startTime.localeCompare(b.startTime));
      return ok({ events, total: events.length, mode: 'mock' });
    }

    if (!calendarId) return err('真实模式下 calendarId 为必填');
    const params = new URLSearchParams({ page_size: '50' });
    if (startTime) params.set('start_time', toUnix(startTime));
    if (endTime) params.set('end_time', toUnix(endTime));
    const data = await feishuGet(`/open-apis/calendar/v4/calendars/${calendarId}/events?${params}`);
    return ok(data);
  },
);

// ----------------------------------------------------------
// 4. create_event — 创建日历事件 (聚合后: feishu_create_event)
// ----------------------------------------------------------
server.tool(
  'create_event',
  '在飞书日历创建事件',
  {
    calendarId: z.string().optional().describe('日历 ID（真实模式必填，Mock 模式可选）'),
    summary: z.string().describe('事件标题'),
    startTime: z.string().describe('开始时间，格式 YYYY-MM-DD HH:mm 或 ISO 8601'),
    endTime: z.string().describe('结束时间，格式 YYYY-MM-DD HH:mm 或 ISO 8601'),
    description: z.string().optional().describe('事件描述'),
    location: z.string().optional().describe('地点'),
    attendees: z.array(z.string()).optional().describe('参与者（真实模式为 open_id 数组，Mock 模式为姓名数组）'),
  },
  async ({ calendarId, summary, startTime, endTime, description, location, attendees }) => {
    if (useMock) {
      const newEvt: CalendarEvent = {
        id: `EVT${String(calendarEvents.length + 1).padStart(3, '0')}`,
        title: summary, organizer: '当前用户', attendees: attendees ?? [],
        startTime, endTime, location: location ?? '', description: description ?? '',
        status: 'confirmed', isAllDay: false,
      };
      calendarEvents.push(newEvt);
      return ok({ eventId: newEvt.id, summary, startTime, endTime, mode: 'mock' });
    }

    if (!calendarId) return err('真实模式下 calendarId 为必填');
    const body: Record<string, unknown> = {
      summary,
      start_time: { timestamp: toUnix(startTime) },
      end_time: { timestamp: toUnix(endTime) },
    };
    if (description) body.description = description;
    if (location) body.location = { name: location };

    // Step 1: 创建事件
    const data = (await feishuPost(`/open-apis/calendar/v4/calendars/${calendarId}/events`, body)) as { data?: { event?: { event_id?: string } } };
    const eventId = data?.data?.event?.event_id;

    // Step 2: 单独添加参与者（飞书不支持创建时直接带 attendees）
    if (attendees?.length && eventId) {
      const attendeeBody = { attendees: attendees.map((id) => ({ type: 'user', user_id: id })) };
      await feishuPost(`/open-apis/calendar/v4/calendars/${calendarId}/events/${eventId}/attendees?user_id_type=open_id`, attendeeBody);
    }

    return ok(data);
  },
);

// ----------------------------------------------------------
// 5. create_approval — 发起审批 (聚合后: feishu_create_approval)
// ----------------------------------------------------------
server.tool(
  'create_approval',
  '发起飞书审批流程',
  {
    approvalCode: z.string().describe('审批定义 code（真实模式为飞书审批定义 code，Mock 模式为 TPL_LEAVE 等）'),
    formData: z.string().describe('表单数据 JSON 字符串（真实模式需符合飞书审批表单格式）'),
    userId: z.string().optional().describe('[真实模式] 申请人 open_id'),
  },
  async ({ approvalCode, formData, userId }) => {
    if (useMock) {
      const template = approvalTemplates.find((t) => t.id === approvalCode);
      if (!template) return err(`审批模板 ${approvalCode} 不存在`, { availableTemplates: approvalTemplates.map((t) => ({ id: t.id, name: t.name })) });
      let parsed: Record<string, unknown>;
      try { parsed = JSON.parse(formData); } catch { return err('formData 不是有效 JSON'); }
      const newApproval: ApprovalInstance = {
        id: `APPR${String(approvalInstances.length + 1).padStart(3, '0')}`,
        templateId: approvalCode, templateName: template.name, applicant: '当前用户',
        status: 'pending',
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        formData: parsed, approvers: [{ name: '待分配', status: 'pending' }],
      };
      approvalInstances.push(newApproval);
      return ok({ approvalId: newApproval.id, status: 'pending', templateName: template.name, mode: 'mock' });
    }

    const body: Record<string, unknown> = {
      approval_code: approvalCode,
      form: formData,
    };
    if (userId) body.user_id = userId;
    const data = await feishuPost('/open-apis/approval/v4/instances', body);
    return ok(data);
  },
);

// ----------------------------------------------------------
// 6. get_approval — 查看审批单 (聚合后: feishu_get_approval)
// ----------------------------------------------------------
server.tool(
  'get_approval',
  '查看审批单详情',
  {
    instanceId: z.string().describe('审批实例 ID（Mock 模式如 APPR001）'),
  },
  async ({ instanceId }) => {
    if (useMock) {
      const approval = approvalInstances.find((a) => a.id === instanceId);
      if (!approval) return err(`审批单 ${instanceId} 不存在`);
      return ok({ approval, mode: 'mock' });
    }

    const data = await feishuGet(`/open-apis/approval/v4/instances/${instanceId}`);
    return ok(data);
  },
);

// ----------------------------------------------------------
// 7. read_doc — 读取文档内容 (聚合后: feishu_read_doc)
// ----------------------------------------------------------
server.tool(
  'read_doc',
  '读取飞书文档内容（按 block 返回）',
  {
    documentId: z.string().describe('文档 ID（Mock 模式如 DOC001）'),
  },
  async ({ documentId }) => {
    if (useMock) {
      const doc = mockDocs.find((d) => d.id === documentId);
      if (!doc) return err(`文档 ${documentId} 不存在`, { availableDocs: mockDocs.map((d) => ({ id: d.id, title: d.title })) });
      return ok({ documentId: doc.id, title: doc.title, content: doc.content, mode: 'mock' });
    }

    const data = await feishuGet(`/open-apis/docx/v1/documents/${documentId}/blocks`);
    return ok(data);
  },
);

// ----------------------------------------------------------
// 8. search_docs — 搜索文档 (聚合后: feishu_search_docs)
// ----------------------------------------------------------
server.tool(
  'search_docs',
  '搜索飞书云文档',
  {
    query: z.string().describe('搜索关键词'),
    count: z.number().optional().describe('返回数量，默认 10'),
    ownerIds: z.array(z.string()).optional().describe('[真实模式] 文档所有者 open_id 数组'),
  },
  async ({ query, count, ownerIds }) => {
    if (useMock) {
      const q = query.toLowerCase();
      const results = mockDocs.filter((d) => d.title.toLowerCase().includes(q) || d.content.toLowerCase().includes(q));
      return ok({ results: results.map((d) => ({ id: d.id, title: d.title, owner: d.owner, url: d.url })), total: results.length, mode: 'mock' });
    }

    const body: Record<string, unknown> = {
      search_key: query,
      count: count ?? 10,
      docs_token_list: [],
    };
    if (ownerIds?.length) body.owner_ids = ownerIds;
    const data = await feishuPost('/open-apis/suite/docs-api/search/object', body);
    return ok(data);
  },
);

// ============================================================
// 工具函数
// ============================================================

/** 将 YYYY-MM-DD 或 YYYY-MM-DD HH:mm 转为 Unix 秒字符串（强制按 Asia/Shanghai 解析） */
function toUnix(dateStr: string): string {
  // 如果已经是纯数字（Unix 时间戳），直接返回
  if (/^\d+$/.test(dateStr)) return dateStr;

  // 如果没有时区标识，附加 +08:00（北京时间）
  let isoStr = dateStr.replace(' ', 'T');
  if (!/[Z+-]\d{2}/.test(isoStr)) {
    isoStr += '+08:00';
  }
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return dateStr;
  return String(Math.floor(d.getTime() / 1000));
}

// ============================================================
// 启动
// ============================================================

const transport = new StdioServerTransport();
await server.connect(transport);

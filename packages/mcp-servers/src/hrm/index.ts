import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// ============================================================
// HRM MCP Server — 人力资源管理
// Mock 数据：20 名员工、4 个部门、考勤/请假记录
// ============================================================

interface Employee {
  id: string;
  name: string;
  department: string;
  position: string;
  email: string;
  phone: string;
  hireDate: string;
  status: 'active' | 'on_leave' | 'resigned';
  managerId: string | null;
  salary: number;
}

interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  type: 'normal' | 'late' | 'early_leave' | 'absent' | 'leave' | 'overtime';
  leaveType?: 'annual' | 'sick' | 'personal' | 'maternity';
  checkIn?: string;
  checkOut?: string;
  hours: number;
  note?: string;
}

interface Department {
  id: string;
  name: string;
  managerId: string;
  headcount: number;
  budget: number;
}

const departments: Department[] = [
  { id: 'D001', name: '工程部', managerId: 'E001', headcount: 8, budget: 2400000 },
  { id: 'D002', name: '产品部', managerId: 'E009', headcount: 4, budget: 1200000 },
  { id: 'D003', name: '市场部', managerId: 'E013', headcount: 4, budget: 1600000 },
  { id: 'D004', name: '人力行政部', managerId: 'E017', headcount: 4, budget: 800000 },
];

const employees: Employee[] = [
  { id: 'E001', name: '张伟', department: '工程部', position: '技术总监', email: 'zhang.wei@example.com', phone: '13800000001', hireDate: '2020-03-15', status: 'active', managerId: null, salary: 45000 },
  { id: 'E002', name: '李娜', department: '工程部', position: '高级后端工程师', email: 'li.na@example.com', phone: '13800000002', hireDate: '2020-06-01', status: 'active', managerId: 'E001', salary: 35000 },
  { id: 'E003', name: '王强', department: '工程部', position: '高级前端工程师', email: 'wang.qiang@example.com', phone: '13800000003', hireDate: '2020-08-20', status: 'active', managerId: 'E001', salary: 33000 },
  { id: 'E004', name: '赵敏', department: '工程部', position: '后端工程师', email: 'zhao.min@example.com', phone: '13800000004', hireDate: '2021-02-14', status: 'active', managerId: 'E002', salary: 25000 },
  { id: 'E005', name: '陈刚', department: '工程部', position: '前端工程师', email: 'chen.gang@example.com', phone: '13800000005', hireDate: '2021-05-10', status: 'active', managerId: 'E003', salary: 24000 },
  { id: 'E006', name: '刘洋', department: '工程部', position: 'DevOps 工程师', email: 'liu.yang@example.com', phone: '13800000006', hireDate: '2021-07-01', status: 'active', managerId: 'E001', salary: 30000 },
  { id: 'E007', name: '黄磊', department: '工程部', position: 'QA 工程师', email: 'huang.lei@example.com', phone: '13800000007', hireDate: '2022-01-10', status: 'on_leave', managerId: 'E001', salary: 22000 },
  { id: 'E008', name: '周芳', department: '工程部', position: '初级工程师', email: 'zhou.fang@example.com', phone: '13800000008', hireDate: '2023-06-15', status: 'active', managerId: 'E002', salary: 18000 },
  { id: 'E009', name: '吴涛', department: '产品部', position: '产品总监', email: 'wu.tao@example.com', phone: '13800000009', hireDate: '2020-04-01', status: 'active', managerId: null, salary: 40000 },
  { id: 'E010', name: '郑丽', department: '产品部', position: '高级产品经理', email: 'zheng.li@example.com', phone: '13800000010', hireDate: '2020-09-15', status: 'active', managerId: 'E009', salary: 32000 },
  { id: 'E011', name: '孙浩', department: '产品部', position: '产品经理', email: 'sun.hao@example.com', phone: '13800000011', hireDate: '2021-11-01', status: 'active', managerId: 'E009', salary: 26000 },
  { id: 'E012', name: '马云飞', department: '产品部', position: 'UI 设计师', email: 'ma.yunfei@example.com', phone: '13800000012', hireDate: '2022-03-20', status: 'active', managerId: 'E010', salary: 23000 },
  { id: 'E013', name: '林静', department: '市场部', position: '市场总监', email: 'lin.jing@example.com', phone: '13800000013', hireDate: '2020-05-01', status: 'active', managerId: null, salary: 38000 },
  { id: 'E014', name: '何勇', department: '市场部', position: '市场经理', email: 'he.yong@example.com', phone: '13800000014', hireDate: '2021-01-15', status: 'active', managerId: 'E013', salary: 28000 },
  { id: 'E015', name: '罗芳', department: '市场部', position: '内容运营', email: 'luo.fang@example.com', phone: '13800000015', hireDate: '2022-06-01', status: 'active', managerId: 'E014', salary: 20000 },
  { id: 'E016', name: '谢鹏', department: '市场部', position: '增长专员', email: 'xie.peng@example.com', phone: '13800000016', hireDate: '2023-02-20', status: 'resigned', managerId: 'E014', salary: 18000 },
  { id: 'E017', name: '韩梅', department: '人力行政部', position: 'HRD', email: 'han.mei@example.com', phone: '13800000017', hireDate: '2020-03-01', status: 'active', managerId: null, salary: 36000 },
  { id: 'E018', name: '唐杰', department: '人力行政部', position: 'HRBP', email: 'tang.jie@example.com', phone: '13800000018', hireDate: '2021-04-10', status: 'active', managerId: 'E017', salary: 25000 },
  { id: 'E019', name: '许瑶', department: '人力行政部', position: '薪酬专员', email: 'xu.yao@example.com', phone: '13800000019', hireDate: '2022-08-01', status: 'active', managerId: 'E017', salary: 20000 },
  { id: 'E020', name: '冯磊', department: '人力行政部', position: '行政专员', email: 'feng.lei@example.com', phone: '13800000020', hireDate: '2023-01-05', status: 'active', managerId: 'E017', salary: 16000 },
];

const attendanceRecords: AttendanceRecord[] = [
  { id: 'A001', employeeId: 'E001', date: '2025-01-20', type: 'normal', checkIn: '08:55', checkOut: '18:30', hours: 9.5 },
  { id: 'A002', employeeId: 'E002', date: '2025-01-20', type: 'normal', checkIn: '09:00', checkOut: '18:00', hours: 9 },
  { id: 'A003', employeeId: 'E003', date: '2025-01-20', type: 'late', checkIn: '09:35', checkOut: '18:30', hours: 9, note: '地铁故障' },
  { id: 'A004', employeeId: 'E004', date: '2025-01-20', type: 'normal', checkIn: '08:50', checkOut: '18:10', hours: 9.3 },
  { id: 'A005', employeeId: 'E007', date: '2025-01-20', type: 'leave', leaveType: 'sick', hours: 0, note: '感冒发烧' },
  { id: 'A006', employeeId: 'E005', date: '2025-01-20', type: 'overtime', checkIn: '09:00', checkOut: '21:30', hours: 12.5, note: '版本发布' },
  { id: 'A007', employeeId: 'E001', date: '2025-01-21', type: 'normal', checkIn: '08:50', checkOut: '18:15', hours: 9.4 },
  { id: 'A008', employeeId: 'E002', date: '2025-01-21', type: 'normal', checkIn: '09:05', checkOut: '18:30', hours: 9.4 },
  { id: 'A009', employeeId: 'E003', date: '2025-01-21', type: 'normal', checkIn: '08:58', checkOut: '18:00', hours: 9 },
  { id: 'A010', employeeId: 'E007', date: '2025-01-21', type: 'leave', leaveType: 'sick', hours: 0, note: '感冒发烧（续）' },
  { id: 'A011', employeeId: 'E009', date: '2025-01-20', type: 'normal', checkIn: '09:10', checkOut: '19:00', hours: 9.8 },
  { id: 'A012', employeeId: 'E010', date: '2025-01-20', type: 'leave', leaveType: 'annual', hours: 0, note: '年假' },
  { id: 'A013', employeeId: 'E013', date: '2025-01-20', type: 'normal', checkIn: '08:45', checkOut: '18:00', hours: 9.25 },
  { id: 'A014', employeeId: 'E014', date: '2025-01-20', type: 'early_leave', checkIn: '09:00', checkOut: '16:30', hours: 7.5, note: '孩子放学' },
  { id: 'A015', employeeId: 'E017', date: '2025-01-20', type: 'normal', checkIn: '08:30', checkOut: '18:00', hours: 9.5 },
  { id: 'A016', employeeId: 'E006', date: '2025-01-22', type: 'overtime', checkIn: '09:00', checkOut: '23:00', hours: 14, note: '服务器迁移' },
  { id: 'A017', employeeId: 'E011', date: '2025-01-22', type: 'leave', leaveType: 'personal', hours: 0, note: '办理证件' },
  { id: 'A018', employeeId: 'E015', date: '2025-01-22', type: 'normal', checkIn: '09:00', checkOut: '18:00', hours: 9 },
  { id: 'A019', employeeId: 'E018', date: '2025-01-22', type: 'normal', checkIn: '08:55', checkOut: '18:05', hours: 9.2 },
  { id: 'A020', employeeId: 'E020', date: '2025-01-22', type: 'late', checkIn: '09:45', checkOut: '18:30', hours: 8.75, note: '堵车' },
];

// --- MCP Server ---

const server = new McpServer({
  name: 'hrm',
  version: '0.1.0',
});

server.tool(
  'hrm_search_employees',
  '搜索员工信息，支持按姓名/工号模糊搜索、部门筛选、状态筛选',
  {
    query: z.string().optional().describe('搜索关键词（姓名、工号、邮箱）'),
    department: z.string().optional().describe('部门名称筛选'),
    status: z.enum(['active', 'on_leave', 'resigned']).optional().describe('员工状态'),
  },
  async ({ query, department, status }) => {
    let results = [...employees];
    if (query) {
      const q = query.toLowerCase();
      results = results.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.id.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q),
      );
    }
    if (department) {
      results = results.filter((e) => e.department === department);
    }
    if (status) {
      results = results.filter((e) => e.status === status);
    }
    return {
      content: [
        { type: 'text' as const, text: JSON.stringify({ employees: results, total: results.length }, null, 2) },
      ],
    };
  },
);

server.tool(
  'hrm_get_employee',
  '获取指定员工的详细信息，包括基本资料、部门、上级、下属',
  {
    employeeId: z.string().describe('员工 ID，如 E001'),
  },
  async ({ employeeId }) => {
    const employee = employees.find((e) => e.id === employeeId);
    if (!employee) {
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ error: `员工 ${employeeId} 不存在` }) }],
        isError: true,
      };
    }
    const manager = employee.managerId ? employees.find((e) => e.id === employee.managerId) : null;
    const directReports = employees.filter((e) => e.managerId === employeeId);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            employee,
            manager: manager ? { id: manager.id, name: manager.name, position: manager.position } : null,
            directReports: directReports.map((r) => ({ id: r.id, name: r.name, position: r.position })),
          }, null, 2),
        },
      ],
    };
  },
);

server.tool(
  'hrm_get_org_chart',
  '获取组织架构信息，包括各部门人数、负责人、预算',
  {
    department: z.string().optional().describe('指定部门名称，不传返回全部'),
  },
  async ({ department }) => {
    let depts = [...departments];
    if (department) {
      depts = depts.filter((d) => d.name === department);
    }
    const result = depts.map((d) => {
      const manager = employees.find((e) => e.id === d.managerId);
      const members = employees.filter((e) => e.department === d.name && e.status !== 'resigned');
      return {
        ...d,
        managerName: manager?.name ?? '未知',
        activeHeadcount: members.length,
        members: members.map((m) => ({ id: m.id, name: m.name, position: m.position, status: m.status })),
      };
    });
    const totalHeadcount = result.reduce((sum, d) => sum + d.activeHeadcount, 0);
    return {
      content: [
        { type: 'text' as const, text: JSON.stringify({ departments: result, totalHeadcount }, null, 2) },
      ],
    };
  },
);

server.tool(
  'hrm_query_attendance',
  '查询考勤和请假记录，支持按员工、月份、类型筛选',
  {
    employeeId: z.string().optional().describe('员工 ID'),
    month: z.string().optional().describe('月份，格式 YYYY-MM'),
    type: z.enum(['normal', 'late', 'early_leave', 'absent', 'leave', 'overtime']).optional().describe('考勤类型'),
  },
  async ({ employeeId, month, type }) => {
    let records = [...attendanceRecords];
    if (employeeId) {
      records = records.filter((r) => r.employeeId === employeeId);
    }
    if (month) {
      records = records.filter((r) => r.date.startsWith(month));
    }
    if (type) {
      records = records.filter((r) => r.type === type);
    }
    const enriched = records.map((r) => {
      const emp = employees.find((e) => e.id === r.employeeId);
      return { ...r, employeeName: emp?.name ?? '未知' };
    });
    return {
      content: [
        { type: 'text' as const, text: JSON.stringify({ records: enriched, total: enriched.length }, null, 2) },
      ],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);

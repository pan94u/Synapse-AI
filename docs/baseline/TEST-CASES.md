# Synapse AI — 测试用例集 (Test Cases)

> 结构化的验收测试用例，覆盖全部已实现 Phase。每个 Phase 结束后更新。
> 最后更新: 2026-03-05 | Session 13 (上下架审核引擎) 完成后
> 测试方法: 运行时验证（curl + Bun server）+ 编译验证（tsc --noEmit / turbo build）+ 前端构建验证

---

## 测试总览

| Phase | 模块 | 编译测试 | 运行时测试 | 合计 | 通过率 |
|-------|------|---------|-----------|------|--------|
| Phase 1 | Monorepo + Model Router + Chat | 1 | 3 | 4 | 100% |
| Phase 2 | Tool System + Agent Loop | 1 | 4 | 5 | 100% |
| Phase 3 | MCP Hub + Servers + Agent 集成 | 4 | 14 | 18 | 100% |
| Phase 4 | 角色画像 + 合规引擎 | 1 | 19 | 20 | 100% |
| Phase 5 | 记忆系统 (Org + Personal + Knowledge) | 6 | 33 | 39 | 100% |
| Phase 6 | 主动智能 (Cron + Event + Threshold) | 6 | 9 | 15 | 100% |
| Phase 6.5 | 决策智能 (Metric + Insight + Strategy) | 5 | 19 | 24 | 100% |
| Phase 7 | Skill 系统 (解析+注册+执行+历史) | 3 | 12 | 15 | 100% |
| Phase 7.5 | Skill Marketplace (发布+评分+安装) | 2 | 19 | 21 | 100% |
| Phase 9 | 浏览器自动化 + MCP Server Stubs | 3 | 5 | 8 | 100% |
| Phase 10 | Web UI (10 页面 + ~40 组件) | 4 | 6 | 10 | 100% |
| Session 13 | 上下架审核引擎 (5 态 + 评分 + 审核队列) | 1 | 10 | 11 | 100% |
| **合计** | | **37** | **153** | **190** | **100%** |

**启动命令**:
```bash
# 从 monorepo 根目录启动（重要：不要用 bun run --filter）
DATABASE_PATH=/tmp/test-synapse.sqlite bun run packages/server/src/index.ts

# curl 注意事项
# 若有 http_proxy 设置，需添加 --noproxy localhost
# LLM 端点需 --max-time 120（默认 Bun.serve idleTimeout 10s）
```

---

## Phase 1 — Monorepo + Model Router + 流式 Chat

### TC-1.1 编译验证

| ID | 测试项 | 命令 | 预期 | 状态 |
|----|--------|------|------|------|
| TC-1.1.1 | 类型检查通过 | `bun run typecheck` | 3/3 packages 通过 | ✅ |

### TC-1.2 运行时验证

| ID | 测试项 | 命令 | 预期 | 状态 |
|----|--------|------|------|------|
| TC-1.2.1 | 健康检查 | `GET /health` | `{"status":"ok"}` | ✅ |
| TC-1.2.2 | 非流式 Chat | `POST /api/chat` (stream:false) | 返回 ChatResponse JSON | ✅ |
| TC-1.2.3 | 流式 Chat (SSE) | `POST /api/chat` (stream:true) | 逐块返回 data: + `[DONE]` | ✅ |

---

## Phase 2 — Tool System + Agent Tool Loop

### TC-2.1 编译验证

| ID | 测试项 | 命令 | 预期 | 状态 |
|----|--------|------|------|------|
| TC-2.1.1 | 类型检查通过 | `bun run typecheck` | 3/3 packages 通过 | ✅ |

### TC-2.2 运行时验证

| ID | 测试项 | 命令 | 预期 | 状态 |
|----|--------|------|------|------|
| TC-2.2.1 | Agent 纯文本 | `POST /api/agent "Say hello"` | 正常回复，toolCallsExecuted: 0 | ✅ |
| TC-2.2.2 | Agent file_read | `POST /api/agent "读取 package.json"` | tool_call → file_read → 返回文件内容 | ✅ |
| TC-2.2.3 | Agent shell_exec | `POST /api/agent "执行 ls"` | tool_call → shell_exec → 命令输出 | ✅ |
| TC-2.2.4 | SSE 流式 + tool loop | `POST /api/agent` (stream) | text → tool_call → tool_result → text → done | ✅ |

---

## Phase 3 — MCP Hub + Database/HTTP-API Servers

### TC-3.1 编译验证

| ID | 测试项 | 命令 | 预期 | 状态 |
|----|--------|------|------|------|
| TC-3.1.1 | 类型检查通过 | `bun run typecheck` | 5/5 packages 通过 | ✅ |
| TC-3.1.2 | 依赖安装 | `bun install` | 156 packages，含 @modelcontextprotocol/sdk | ✅ |
| TC-3.1.3 | SQLite 类型安全 | `tsc --noEmit` mcp-servers | unknown[] → 联合类型修复 | ✅ |
| TC-3.1.4 | 依赖拓扑 | 检查 package.json | shared → agent-core, mcp-hub → server; mcp-servers 独立 | ✅ |

### TC-3.2 运行时验证

| ID | 测试项 | 命令 | 预期 | 状态 |
|----|--------|------|------|------|
| TC-3.2.1 | 服务启动 | 启动日志 | Hub 加载 1 个 enabled server, database connected with 3 tools | ✅ |
| TC-3.2.2 | 健康检查 | `GET /health` | `{"status":"ok"}` | ✅ |
| TC-3.2.3 | MCP Server 列表 | `GET /api/mcp/servers` | database status: connected, 3 tools, metrics 正常 | ✅ |
| TC-3.2.4 | 单个 Server 详情 | `GET /api/mcp/servers/database` | 完整状态含 connectedAt, lastHealthCheck, tools, metrics | ✅ |
| TC-3.2.5 | Server 不存在 | `GET /api/mcp/servers/nonexistent` | 404 `{"error":"Server \"nonexistent\" not found"}` | ✅ |
| TC-3.2.6 | MCP 工具列表 | `GET /api/mcp/tools` | 3 个工具: database_db_query(always), database_db_execute(ask), database_db_list_tables(always) | ✅ |
| TC-3.2.7 | 重启 Server | `POST /api/mcp/servers/database/restart` | `success: true`, 重新连接, 新 connectedAt | ✅ |
| TC-3.2.8 | 审计日志（空） | `GET /api/mcp/audit` | `{"entries":[]}` | ✅ |
| TC-3.2.9 | Agent 纯文本 | `POST /api/agent "Say hello"` | 纯文本回复, toolCallsExecuted: 0 | ✅ |
| TC-3.2.10 | Agent 查表 | `POST /api/agent "List all tables"` | tool_call → db_list_tables → "empty database", toolCallsExecuted: 1 | ✅ |
| TC-3.2.11 | Agent 建表+插入+查询 | `POST /api/agent "Create employees..."` | 3 次 tool_call (CREATE TABLE → INSERT → SELECT *), 格式化表格 | ✅ |
| TC-3.2.12 | 审计日志（调用后） | `GET /api/mcp/audit` | 4 条记录, 含 serverId, action, input SQL, output, latencyMs (3-13ms) | ✅ |
| TC-3.2.13 | 健康监控 | lastHealthCheck 时间戳 | 每 30s 自动更新, 心跳正常 | ✅ |
| TC-3.2.14 | 限流验证 | 配置检查 | database: 100req/min, http-api: 60req/min | ✅ |

---

## Phase 4 — 角色画像 + 合规引擎

### TC-4.1 编译验证

| ID | 测试项 | 命令 | 预期 | 状态 |
|----|--------|------|------|------|
| TC-4.1.1 | 类型检查通过 | `bunx tsc --noEmit` | 7/7 packages 通过 | ✅ |

### TC-4.2 角色画像 API

| ID | 测试项 | 命令 | 预期 | 状态 |
|----|--------|------|------|------|
| TC-4.2.1 | 列出所有角色 | `GET /api/personas` | 7 个角色 | ✅ |
| TC-4.2.2 | 角色详情 | `GET /api/personas/finance-controller` | personality, allowedTools, proactiveTasks | ✅ |
| TC-4.2.3 | Finance 工具列表 | `GET /api/personas/finance-controller/tools` | 3 个 (db_query, db_execute, db_list_tables) | ✅ |
| TC-4.2.4 | Engineer 工具列表 | `GET /api/personas/engineer/tools` | 8 个 (5 内置 + 3 MCP) | ✅ |
| TC-4.2.5 | CEO 工具列表 | `GET /api/personas/ceo/tools` | 2 个 (db_query, db_list_tables — 无 execute) | ✅ |
| TC-4.2.6 | Sales 工具列表 | `GET /api/personas/sales-rep/tools` | 2 个 (db_query, db_list_tables — 无 execute) | ✅ |
| TC-4.2.7 | 角色不存在 | `GET /api/personas/nonexistent` | 404 | ✅ |

### TC-4.3 合规引擎 API

| ID | 测试项 | 命令 | 预期 | 状态 |
|----|--------|------|------|------|
| TC-4.3.1 | 规则集列表 | `GET /api/compliance/rules` | 4 个规则集 (general:3, hr:3, finance:5, legal:3 = 14 条) | ✅ |
| TC-4.3.2 | 单个规则集 | `GET /api/compliance/rules/finance` | 5 条规则详情 | ✅ |
| TC-4.3.3 | 审计初始 | `GET /api/compliance/audit` | 空列表 | ✅ |
| TC-4.3.4 | 审批初始 | `GET /api/compliance/approvals` | 空列表 | ✅ |

### TC-4.4 Agent + 角色 + 合规集成

| ID | 测试项 | 命令 | 预期 | 状态 |
|----|--------|------|------|------|
| TC-4.4.1 | CEO 列表查询 | `POST /api/agent {personaId:"ceo"}` 查表 | tool_call db_list_tables 成功 | ✅ |
| TC-4.4.2 | CEO 查询员工（脱敏） | `POST /api/agent {personaId:"ceo"}` 查员工 | salary 字段被 Post-Hook 脱敏为 `****` | ✅ |
| TC-4.4.3 | CEO 写操作（权限限制） | CEO 尝试写操作 | 工具列表无 db_execute, 模型未尝试 | ✅ |
| TC-4.4.4 | Finance 写操作 | `POST /api/agent {personaId:"finance-controller"}` 写 | db_execute 成功 | ✅ |
| TC-4.4.5 | Engineer 写操作（审批拦截） | `POST /api/agent {personaId:"engineer"}` 写 | Pre-Hook require_approval 拦截 | ✅ |
| TC-4.4.6 | Engineer 查询含 phone（脱敏） | `POST /api/agent {personaId:"engineer"}` 查 | salary + phone 均被脱敏 | ✅ |
| TC-4.4.7 | 审计轨迹查询 | `GET /api/compliance/audit` | 8 条记录, pre/post 结果 + maskedFields | ✅ |
| TC-4.4.8 | 审计延迟 | 审计记录 latency 字段 | 3-6ms（含 Pre + 执行 + Post） | ✅ |

---

## Phase 5 — 组织记忆 + 个人记忆 + 知识库

### TC-5.1 编译验证

| ID | 测试项 | 命令 | 预期 | 状态 |
|----|--------|------|------|------|
| TC-5.1.1 | 类型检查通过 | `bunx tsc --noEmit` | 8/8 packages 通过 | ✅ |
| TC-5.1.2 | 依赖安装 | `bun install` | 136 packages | ✅ |
| TC-5.1.3 | shared 类型导出 | 检查 index.ts | 4 个新 Memory 类型 | ✅ |
| TC-5.1.4 | memory 包编译 | tsc --noEmit memory | 3 个 Store 零错误 | ✅ |
| TC-5.1.5 | 结构类型 | 检查 memory-types.ts | MemoryToolDeps 使用适配器, 无循环依赖 | ✅ |
| TC-5.1.6 | server 路由 | 检查路由注册 | 17 个新端点 + memory stores 注入 | ✅ |

### TC-5.2 组织记忆 API (9 tests)

| ID | 测试项 | 命令 | 预期 | 状态 |
|----|--------|------|------|------|
| TC-5.2.1 | 列出种子数据 | `GET /api/org-memory` | 2 条: 员工报销制度, 代码规范 | ✅ |
| TC-5.2.2 | 搜索 | `GET /api/org-memory/search?q=报销` | 1 条匹配 | ✅ |
| TC-5.2.3 | 按 category 过滤 | `GET /api/org-memory?category=policies` | 1 条 policies | ✅ |
| TC-5.2.4 | 获取单条 | `GET /api/org-memory/expense-policy-001` | 完整 title + content + tags | ✅ |
| TC-5.2.5 | 创建条目 | `POST /api/org-memory {category:"decisions",...}` | 201, UUID 生成 | ✅ |
| TC-5.2.6 | 更新条目 | `PUT /api/org-memory/:id {tags:[...]}` | title + content 保留不丢失 | ✅ |
| TC-5.2.7 | 删除条目 | `DELETE /api/org-memory/:id` | deleted: true | ✅ |
| TC-5.2.8 | 删后列表 | `GET /api/org-memory` | 恢复 2 条 | ✅ |
| TC-5.2.9 | 删后 404 | `GET /api/org-memory/:deleted_id` | 404 | ✅ |

### TC-5.3 个人记忆 API (8 tests)

| ID | 测试项 | 命令 | 预期 | 状态 |
|----|--------|------|------|------|
| TC-5.3.1 | 设置偏好 | `PUT /api/memory/ceo/facts/report_day {value:"周三"}` | key=report_day, value=周三 | ✅ |
| TC-5.3.2 | 设置第二个偏好 | `PUT /api/memory/ceo/facts/language {value:"中文"}` | 成功 | ✅ |
| TC-5.3.3 | 获取特定偏好 | `GET /api/memory/ceo/facts/report_day` | value=周三 | ✅ |
| TC-5.3.4 | 列出所有偏好 | `GET /api/memory/ceo/facts` | 2 条 | ✅ |
| TC-5.3.5 | 幂等更新 | `PUT /api/memory/ceo/facts/report_day {value:"周五"}` | value 更新为周五 | ✅ |
| TC-5.3.6 | 删除偏好 | `DELETE /api/memory/ceo/facts/language` | 成功 | ✅ |
| TC-5.3.7 | 删后列表 | `GET /api/memory/ceo/facts` | 1 条 (report_day=周五) | ✅ |
| TC-5.3.8 | 不存在的偏好 | `GET /api/memory/ceo/facts/nonexistent` | 404 | ✅ |

### TC-5.4 对话摘要 API (4 tests)

| ID | 测试项 | 命令 | 预期 | 状态 |
|----|--------|------|------|------|
| TC-5.4.1 | 添加摘要 | `POST /api/memory/ceo/conversations {date:"2026-03-01",...}` | 201 | ✅ |
| TC-5.4.2 | 添加第二条 | `POST /api/memory/ceo/conversations {date:"2026-02-28",...}` | 201 | ✅ |
| TC-5.4.3 | 列出摘要 | `GET /api/memory/ceo/conversations` | 2 条, 按 createdAt 倒序 | ✅ |
| TC-5.4.4 | 带 limit | `GET /api/memory/ceo/conversations?limit=1` | 1 条 | ✅ |

### TC-5.5 知识库 API (8 tests)

| ID | 测试项 | 命令 | 预期 | 状态 |
|----|--------|------|------|------|
| TC-5.5.1 | 导入文档 | `POST /api/knowledge {title:"部署流程指南",...}` | 201, UUID | ✅ |
| TC-5.5.2 | 导入第二个 | `POST /api/knowledge {title:"API设计规范",...}` | 201 | ✅ |
| TC-5.5.3 | 列出文档 | `GET /api/knowledge` | 2 个文档 | ✅ |
| TC-5.5.4 | 搜索 | `GET /api/knowledge/search?q=部署` | 1 条: 部署流程指南 | ✅ |
| TC-5.5.5 | 搜索+personaId | `GET /api/knowledge/search?q=API&personaId=engineer` | 1 条: API设计规范 | ✅ |
| TC-5.5.6 | 获取文档 | `GET /api/knowledge/:id` | 完整 content + tags | ✅ |
| TC-5.5.7 | 删除文档 | `DELETE /api/knowledge/:id` | deleted: true | ✅ |
| TC-5.5.8 | 删后列表 | `GET /api/knowledge` | 1 个文档 | ✅ |

### TC-5.6 Agent + Memory Tool 集成 (4 tests)

| ID | 测试项 | 命令 | 预期 | 状态 |
|----|--------|------|------|------|
| TC-5.6.1 | CEO 工具列表含记忆 | `GET /api/personas/ceo/tools` | 5 个工具 (db_query, db_list_tables, memory_read, memory_write, knowledge_search) | ✅ |
| TC-5.6.2 | Agent + memory_read | `POST /api/agent {personaId:"ceo",...}` 查报销 | tool_call memory_read → 完整报销制度 | ✅ |
| TC-5.6.3 | Agent + memory_write | `POST /api/agent {personaId:"ceo",...}` 记偏好 | tool_call memory_write → 持久化到 facts.json | ✅ |
| TC-5.6.4 | Agent + knowledge_search | `POST /api/agent {personaId:"engineer",...}` 搜 API | tool_call knowledge_search → API设计规范 | ✅ |

---

## Phase 6 — 主动智能 (Proactive Intelligence)

### TC-6.1 编译验证

| ID | 测试项 | 命令 | 预期 | 状态 |
|----|--------|------|------|------|
| TC-6.1.1 | shared 类型检查 | `bunx tsc --noEmit` shared | 通过 | ✅ |
| TC-6.1.2 | proactive 类型检查 | `bunx tsc --noEmit` proactive | 通过 | ✅ |
| TC-6.1.3 | server 类型检查 | `bunx tsc --noEmit` server | 通过 | ✅ |
| TC-6.1.4 | 依赖安装 | `bun install` | 138 packages, @synapse/proactive 识别 | ✅ |
| TC-6.1.5 | 依赖拓扑 | 检查 package.json | proactive 仅依赖 shared + yaml, 不依赖 agent-core | ✅ |
| TC-6.1.6 | 文件清单 | 检查 | ~27 新建 + 4 修改 | ✅ |

### TC-6.2 运行时验证

| ID | 测试项 | 命令 | 预期 | 状态 |
|----|--------|------|------|------|
| TC-6.2.1 | 服务启动日志 | 启动日志 | 11 proactive actions 加载, 2 threshold monitors, 5 cron jobs, 6 event handlers | ✅ |
| TC-6.2.2 | 调度器状态 | `GET /api/proactive/status` | running=true, scheduledJobs=5, registeredEvents=6, activeMonitors=2 | ✅ |
| TC-6.2.3 | 动作列表 | `GET /api/proactive/actions` | 11 个 action 定义 | ✅ |
| TC-6.2.4 | 手动执行 | `POST /api/proactive/actions/:id/execute` | LLM 执行 action + 返回结果 + 记录历史 | ✅ |
| TC-6.2.5 | 发射事件 | `POST /api/proactive/events` | 事件触发 + handler 执行 | ✅ |
| TC-6.2.6 | 执行历史 | `GET /api/proactive/history` | 执行历史列表 | ✅ |
| TC-6.2.7 | 通知列表 | `GET /api/proactive/notifications` | 通知列表 | ✅ |
| TC-6.2.8 | 标记已读 | `POST /api/proactive/notifications/:id/read` | 标记已读 | ✅ |
| TC-6.2.9 | 全部已读 | `POST /api/proactive/notifications/read-all` | 全部标记已读 | ✅ |

---

## Phase 6.5 — 决策智能 (Decision Intelligence)

### TC-6.5.1 编译验证

| ID | 测试项 | 命令 | 预期 | 状态 |
|----|--------|------|------|------|
| TC-6.5.1.1 | 类型检查通过 | `bun run typecheck` | 10/10 packages 通过 | ✅ |
| TC-6.5.1.2 | 依赖安装 | `bun install` | 140 packages | ✅ |
| TC-6.5.1.3 | shared 类型导出 | 检查 index.ts | 6 个新 Decision 类型 | ✅ |
| TC-6.5.1.4 | decision-engine 编译 | tsc --noEmit | 8 个源文件零错误 | ✅ |
| TC-6.5.1.5 | server 路由集成 | 检查路由注册 | 16 个新端点 + DecisionEngine 生命周期 | ✅ |

### TC-6.5.2 启动确认

| ID | 测试项 | 预期 | 状态 |
|----|--------|------|------|
| TC-6.5.2.1 | 启动日志 | `[DataCollector] Loaded 10 metric definitions` | ✅ |
| TC-6.5.2.2 | 启动日志 | `[StrategyTracker] Loaded 4 objectives` | ✅ |
| TC-6.5.2.3 | 启动日志 | `[DecisionEngine] Initialized` → `Started` | ✅ |

### TC-6.5.3 基础 API (9 tests)

| ID | 测试项 | 命令 | 预期 | 状态 |
|----|--------|------|------|------|
| TC-6.5.3.1 | 引擎状态 | `GET /api/decision/status` | running=true, metricDefinitions=10, strategyObjectives=4 | ✅ |
| TC-6.5.3.2 | 列出指标 | `GET /api/decision/metrics` | 10 个指标定义（含 alertRules） | ✅ |
| TC-6.5.3.3 | 战略概览 | `GET /api/decision/strategy` | 4 个目标 + 8 个 KR（初始全部 off_track） | ✅ |
| TC-6.5.3.4 | 单个目标 | `GET /api/decision/strategy/obj-revenue` | 2 个 KR 含 targetValue | ✅ |
| TC-6.5.3.5 | 目标 404 | `GET /api/decision/strategy/nonexistent` | 404 正确响应 | ✅ |
| TC-6.5.3.6 | 空快照 | `GET /api/decision/metrics/revenue/snapshots` | 空数组 | ✅ |
| TC-6.5.3.7 | 空洞察 | `GET /api/decision/insights` | 空数组 | ✅ |
| TC-6.5.3.8 | 空日志 | `GET /api/decision/journal` | 空数组 | ✅ |
| TC-6.5.3.9 | 空报告 | `GET /api/decision/reports` | 空数组 | ✅ |

### TC-6.5.4 决策 CRUD (4 tests)

| ID | 测试项 | 命令 | 预期 | 状态 |
|----|--------|------|------|------|
| TC-6.5.4.1 | 创建决策 | `POST /api/decision/journal {deciderId:"ceo",...}` | 201, DecisionRecord with UUID, options, pros/cons | ✅ |
| TC-6.5.4.2 | 更新状态 | `PUT /api/decision/journal/:id {tracking:{status:"executing"}}` | pending → executing, updatedAt 更新 | ✅ |
| TC-6.5.4.3 | 获取详情 | `GET /api/decision/journal/:id` | 完整记录含 context + options + decision + tracking | ✅ |
| TC-6.5.4.4 | 列表查询 | `GET /api/decision/journal` | 1 条记录 | ✅ |

### TC-6.5.5 LLM 驱动端点 (3 tests)

> 这些测试调用真实 LLM，需要 API Key 和网络访问。

| ID | 测试项 | 命令 | 预期 | 状态 |
|----|--------|------|------|------|
| TC-6.5.5.1 | 手动采集指标 | `POST /api/decision/metrics/revenue/collect` | LLM 返回 value + metadata JSON | ✅ |
| TC-6.5.5.2 | 洞察分析 | `POST /api/decision/insights/analyze {personaId:"ceo"}` | 1-5 个洞察, 含 type/severity/evidence | ✅ |
| TC-6.5.5.3 | 生成日报 | `POST /api/decision/reports/generate {type:"daily",personaId:"ceo"}` | Markdown 报告含摘要/指标/洞察/建议 | ✅ |

### TC-6.5.6 数据联动验证 (3 tests)

| ID | 测试项 | 命令 | 预期 | 状态 |
|----|--------|------|------|------|
| TC-6.5.6.1 | 采集后快照 | `GET /api/decision/metrics/revenue/snapshots` | 1 条快照, value + metadata | ✅ |
| TC-6.5.6.2 | 战略刷新 | `POST /api/decision/strategy/refresh` | kr-revenue-q1 的 currentValue 更新 | ✅ |
| TC-6.5.6.3 | 最终状态 | `GET /api/decision/status` | metricsCount≥1, insightsCount≥1, decisionsCount=1, reportsCount=1 | ✅ |

## Phase 7 — Skill 系统 (Skill Manager)

### TC-7.1 编译验证

| ID | 测试项 | 命令 | 预期 | 状态 |
|----|--------|------|------|------|
| TC-7.1.1 | 类型检查通过 | `bun run typecheck` | 12/12 packages 通过 | ✅ |
| TC-7.1.2 | skill-manager 编译 | `tsc --noEmit` skill-manager | 7 个源文件零错误 | ✅ |
| TC-7.1.3 | 内置技能加载 | 启动日志 | `[server] Skill Manager initialized` + 10 个 config/skills/ 加载 | ✅ |

### TC-7.2 Skill CRUD API

| ID | 测试项 | 命令 | 预期 | 状态 |
|----|--------|------|------|------|
| TC-7.2.1 | 列出技能 | `GET /api/skills` | 10+ 个技能 (8 内置 + 自定义) | ✅ |
| TC-7.2.2 | 按分类过滤 | `GET /api/skills?category=analysis` | 仅返回 analysis 类技能 | ✅ |
| TC-7.2.3 | 技能详情 | `GET /api/skills/code-review` | 完整 name + description + instructions + allowedTools + parameters | ✅ |
| TC-7.2.4 | 技能不存在 | `GET /api/skills/nonexistent` | 404 | ✅ |
| TC-7.2.5 | 分类统计 | `GET /api/skills/categories` | 各分类计数 | ✅ |
| TC-7.2.6 | 系统状态 | `GET /api/skills/status` | totalSkills + activeSkills + categories | ✅ |

### TC-7.3 自定义技能 CRUD

| ID | 测试项 | 命令 | 预期 | 状态 |
|----|--------|------|------|------|
| TC-7.3.1 | 创建自定义技能 | `POST /api/skills/custom {name:"test-skill",...}` | 201, 返回完整 skill 对象 | ✅ |
| TC-7.3.2 | 更新自定义技能 | `PUT /api/skills/custom/test-skill {description:"updated"}` | 更新成功 | ✅ |
| TC-7.3.3 | 删除自定义技能 | `DELETE /api/skills/custom/test-skill` | `{ deleted: true }` | ✅ |

### TC-7.4 技能执行

| ID | 测试项 | 命令 | 预期 | 状态 |
|----|--------|------|------|------|
| TC-7.4.1 | 执行技能 | `POST /api/skills/code-review/execute {personaId:"engineer"}` | execution 对象含 status + result | ✅ |
| TC-7.4.2 | 执行历史 | `GET /api/skills/history` | 至少 1 条记录 | ✅ |
| TC-7.4.3 | 启用/禁用 | `POST /api/skills/code-review/status {status:"disabled"}` | 状态切换成功 | ✅ |

---

## Phase 7.5 — Skill Marketplace

### TC-7.5.1 编译验证

| ID | 测试项 | 命令 | 预期 | 状态 |
|----|--------|------|------|------|
| TC-7.5.1.1 | 类型检查通过 | `bun run typecheck` | 13/13 packages 通过 | ✅ |
| TC-7.5.1.2 | skill-marketplace 编译 | `tsc --noEmit` skill-marketplace | 6 个源文件零错误 | ✅ |

### TC-7.5.2 发布与搜索

| ID | 测试项 | 命令 | 预期 | 状态 |
|----|--------|------|------|------|
| TC-7.5.2.1 | 市场统计（初始） | `GET /api/marketplace/status` | totalPublished + totalInstalled + totalReviews + categoryCounts | ✅ |
| TC-7.5.2.2 | 发布技能 | `POST /api/marketplace/publish {skillId:"code-review",author:{...}}` | 201, 返回 skill + warnings + reviewResult | ✅ |
| TC-7.5.2.3 | 搜索 | `GET /api/marketplace/search?q=code` | 匹配到 code-review | ✅ |
| TC-7.5.2.4 | 按分类浏览 | `GET /api/marketplace/browse?category=analysis&sort=ranking` | 排名排序结果 | ✅ |
| TC-7.5.2.5 | 排行榜 | `GET /api/marketplace/top?limit=5` | 最多 5 个，按排名排序 | ✅ |
| TC-7.5.2.6 | 技能详情 | `GET /api/marketplace/skills/:id` | 完整 MarketplaceSkill + reviews | ✅ |
| TC-7.5.2.7 | 重复发布 | `POST /api/marketplace/publish {skillId:"code-review",...}` | 400, "already published" | ✅ |

### TC-7.5.3 安装与更新

| ID | 测试项 | 命令 | 预期 | 状态 |
|----|--------|------|------|------|
| TC-7.5.3.1 | 安装技能 | `POST /api/marketplace/skills/:id/install` | `{ installed: true, record }`, downloads +1 | ✅ |
| TC-7.5.3.2 | 已安装列表 | `GET /api/marketplace/installed` | 包含刚安装的技能 | ✅ |
| TC-7.5.3.3 | 检查更新 | `GET /api/marketplace/installed/updates` | updates 数组 | ✅ |
| TC-7.5.3.4 | 卸载 | `DELETE /api/marketplace/installed/:id` | `{ uninstalled: true }` | ✅ |

### TC-7.5.4 评价系统

| ID | 测试项 | 命令 | 预期 | 状态 |
|----|--------|------|------|------|
| TC-7.5.4.1 | 提交评价 | `POST /api/marketplace/skills/:id/reviews {rating:4,comment:"好用"}` | 201, review + qualityCheck | ✅ |
| TC-7.5.4.2 | 获取评价 | `GET /api/marketplace/skills/:id/reviews` | 包含刚提交的评价 | ✅ |
| TC-7.5.4.3 | 修改评价 | `PUT /api/marketplace/reviews/:reviewId {rating:5}` | 更新成功 | ✅ |
| TC-7.5.4.4 | 删除评价 | `DELETE /api/marketplace/reviews/:reviewId` | `{ deleted: true }` | ✅ |

### TC-7.5.5 元数据管理

| ID | 测试项 | 命令 | 预期 | 状态 |
|----|--------|------|------|------|
| TC-7.5.5.1 | 更新元数据 | `PUT /api/marketplace/skills/:id {tags:["new-tag"]}` | tags 更新 | ✅ |
| TC-7.5.5.2 | 下架 | `DELETE /api/marketplace/skills/:id` | `{ deleted: true }` | ✅ |
| TC-7.5.5.3 | 下架后搜索 | `GET /api/marketplace/search?q=code` | 不再返回已下架的技能 | ✅ |
| TC-7.5.5.4 | 市场统计更新 | `GET /api/marketplace/status` | totalPublished 数量正确 | ✅ |

---

## Phase 9 — 浏览器自动化 + MCP Server Stubs

### TC-9.1 编译验证

| ID | 测试项 | 命令 | 预期 | 状态 |
|----|--------|------|------|------|
| TC-9.1.1 | browser 包编译 | `tsc --noEmit` browser | BrowserPool 类零错误 | ✅ |
| TC-9.1.2 | 浏览器工具注册 | 检查 agent-core | 6 个 browser_* 工具注册到 ToolRegistry | ✅ |
| TC-9.1.3 | MCP Server Stubs | 检查 mcp-servers/ | 7 个 stub (bi, crm, erp, feishu, finance, hrm, legal) + 7 个 config JSON | ✅ |

### TC-9.2 运行时验证

| ID | 测试项 | 命令 | 预期 | 状态 |
|----|--------|------|------|------|
| TC-9.2.1 | 启动日志 | 服务启动 | `[server] Browser Pool created (lazy init)` | ✅ |
| TC-9.2.2 | 浏览器工具可见 | `GET /api/personas/engineer/tools` | 包含 browser_navigate, browser_click 等 6 个工具 | ✅ |
| TC-9.2.3 | Agent 浏览器导航 | `POST /api/agent` "打开百度首页" | tool_call browser_navigate → 页面内容 | ✅ |
| TC-9.2.4 | BrowserPool 并发限制 | 检查配置 | max 5 sessions, 10min 自动清理 | ✅ |
| TC-9.2.5 | MCP Server 配置加载 | `GET /api/mcp/servers` | 可见 stub server 列表 (disabled 状态) | ✅ |

---

## Phase 10 — Web UI (Next.js 前端)

### TC-10.1 编译验证

| ID | 测试项 | 命令 | 预期 | 状态 |
|----|--------|------|------|------|
| TC-10.1.1 | turbo build 全通过 | `turbo build` | 15/15 packages 编译成功 | ✅ |
| TC-10.1.2 | Next.js 构建 | `next build` | 14 个路由生成, 零错误 | ✅ |
| TC-10.1.3 | Bundle 总大小 | 构建输出 | First Load JS shared ~102 kB | ✅ |
| TC-10.1.4 | TypeScript 零错误 | `tsc --noEmit` web | 全部组件类型正确 | ✅ |

### TC-10.2 页面路由验证

| ID | 测试项 | 命令 | 预期 | 状态 |
|----|--------|------|------|------|
| TC-10.2.1 | 首页 | `GET /` | 200, 重定向或欢迎页 | ✅ |
| TC-10.2.2 | Chat 页面 | `GET /chat` | 200, ChatPanel 渲染 | ✅ |
| TC-10.2.3 | 10 页面全通 | 逐一访问 10 个路由 | 全部 200, 无白屏 | ✅ |

### TC-10.3 API 代理验证

| ID | 测试项 | 命令 | 预期 | 状态 |
|----|--------|------|------|------|
| TC-10.3.1 | API Proxy 透传 | `GET http://localhost:19300/api/health` | 代理到后端, 返回 `{"status":"ok"}` | ✅ |
| TC-10.3.2 | SSE 流式透传 | `POST http://localhost:19300/api/agent` (stream) | SSE 事件正常流式返回 | ✅ |
| TC-10.3.3 | CORS 隔离 | 前端无跨域错误 | 通过 API Proxy 统一代理，不触发 CORS | ✅ |

---

## Session 13 — 上下架审核引擎

### TC-13.1 编译验证

| ID | 测试项 | 命令 | 预期 | 状态 |
|----|--------|------|------|------|
| TC-13.1.1 | turbo build | `turbo build` | 15/15 packages 通过, 含 publishReview 新类型 | ✅ |

### TC-13.2 自动审核评分 (publishReview)

| ID | 测试项 | 命令 | 预期 | 状态 |
|----|--------|------|------|------|
| TC-13.2.1 | 高质量 Skill 自动上架 | `POST /api/marketplace/publish` (discussion-report) | score ≥ 70, status = `active`, autoApprove = true | ✅ |
| TC-13.2.2 | 低质量 Skill 待审核 | `POST /api/marketplace/publish` (quick-summary) | 30 ≤ score < 70, status = `pending_review` | ✅ |
| TC-13.2.3 | 极低质量 Skill 拒绝 | `POST /api/marketplace/publish` (无 instructions 的 skill) | score < 30, 400 错误 "Skill rejected" | ✅ |
| TC-13.2.4 | 审核返回 4 个维度 | 检查 reviewResult.checks | 功能完整性 + 工具合理性 + 安全合规 + 用户体验 共 4 项 | ✅ |

### TC-13.3 审核队列 API

| ID | 测试项 | 命令 | 预期 | 状态 |
|----|--------|------|------|------|
| TC-13.3.1 | 待审核列表 | `GET /api/marketplace/pending` | 包含 status=pending_review 的 skill | ✅ |
| TC-13.3.2 | 审核通过 | `POST /api/marketplace/skills/:id/review {action:"approve",reviewer:"admin"}` | status 变为 `active` | ✅ |
| TC-13.3.3 | 审核驳回 | `POST /api/marketplace/skills/:id/review {action:"reject",reviewer:"admin",reason:"不合规"}` | status 变为 `rejected` | ✅ |
| TC-13.3.4 | 驳回缺 reason | `POST /api/marketplace/skills/:id/review {action:"reject",reviewer:"admin"}` | 400, "reason is required when rejecting" | ✅ |
| TC-13.3.5 | 审核非待审 Skill | `POST /api/marketplace/skills/:id/review` (active skill) | 400, "only pending_review skills can be reviewed" | ✅ |

### TC-13.4 重新上架

| ID | 测试项 | 命令 | 预期 | 状态 |
|----|--------|------|------|------|
| TC-13.4.1 | 重新上架 rejected | `POST /api/marketplace/skills/:id/reactivate` | 重新评分, 根据 score 分配 active 或 pending_review | ✅ |

### TC-13.5 前端审核队列 UI

| ID | 测试项 | 操作 | 预期 | 状态 |
|----|--------|------|------|------|
| TC-13.5.1 | 审核队列 Tab | 点击 Marketplace → "审核队列" tab | 显示 ReviewQueue 组件, 表格列: 名称/分类/作者/时间/操作 | ✅ |
| TC-13.5.2 | Stats 待审核卡片 | 查看 Marketplace 概览 | 5 列统计卡片, 含"待审核"数量 | ✅ |

### TC-13.6 质量管控增强

| ID | 测试项 | 场景 | 预期 | 状态 |
|----|--------|------|------|------|
| TC-13.6.1 | 零下载 180 天自动废弃 | qualityCheck(downloads=0, 180d) | action = `deprecated` | ✅ |
| TC-13.6.2 | 举报 ≥3 自动下架 | qualityCheck(reportCount=3) | action = `suspend` | ✅ |

---

## 回归测试要求

每个新 Phase 完成后，需回归验证以下核心路径：

| 回归项 | 测试 | 说明 |
|--------|------|------|
| 服务启动 | 全部日志无报错 | 15 packages 正常加载 |
| 健康检查 | `GET /health` → ok | 基础存活 |
| Agent 对话 | `POST /api/agent` 纯文本 | 核心对话通路 |
| Agent + Tool | `POST /api/agent` 触发 tool_call | 工具循环正常 |
| 角色过滤 | CEO 无 db_execute | 权限未回退 |
| 合规脱敏 | 查询含 salary 字段 | Post-Hook 脱敏生效 |
| 记忆读写 | memory_read + memory_write | 记忆工具可用 |
| 主动状态 | `GET /api/proactive/status` | 调度器运行中 |
| 决策状态 | `GET /api/decision/status` | 引擎运行中 |
| 技能列表 | `GET /api/skills` | 10+ 个技能加载 |
| 市场状态 | `GET /api/marketplace/status` | 统计数据正确 |
| 前端构建 | `turbo build` | 15/15 packages 通过 |
| Docker 部署 | `docker compose up -d` | synapse-server:19301 + synapse-web:19300 |
| 类型检查 | `bun run typecheck` | 全包通过 |

---

## 已知限制

| 限制 | 影响 | 计划解决 |
|------|------|---------|
| 无自动化测试框架 | 全部为手动 curl 验证 | 引入 bun test 或 vitest |
| LLM 端点不确定性 | LLM 返回内容不可精确断言 | 验证结构正确性而非内容 |
| Bun.serve idleTimeout 10s | LLM 调用可能超时断连 | 生产环境配置更长超时 |
| 无并发测试 | 未验证并发安全性 | Phase 8+ 负载测试 |
| 无数据清理 | 测试数据累积在 data/ 目录 | 测试前清理或使用临时目录 |
| 前端 E2E 缺失 | 前端仅构建验证，无 Playwright E2E | 引入 @playwright/test |
| Docker 本地 proxy 干扰 | curl 可能被 Privoxy 劫持 | 使用 `--noproxy localhost` |

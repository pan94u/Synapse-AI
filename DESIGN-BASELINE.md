# Synapse AI — 设计基线 (Design Baseline)

> 追踪 PLAN.md 设计与代码实现之间的对齐关系。每个 Phase 结束后更新。
> 最后更新: 2026-03-02 | Phase 6 完成后

---

## 一、九层架构实现状态

| 层 | 名称 | PLAN.md 设计 | 实现状态 | 实现位置 | 偏差说明 |
|----|------|-------------|---------|---------|---------|
| ① | 用户与角色层 | 角色画像 Personas（职责、权限、默认技能、沟通风格） | ✅ 已实现 | `packages/personas/` + `config/personas/` | Phase 4 完成，7 个角色画像 |
| ② | 交互体验层 | Web UI (Next.js + shadcn/ui)，6 大功能模块 | ❌ 未实现 | — | Phase 10 |
| ③ | 服务网关层 | Hono API 路由、鉴权、角色上下文注入、SSE、WebSocket | ⚠️ 部分实现 | `packages/server/` | 已有: 路由 + SSE + CORS + 角色注入。缺: 鉴权、WebSocket |
| ④ | 智能中枢层 | Agent 引擎 (Planner + Executor + Tool Loop + Model Router + 多 Agent 协调 + 上下文管理) | ⚠️ 部分实现 | `packages/agent-core/` | 已有: Model Router + Agent + Tool Loop + persona context + compliance hooks + memory tools。缺: Planner、多 Agent 协调 |
| ⑤ | 合规引擎 | Pre-Hook + Post-Run Hook 双阶段 | ✅ 已实现 | `packages/compliance/` + `config/compliance/` | Phase 4 完成，14 条规则，4 个规则集 |
| ⑥ | 主动智能 | 定时任务 + 事件触发 + 阈值监控 | ✅ 已实现 | `packages/proactive/` + `config/proactive/` | Phase 6 完成，5 cron + 6 events + 2 monitors |
| ⑥.5 | 决策智能 | 数据采集→指标→洞察→决策→战略追踪 | ❌ 未实现 | — | Phase 6.5 |
| ⑦ | 能力层 | 技能系统 + 内置工具 + 记忆 + 知识 | ⚠️ 部分实现 | `packages/agent-core/src/tools/` + `packages/memory/` | 已有: 8 个内置工具 + ToolRegistry + 记忆 + 知识库。缺: Skill 系统 |
| ⑧ | 企业集成层 | MCP Hub (Registry + Aggregator + Router + Auth + Health + Audit + Rate Limit) | ✅ 基础实现 | `packages/mcp-hub/` | Phase 3 完成核心框架。缺: Auth Gateway（凭证加密）、Router（独立路由模块） |
| ⑨ | 企业数字化系统 | 人财法 CRM ERP 等 MCP Servers | ⚠️ 基础实现 | `packages/mcp-servers/` | 已有: database (SQLite) + http-api。缺: 全部业务系统 Adapter |

---

## 二、包（Package）实现状态

### 2.1 已实现的包

| 包 | PLAN.md 规划 | 实际实现 | 完整度 |
|----|-------------|---------|--------|
| `@synapse/shared` | 全部共享类型 | Chat + Tool + Model + MCP + Persona + Compliance + Memory + Proactive 类型 | 90% — 缺 Skill/Decision 类型 |
| `@synapse/agent-core` | Model Router + Agent + Tools + Skills + Memory | Model Router + Agent + Tools (8 内置) + Compliance Hooks + Memory Tools | 60% — 缺 Planner/Skills/多 Agent |
| `@synapse/personas` | 角色画像加载、注册、上下文构建 | YAML loader + PersonaRegistry + buildContext + buildSystemPrompt | 95% — 完整实现 |
| `@synapse/compliance` | Pre-Hook + Post-Hook + 审计 + 审批 | Engine + PreHook + PostHook + Masker + Evaluator + AuditTrail + ApprovalManager | 90% — 审计内存版，缺持久化 |
| `@synapse/memory` | 组织记忆 + 个人记忆 + 知识库 | OrgMemoryStore + PersonalMemoryStore + KnowledgeBase | 85% — 缺向量搜索 |
| `@synapse/proactive` | 定时任务 + 事件触发 + 阈值监控 | CronScheduler + EventBus + ActionRegistry + ThresholdMonitor + TaskManager + History + Notifications | 80% — 缺通知推送渠道 |
| `@synapse/mcp-hub` | Hub + Client + Registry + Lifecycle + Aggregator + Health + Audit + Rate Limiter | 全部核心组件 | 80% — 缺 Auth Gateway + 独立 Router |
| `@synapse/mcp-servers` | 15+ 个 MCP Server | database (SQLite) + http-api | 10% — 基础设施层 2/4，业务系统层 0/5 |
| `@synapse/server` | Hono API 全部路由 | chat + agent + mcp + personas + compliance + org-memory + memory + knowledge + proactive (9 路由模块) | 55% — 9/14+ 路由模块 |

### 2.2 未实现的包

| 包 | 规划 Phase | 说明 |
|----|-----------|------|
| `packages/decision-engine/` | Phase 6.5 | 决策智能引擎 |
| `packages/skill-manager/` | Phase 7 | 技能管理器 |
| `packages/skill-marketplace/` | Phase 7.5 | 技能市场 |
| `packages/web/` | Phase 10 | Next.js 前端 |

---

## 三、核心模块设计 vs 实现对比

### 3.1 Model Router（④ 智能中枢层）

| 设计项 | PLAN.md 设计 | 实现 | 状态 |
|--------|-------------|------|------|
| Provider 接口 | `complete()` + `completeStream()` | ✅ 已实现 | 完全匹配 |
| MiniMax Provider | OpenAI 兼容 + `<think>` 解析 | ✅ `provider-minimax.ts` | 含 extractThinking |
| Claude Provider | OpenAI 兼容格式 | ✅ `provider-claude.ts` | 完全匹配 |
| 路由策略 | default / cost-optimized / quality-first | ✅ `router.ts` | 完全匹配 |
| 模型列表 | MiniMax-M2.5, M1, Claude Sonnet 4, Opus 4 | ✅ 4 个模型注册 | 完全匹配 |
| Ollama Provider | 本地模型支持 | ❌ | 计划中未定 Phase |

### 3.2 Agent 引擎（④ 智能中枢层）

| 设计项 | PLAN.md 设计 | 实现 | 状态 |
|--------|-------------|------|------|
| Tool Loop | Agent → 模型调用 → tool_calls → 执行 → 回传 → 循环 | ✅ `agent.ts` run() + runStream() | 完全匹配 |
| 最大迭代 | 可配置 maxIterations | ✅ 默认 10，支持配置 | 完全匹配 |
| 流式事件 | text / tool_call / tool_result / done | ✅ AgentStreamEvent | 完全匹配 |
| Persona 上下文 | 角色 system prompt 注入 + 工具过滤 | ✅ `personaContext` 注入 | Phase 4 完成 |
| Compliance Hooks | Pre-Hook 拦截 + Post-Hook 脱敏 | ✅ `ComplianceHooks` 接口 | Phase 4 完成 |
| Memory Tools | memory_read + memory_write + knowledge_search | ✅ 3 个工具 | Phase 5 完成 |
| Planner | 将复杂任务分解为多步骤 | ❌ | 未来 Phase |
| 多 Agent 协调器 | 跨部门协作 | ❌ | 未来 Phase |

### 3.3 工具系统（⑦ 能力层）

| 设计项 | PLAN.md 设计 | 实现 | 状态 |
|--------|-------------|------|------|
| Tool 接口 | definition + permission + execute | ✅ `tools/types.ts` | 完全匹配 |
| ToolRegistry | register / get / list / getPermission / listForPersona | ✅ `tools/registry.ts` | 完全匹配 |
| ToolExecutor | 单个执行 + 批量并行 + 权限检查 + compliance hooks | ✅ `tools/executor.ts` | 完全匹配 |
| file_read | 读取文件（max 100KB） | ✅ `built-in/file-read.ts` | 完全匹配 |
| file_write | 写入文件 | ✅ `built-in/file-write.ts` | 完全匹配 |
| file_search | Glob 搜索文件 | ✅ `built-in/file-search.ts` | 完全匹配 |
| shell_exec | Shell 命令 (30s timeout, permission=ask) | ✅ `built-in/shell-exec.ts` | 完全匹配 |
| web_fetch | HTTP 请求 | ✅ `built-in/web-fetch.ts` | 完全匹配 |
| memory_read | 组织/个人记忆读取 | ✅ `built-in/memory-read.ts` | Phase 5 |
| memory_write | 组织/个人记忆写入 | ✅ `built-in/memory-write.ts` | Phase 5 |
| knowledge_search | 知识库搜索 | ✅ `built-in/knowledge-search.ts` | Phase 5 |
| browser_* | 浏览器自动化 (4 工具) | ❌ | Phase 9 |

### 3.4 角色画像系统（① 用户与角色层）

| 设计项 | PLAN.md 设计 | 实现 | 状态 |
|--------|-------------|------|------|
| PersonaConfig | id, personality, allowedTools, complianceRuleset, proactiveTasks, orgMemoryAccess | ✅ `types/persona.ts` | 完全匹配 |
| YAML Loader | snake_case → camelCase 映射 | ✅ `personas/loader.ts` | 完全匹配 |
| PersonaRegistry | register / get / list / buildContext | ✅ `personas/registry.ts` | 完全匹配 |
| System Prompt | tone/focus/caution → 行为指令 | ✅ `personas/context.ts` | 完全匹配 |
| 工具过滤 | allowedTools glob 模式匹配 | ✅ `buildContext()` + `listForPersona()` | 完全匹配 |
| 角色数量 | 7 个内置角色 | ✅ 7 个 YAML | CEO, HR, Finance, Legal, Sales, Ops, Engineer |

### 3.5 合规引擎（⑤ 合规引擎层）

| 设计项 | PLAN.md 设计 | 实现 | 状态 |
|--------|-------------|------|------|
| Pre-Hook | 4 种动作: allow / deny / require_approval / modify | ✅ `pre-hook.ts` | 完全匹配 |
| Post-Hook | 5 种动作: pass / mask / flag / notify / revoke | ✅ `post-hook.ts` | 完全匹配 |
| DataMasker | 4 种脱敏方法 + 9 种敏感字段模式 | ✅ `masker.ts` | 完全匹配 |
| 表达式求值 | tokenizer + recursive descent parser | ✅ `evaluator.ts` | fail-open 设计 |
| 审计轨迹 | 全链路记录 + 多维查询 | ✅ `audit-trail.ts` | 内存版，max 2000 条 |
| 审批流 | pending → approved/denied/expired | ✅ `approval.ts` | 内存状态机 |
| 规则集 | 4 套: general, finance, hr, legal | ✅ 4 个 YAML | 14 条规则 |

### 3.6 记忆系统（⑦ 能力层）

| 设计项 | PLAN.md 设计 | 实现 | 状态 |
|--------|-------------|------|------|
| 组织记忆 | CRUD + 搜索 + 权限过滤 | ✅ `OrgMemoryStore` | 4 category + glob access |
| 个人记忆 | facts (偏好) + conversations (摘要) | ✅ `PersonalMemoryStore` | 按 personaId 隔离 |
| 知识库 | 文档导入 + 关键词搜索 | ✅ `KnowledgeBase` | 缺向量搜索 |
| 文件存储 | `{id}.json + _index.json` | ✅ | 与 PLAN 一致 |
| 向量嵌入 | embedding + 语义搜索 | ❌ | 未来增强 |

### 3.7 主动智能（⑥ 主动智能层）

| 设计项 | PLAN.md 设计 | 实现 | 状态 | 偏差 |
|--------|-------------|------|------|------|
| Cron 调度 | 5-field cron 表达式 | ✅ `cron-parser.ts` + `cron-scheduler.ts` | 自写 ~70 行 | PLAN 设计用外部库，实际自写无依赖 |
| 事件触发 | EventEmitter 封装 | ✅ `event-bus.ts` | 完全匹配 | 单进程足够 |
| 阈值监控 | Agent 查数据 + 条件评估 | ✅ `threshold-monitor.ts` | 简单 `field op value` | PLAN 设计完整表达式引擎，Phase 6 简化 |
| Action 定义 | YAML prompt 模板 | ✅ `action-registry.ts` + 11 YAML | 完全匹配 | `{{var}}` 替换 + `{{CURRENT_DATE}}` |
| 执行历史 | 文件存储 | ✅ `task-history.ts` | `{id}.json + _index.json` | 与 memory 模式一致 |
| 通知 | 多渠道推送 | ⚠️ `notification-store.ts` | 仅存储，API 查询 | Slack/邮件推迟到 Phase 8+ |
| TaskManager | 核心编排器 | ✅ `task-manager.ts` | 回调注入，不依赖 agent-core | 正向偏差：更好的解耦 |
| proactiveTasks | persona YAML 字段激活 | ✅ 5 cron + 6 event | 完全匹配 | — |
| 依赖 | proactive → agent-core + mcp-hub | ⚠️ proactive → shared + yaml 仅 | 简化 | 通过回调注入避免上游依赖（正向偏差） |

### 3.8 MCP Hub（⑧ 企业集成层）

| 设计项 | PLAN.md 设计 | 实现 | 状态 | 偏差 |
|--------|-------------|------|------|------|
| MCP SDK | `@modelcontextprotocol/sdk` | ✅ ^1.27.0 | — | PLAN 写 ^1.0.0，实际用更新版 |
| Client | JSON-RPC over stdio/SSE | ✅ `client.ts` stdio 模式 | ⚠️ | SSE 传输未实现 |
| Registry | 发现、注册、注销、状态管理 | ✅ `registry.ts` | 完全匹配 | — |
| Lifecycle | 启动/停止/重启/startAll | ✅ `lifecycle.ts` | 完全匹配 | — |
| Aggregator | 汇总 MCP tools → Agent Tool 适配器 | ✅ `aggregator.ts` | 完全匹配 | 工具名前缀 `${serverId}_${toolName}` |
| Router | tool_call 路由到对应 Server | ⚠️ 集成在 aggregator | 简化 | PLAN 设计独立 Router 模块 |
| Auth Gateway | 凭证加密 + OAuth Token 自动刷新 | ❌ | 未实现 | env 变量直传，Phase 8+ 补齐 |
| Health Monitor | 定时心跳 + 指数退避重连 | ✅ `health.ts` | 完全匹配 | 退避: 1s→2s→...→30s |
| Audit Logger | 全链路审计 | ⚠️ `audit.ts` | 简化版 | console.log + 内存 (max 1000) |
| Rate Limiter | 滑动窗口限流 | ✅ `rate-limiter.ts` | 完全匹配 | — |

### 3.9 MCP Servers（⑨ 企业数字化系统）

#### 基础设施层

| Server | PLAN.md 设计 | 实现 | 工具对比 |
|--------|-------------|------|---------|
| **database** | MySQL / PostgreSQL / SQLite | ✅ SQLite only | db_query, db_execute, db_list_tables。缺: db_describe + MySQL/PG |
| **http-api** | 5 个分方法工具 | ✅ 统一 `http_request` | 合并更灵活（正向偏差） |
| **git** | git_clone, git_pr_create, etc. | ❌ | Phase 8 |
| **email** | email_send, email_search, etc. | ❌ | Phase 8 |

#### 协作通讯层 + 业务系统层

| Server | 实现 | 说明 |
|--------|------|------|
| feishu / wechat-work / hrm / finance / legal / crm / erp / bi / dms | ❌ | Phase 8 |

### 3.10 Server API（③ 服务网关层）

| 端点 | PLAN.md 设计 | 实现 | 状态 |
|------|-------------|------|------|
| `GET /health` | 健康检查 | ✅ | 完全匹配 |
| `POST /api/chat` | 流式/非流式 Chat | ✅ | 完全匹配 |
| `POST /api/agent` | 流式/非流式 Agent + persona + compliance | ✅ | 完全匹配 |
| `GET /api/mcp/servers` | MCP Server 状态列表 | ✅ | 完全匹配 |
| `GET /api/mcp/servers/:id` | 单个 Server 详情 | ✅ | 完全匹配 |
| `POST /api/mcp/servers/:id/restart` | 重启 Server | ✅ | 完全匹配 |
| `GET /api/mcp/tools` | 聚合 MCP 工具列表 | ✅ | 完全匹配 |
| `GET /api/mcp/audit` | 审计日志查询 | ✅ | 完全匹配 |
| `GET /api/personas` | 角色列表 | ✅ | Phase 4 |
| `GET /api/personas/:id` | 角色详情 | ✅ | Phase 4 |
| `GET /api/personas/:id/tools` | 角色可用工具 | ✅ | Phase 4 |
| `GET /api/compliance/rules` | 合规规则集 | ✅ | Phase 4 |
| `GET /api/compliance/audit` | 合规审计轨迹 | ✅ | Phase 4 |
| `GET /api/compliance/approvals` | 待审批列表 | ✅ | Phase 4 |
| `POST /api/compliance/approvals/:id/*` | 审批操作 | ✅ | Phase 4 |
| `GET/POST/PUT/DELETE /api/org-memory` | 组织记忆 CRUD | ✅ (6 endpoints) | Phase 5 |
| `GET/PUT/DELETE /api/memory/:personaId/facts` | 个人偏好 | ✅ (4 endpoints) | Phase 5 |
| `GET/POST /api/memory/:personaId/conversations` | 对话摘要 | ✅ (2 endpoints) | Phase 5 |
| `GET/POST/DELETE /api/knowledge` | 知识库 | ✅ (5 endpoints) | Phase 5 |
| `GET /api/proactive/status` | 调度器状态 | ✅ | Phase 6 |
| `GET /api/proactive/actions` | 列出所有 action | ✅ | Phase 6 |
| `POST /api/proactive/actions/:id/execute` | 手动执行 action | ✅ | Phase 6 |
| `POST /api/proactive/events` | 发射事件 | ✅ | Phase 6 |
| `GET /api/proactive/history` | 执行历史 | ✅ | Phase 6 |
| `GET /api/proactive/notifications` | 通知查询 | ✅ | Phase 6 |
| `POST /api/proactive/notifications/:id/read` | 标记已读 | ✅ | Phase 6 |
| `POST /api/proactive/notifications/read-all` | 全部已读 | ✅ | Phase 6 |
| `/api/tasks` | 任务管理 | ❌ | 未来 Phase |
| `/api/skills` | 技能管理 | ❌ | Phase 7 |
| `/api/marketplace` | 技能市场 | ❌ | Phase 7.5 |
| `/api/decision` | 决策智能 | ❌ | Phase 6.5 |
| `/api/settings` | 系统设置 | ❌ | Phase 10 |

**当前 API 总计**: 36 个端点 (Phase 1: 2, Phase 2: 1, Phase 3: 5, Phase 4: 8, Phase 5: 17, Phase 6: 8, 减去重叠: 5)

---

## 四、配置体系实现状态

| 配置目录 | PLAN.md 设计 | 实现 | 说明 |
|---------|-------------|------|------|
| `config/mcp-servers/` | 全部 MCP Server JSON 配置 | ✅ database.json + http-api.json | 2/15+ 配置文件 |
| `config/personas/` | 7 个角色画像 YAML | ✅ 7 个 YAML | Phase 4 完成 |
| `config/compliance/rules/` | finance/legal/hr/general YAML 规则 | ✅ 4 个 YAML (14 条规则) | Phase 4 完成 |
| `config/compliance/approval-flows.yaml` | 审批流定义 | ❌ 内置在 ApprovalManager | 简化 |
| `config/proactive/actions/` | action prompt 模板 | ✅ 11 个 YAML | Phase 6 完成 |
| `config/proactive/monitors/` | 阈值监控配置 | ✅ 2 个 YAML | Phase 6 完成 |
| `config/decision/` | metrics/collection/insight-rules/strategy YAML | ❌ | Phase 6.5 |

---

## 五、数据目录实现状态

| 数据目录 | PLAN.md 设计 | 实现 | 说明 |
|---------|-------------|------|------|
| `data/org-memory/` | knowledge/ + decisions/ + lessons/ + policies/ | ✅ 4 category dirs + _index.json | Phase 5 完成 |
| `data/memory/` | {personaId}/facts.json + conversations.json | ✅ 按 persona 隔离 | Phase 5 完成 |
| `data/knowledge/` | 文档 + 索引 | ✅ {id}.json + _index.json | Phase 5 完成 |
| `data/proactive/history/` | 执行历史 | ✅ {id}.json + _index.json | Phase 6 完成 |
| `data/proactive/notifications/` | 通知存储 | ✅ {id}.json + _index.json | Phase 6 完成 |
| `data/marketplace/` | index.json + downloads/ | ❌ | Phase 7.5 |
| `data/mcp/credentials/` | 加密凭证 (AES-256-GCM) | ❌ | Phase 8+ |
| `data/mcp/cache/` | MCP 响应缓存 | ❌ | 未规划具体 Phase |
| `data/mcp/audit/` | 持久化审计日志 | ❌ | 当前内存版 |
| `data/compliance/` | audit-trail/ + pending-approvals/ | ❌ | 当前内存版 |
| `data/decision/` | metrics/ + insights/ + journal/ + strategy/ + reports/ | ❌ | Phase 6.5 |
| `data/logs/` | 执行日志 | ❌ | 当前仅 console.log |

---

## 六、依赖拓扑 — 设计 vs 实现

### PLAN.md 设计（全量）
```
@synapse/shared (无依赖)
  ├── @synapse/agent-core (shared, openai)
  │     ├── skills/ (解析器、加载器、注册表)
  │     └── memory/ (长短期记忆)
  ├── @synapse/personas (shared)
  ├── @synapse/compliance (shared, personas)
  ├── @synapse/proactive (shared, agent-core, mcp-hub, compliance)
  ├── @synapse/decision-engine (shared, mcp-hub, org-memory)
  ├── @synapse/org-memory (shared)
  ├── @synapse/mcp-hub (shared, @modelcontextprotocol/sdk, zod)
  ├── @synapse/mcp-servers (@modelcontextprotocol/sdk, zod)  ← 独立进程
  ├── @synapse/skill-manager (shared, agent-core)
  ├── @synapse/skill-marketplace (shared, skill-manager)
  ├── @synapse/knowledge (shared)
  └── @synapse/server (shared, agent-core, mcp-hub, personas, compliance, ...)
        └── @synapse/web (next, react, shared)
```

### 当前实现
```
@synapse/shared (无依赖)                                          ✅
  ├── @synapse/agent-core (shared, openai)                        ✅
  ├── @synapse/personas (shared, yaml)                            ✅
  ├── @synapse/compliance (shared, yaml)                          ✅
  ├── @synapse/memory (shared)                                    ✅
  ├── @synapse/proactive (shared, yaml)                           ✅ ⚠️ 偏差: 不依赖 agent-core
  ├── @synapse/mcp-hub (shared, @modelcontextprotocol/sdk, zod)   ✅
  │     └── @synapse/server (shared, agent-core, mcp-hub, personas, compliance, memory, proactive, hono)  ✅
  └── @synapse/mcp-servers (@modelcontextprotocol/sdk, zod)       ✅ 独立进程
```

**偏差说明**: PLAN.md 设计 proactive 依赖 agent-core + mcp-hub + compliance，实际实现通过回调注入避免了这些直接依赖，仅依赖 shared + yaml。这是正向偏差，提供了更好的包解耦。

---

## 七、已知偏差记录

| # | 偏差 | PLAN.md 设计 | 实际实现 | 原因 | 影响 |
|---|------|-------------|---------|------|------|
| 1 | MCP Auth | Auth Gateway: 凭证加密 AES-256-GCM | env 变量直传，无加密 | Phase 3 简化 | Phase 8+ 补齐 |
| 2 | MCP Audit | userId + approved 字段 | 无 userId/approved | 暂无用户认证系统 | Phase 8+ 补充 |
| 3 | MCP Router | 独立 Router 模块 | 路由逻辑内嵌在 Aggregator | 只有 2 个 Server | 多 Server 时提取 |
| 4 | MCP Resources/Prompts | Server 暴露 Resources + Prompts | 未实现 | Phase 3 聚焦 Tools | 按需补充 |
| 5 | Database Server | MySQL/PostgreSQL/SQLite | 仅 SQLite (`bun:sqlite`) | 零配置优先 | Phase 8 加 MySQL/PG |
| 6 | HTTP API Server | 5 个分方法工具 | 1 个通用 http_request | 合并更灵活 | 正向偏差 |
| 7 | MCP Server 基类 | `BaseMCPServer` + `DomainAdapter` | 直接使用 SDK `McpServer` | 仅 2 个 Server | Phase 8 抽象 |
| 8 | Agent Route | 模块级创建 Agent | 函数工厂注入 | 支持动态注入 | 正向改进 |
| 9 | App 初始化 | 同步直接导出 | `async createApp()` + 顶层 await | MCP Hub 异步启动 | 正向改进 |
| 10 | Audit 持久化 | 文件存储 | 内存数组 (max 1000/2000 条) | 简化 | Phase 8+ 持久化 |
| 11 | Rate Limit 超限策略 | 超限排队等待 | 超限直接拒绝 | 简化实现 | 可迭代为队列 |
| 12 | Proactive 依赖 | proactive → agent-core + mcp-hub + compliance | proactive → shared + yaml（回调注入） | 更好解耦 | 正向偏差 |
| 13 | 通知推送 | Slack/邮件/企业微信 | 仅存 NotificationStore，API 查询 | Phase 6 聚焦调度 | Phase 8+ 补推送 |
| 14 | 阈值条件 | 完整表达式引擎 | 简单 `field op value` 解析 | Phase 6 简化 | Phase 6.5 增强 |
| 15 | Memory 结构 | org-memory 独立包 | 合并在 @synapse/memory 包内 | OrgMemory + Personal + Knowledge 聚合更自然 | 正向偏差 |

---

## 八、Phase 进度总览

| Phase | 目标 | 状态 | 完成日期 | Commits |
|-------|------|------|---------|---------|
| Phase 1 | 基础框架 (Monorepo + Model Router + Chat) | ✅ 完成 | 2026-03-01 | `a9ca802`, `1535d38` |
| Phase 2 | 工具系统 (Tool Registry + 内置工具 + Agent tool loop) | ✅ 完成 | 2026-03-01 | `57817ef` |
| Phase 3 | MCP Hub + 基础连接器 (database + http-api) | ✅ 完成 | 2026-03-01 | 待提交 |
| Phase 4 | 角色画像 + 合规引擎 (Pre-Hook + Post-Hook) | ✅ 完成 | 2026-03-01 | `97cec13`, `518fc80` |
| Phase 5 | 组织记忆 + 个人记忆 + 知识库 | ✅ 完成 | 2026-03-02 | `28ee1e7`, `7d9f339` |
| Phase 6 | 主动智能 (定时/事件/阈值) | ✅ 完成 | 2026-03-02 | 待提交 |
| Phase 6.5 | 决策智能 (数据→洞察→决策→战略) | 📋 待开始 | — | — |
| Phase 7 | Skill 系统 + 管理器 | 📋 待开始 | — | — |
| Phase 7.5 | Skill Marketplace | 📋 待开始 | — | — |
| Phase 8 | 企业业务系统 MCP Servers | 📋 待开始 | — | — |
| Phase 9 | 浏览器自动化 | 📋 待开始 | — | — |
| Phase 10 | Web UI | 📋 待开始 | — | — |

---

## 九、下一阶段（Phase 6.5）设计预检

Phase 6.5 将实现决策智能引擎，需要关注以下设计点：

### 需新建的包
- `packages/decision-engine/` — 决策智能引擎

### 需扩展的模块
- `@synapse/shared` 新增: Decision, Metric, Insight, Strategy 类型
- `@synapse/server` 新增: `/api/decision` 路由
- `@synapse/proactive` 可能: 与决策引擎的联动（洞察触发主动任务）

### 设计决策待定
- 指标采集: 定时 Agent 查询 vs 直接数据库轮询
- 洞察生成: LLM 分析 vs 规则引擎 vs 混合模式
- 战略追踪: 手动录入 vs 从洞察自动推导

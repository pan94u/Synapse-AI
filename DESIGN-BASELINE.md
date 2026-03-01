# Synapse AI — 设计基线 (Design Baseline)

> 追踪 PLAN.md 设计与代码实现之间的对齐关系。每个 Phase 结束后更新。
> 最后更新: 2026-03-01 | Phase 3 完成后

---

## 一、九层架构实现状态

| 层 | 名称 | PLAN.md 设计 | 实现状态 | 实现位置 | 偏差说明 |
|----|------|-------------|---------|---------|---------|
| ① | 用户与角色层 | 角色画像 Personas（职责、权限、默认技能、沟通风格） | ❌ 未实现 | — | Phase 4 |
| ② | 交互体验层 | Web UI (Next.js + shadcn/ui)，6 大功能模块 | ❌ 未实现 | — | Phase 10 |
| ③ | 服务网关层 | Hono API 路由、鉴权、角色上下文注入、SSE、WebSocket | ⚠️ 部分实现 | `packages/server/` | 已有: 路由 + SSE + CORS。缺: 鉴权、角色注入、WebSocket |
| ④ | 智能中枢层 | Agent 引擎 (Planner + Executor + Tool Loop + Model Router + 多 Agent 协调 + 上下文管理) | ⚠️ 部分实现 | `packages/agent-core/` | 已有: Model Router + Agent(run/runStream) + Tool Loop。缺: Planner、多 Agent 协调、上下文管理 |
| ⑤ | 合规引擎 | Pre-Hook + Post-Run Hook 双阶段 | ❌ 未实现 | — | Phase 4 |
| ⑥ | 主动智能 | 定时任务 + 事件触发 + 阈值监控 | ❌ 未实现 | — | Phase 6 |
| ⑥.5 | 决策智能 | 数据采集→指标→洞察→决策→战略追踪 | ❌ 未实现 | — | Phase 6.5 |
| ⑦ | 能力层 | 技能系统 + 内置工具 + 记忆 + 知识 | ⚠️ 部分实现 | `packages/agent-core/src/tools/` | 已有: 5 个内置工具 + ToolRegistry + ToolExecutor。缺: Skill 系统、记忆、知识库 |
| ⑧ | 企业集成层 | MCP Hub (Registry + Aggregator + Router + Auth + Health + Audit + Rate Limit) | ✅ 基础实现 | `packages/mcp-hub/` | Phase 3 完成核心框架。缺: Auth Gateway（凭证加密）、Router（独立路由模块） |
| ⑨ | 企业数字化系统 | 人财法 CRM ERP 等 MCP Servers | ⚠️ 基础实现 | `packages/mcp-servers/` | 已有: database (SQLite) + http-api。缺: 全部业务系统 Adapter |

---

## 二、包（Package）实现状态

### 2.1 已实现的包

| 包 | PLAN.md 规划 | 实际实现 | 完整度 |
|----|-------------|---------|--------|
| `@synapse/shared` | ChatMessage, Tool, Model, MCP 等全部共享类型 | Chat 类型 + Tool 类型 + Model 类型 + MCP 类型 | 70% — 缺 Skill/Memory/Persona/Compliance/Decision 类型 |
| `@synapse/agent-core` | Model Router + Agent + Tools + Skills + Memory | Model Router + Agent + Tools (5 内置) | 40% — 缺 Planner/Skills/Memory/多 Agent |
| `@synapse/mcp-hub` | Hub + Client + Registry + Lifecycle + Aggregator + Router + Auth + Health + Audit + Rate Limiter | Hub + Client + Registry + Lifecycle + Aggregator + Health + Audit + Rate Limiter | 80% — 缺 Auth Gateway (凭证加密) + 独立 Router 模块 |
| `@synapse/mcp-servers` | 15+ 个 MCP Server (database, http-api, git, feishu, wxwork, email, hrm, finance, legal, crm, erp, bi, dms) + base 基类 | database (SQLite) + http-api | 10% — 基础设施层 2/4，业务系统层 0/5，通讯层 0/3 |
| `@synapse/server` | Hono API 全部路由 (chat, agent, mcp, tasks, skills, marketplace, personas, decision, compliance, proactive, org-memory, memory, knowledge, settings) + middleware + ws | chat + agent + mcp (5 endpoints) + health | 20% — 3/14+ 路由模块 |

### 2.2 未实现的包

| 包 | 规划 Phase | 说明 |
|----|-----------|------|
| `packages/personas/` | Phase 4 | 角色画像系统 |
| `packages/compliance/` | Phase 4 | 合规引擎 (Pre-Hook + Post-Hook) |
| `packages/org-memory/` | Phase 5 | 组织记忆 |
| `packages/proactive/` | Phase 6 | 主动智能引擎 |
| `packages/decision-engine/` | Phase 6.5 | 决策智能引擎 |
| `packages/skill-manager/` | Phase 7 | 技能管理器 |
| `packages/skill-marketplace/` | Phase 7.5 | 技能市场 |
| `packages/knowledge/` | Phase 5 | 知识库引擎 |
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
| Planner | 将复杂任务分解为多步骤 | ❌ | 未来 Phase |
| Executor | 逐步执行，支持循环和条件 | ❌ 仅有单步 tool loop | 简化版 |
| 多 Agent 协调器 | 跨部门协作 | ❌ | 未来 Phase |
| 上下文管理 | 角色 + 记忆 + 知识 → System Prompt | ❌ | Phase 4-5 |

### 3.3 工具系统（⑦ 能力层）

| 设计项 | PLAN.md 设计 | 实现 | 状态 |
|--------|-------------|------|------|
| Tool 接口 | definition + permission + execute | ✅ `tools/types.ts` | 完全匹配 |
| ToolRegistry | register / get / list / getPermission | ✅ `tools/registry.ts` | 完全匹配 |
| ToolExecutor | 单个执行 + 批量并行 + 权限检查 | ✅ `tools/executor.ts` | 完全匹配 |
| file_read | 读取文件（max 100KB） | ✅ `built-in/file-read.ts` | 完全匹配 |
| file_write | 写入文件 | ✅ `built-in/file-write.ts` | 完全匹配 |
| file_search | Glob 搜索文件 | ✅ `built-in/file-search.ts` | 完全匹配 |
| shell_exec | Shell 命令 (30s timeout, permission=ask) | ✅ `built-in/shell-exec.ts` | 完全匹配 |
| web_fetch | HTTP 请求 | ✅ `built-in/web-fetch.ts` | 完全匹配 |
| browser_* | 浏览器自动化 (4 工具) | ❌ | Phase 9 |
| memory_* | 记忆读写 (2 工具) | ❌ | Phase 5 |
| knowledge_search | 知识库搜索 | ❌ | Phase 5 |

### 3.4 MCP Hub（⑧ 企业集成层）

| 设计项 | PLAN.md 设计 | 实现 | 状态 | 偏差 |
|--------|-------------|------|------|------|
| MCP SDK | `@modelcontextprotocol/sdk` | ✅ ^1.27.0 | — | PLAN 写 ^1.0.0，实际用更新版 |
| Client | JSON-RPC over stdio/SSE | ✅ `client.ts` stdio 模式 | ⚠️ | SSE 传输未实现 |
| Registry | 发现、注册、注销、状态管理 | ✅ `registry.ts` | 完全匹配 | — |
| Lifecycle | 启动/停止/重启/startAll | ✅ `lifecycle.ts` | 完全匹配 | — |
| Aggregator | 汇总 MCP tools → Agent Tool 适配器 | ✅ `aggregator.ts` | 完全匹配 | 工具名前缀 `${serverId}_${toolName}` |
| Router | tool_call 路由到对应 Server | ⚠️ 集成在 aggregator | 简化 | PLAN 设计独立 Router 模块，实现中路由逻辑内嵌在适配器闭包中 |
| Auth Gateway | 凭证加密 + OAuth Token 自动刷新 | ❌ | 未实现 | Phase 3 设计决策: env 变量直传，Phase 4 再加密 |
| Health Monitor | 定时心跳 + 指数退避重连 | ✅ `health.ts` | 完全匹配 | 退避: 1s→2s→...→30s |
| Audit Logger | 全链路审计 | ⚠️ `audit.ts` | 简化版 | console.log + 内存数组 (max 1000)，缺 userId、approved 字段 |
| Rate Limiter | 滑动窗口限流 | ✅ `rate-limiter.ts` | 完全匹配 | — |
| Config Loader | 扫描 JSON + `${env:VAR}` 解析 | ✅ `config.ts` | 完全匹配 | — |

**PLAN.md 中的 MCP 数据模型 vs 实现对比：**

| 类型 | PLAN.md 字段 | 实际实现 | 偏差 |
|------|-------------|---------|------|
| `MCPServerConfig` | id, name, description, transport, command, args, url, env, enabled, autoStart, healthCheck, rateLimit, permissions, tags, category | ✅ 全部匹配 | — |
| `MCPServerInstance` | config, status, pid, connectedAt, lastHealthCheck, error, tools, resources, prompts, metrics | ⚠️ 大部分 | 缺 pid, resources, prompts（Resources/Prompts 能力未实现） |
| `MCPToolInfo` (MCPTool) | name, description, serverId, requireApproval + inputSchema | ⚠️ | `MCPToolInfo` 缺 inputSchema（在 aggregator 中通过 `listToolsWithSchemas` 获取） |
| `MCPAuditEntry` | id, timestamp, userId, serverId, action, target, input, output, latencyMs, approved | ⚠️ | 缺 userId, approved 字段（Phase 4 角色系统后补充） |
| `MCPServerCategory` | 11 种类型 | ✅ 完全匹配 | — |
| `MCPResource` | uri, name, description, mimeType, serverId | ❌ | MCP Resources 能力整体未实现 |
| `MCPPrompt` | — | ❌ | MCP Prompts 能力整体未实现 |

### 3.5 MCP Servers（⑨ 企业数字化系统）

#### 基础设施层

| Server | PLAN.md 设计 | 实现 | 工具对比 |
|--------|-------------|------|---------|
| **database** | MySQL / PostgreSQL / SQLite: `db_query`, `db_execute`, `db_describe`, `db_list_tables` | ✅ SQLite only | 已有: db_query, db_execute, db_list_tables。缺: db_describe + MySQL/PG 支持 |
| **http-api** | `api_get`, `api_post`, `api_put`, `api_delete`, `api_graphql` | ✅ 统一 `http_request` | 偏差: PLAN 设计 5 个分方法工具，实际合并为 1 个通用 http_request（更灵活） |
| **git** | `git_clone`, `git_pr_create`, `git_issue_list`, `git_diff` | ❌ | Phase 8 |
| **email** | `email_send`, `email_search`, `email_read`, `email_reply` | ❌ | Phase 8 |

#### 协作通讯层

| Server | 实现 | 说明 |
|--------|------|------|
| **feishu** | ❌ | Phase 8 |
| **wechat-work** | ❌ | Phase 8 |

#### 业务系统层

| Server | 实现 | 说明 |
|--------|------|------|
| **hrm** | ❌ | Phase 8 + Adapter Pattern |
| **finance** | ❌ | Phase 8 + Adapter Pattern |
| **legal** | ❌ | Phase 8 + Adapter Pattern |
| **crm** | ❌ | Phase 8 + Adapter Pattern |
| **erp** | ❌ | Phase 8 + Adapter Pattern |
| **bi** | ❌ | Phase 8 |
| **dms** | ❌ | Phase 8 |

**注**: PLAN.md 设计了 `base/` 基类 (`BaseMCPServer`) + `DomainAdapter` 接口，实际实现中 MCP Servers 直接使用 `@modelcontextprotocol/sdk` 的 `McpServer` 类，未抽象基类（当前只有 2 个 Server，抽象过早）。

### 3.6 Server API（③ 服务网关层）

| 端点 | PLAN.md 设计 | 实现 | 状态 |
|------|-------------|------|------|
| `GET /health` | 健康检查 | ✅ | 完全匹配 |
| `POST /api/chat` | 流式/非流式 Chat（仅 Model Router） | ✅ | 完全匹配 |
| `POST /api/agent` | 流式/非流式 Agent（含 Tool Loop） | ✅ | 完全匹配 |
| `GET /api/mcp/servers` | MCP Server 状态列表 | ✅ | 完全匹配 |
| `GET /api/mcp/servers/:id` | 单个 Server 详情 | ✅ | 完全匹配 |
| `POST /api/mcp/servers/:id/restart` | 重启 Server | ✅ | 完全匹配 |
| `GET /api/mcp/tools` | 聚合 MCP 工具列表 | ✅ | 完全匹配 |
| `GET /api/mcp/audit` | 审计日志查询 | ✅ | 完全匹配 |
| `/api/tasks` | 任务管理 | ❌ | 未来 Phase |
| `/api/skills` | 技能管理 | ❌ | Phase 7 |
| `/api/marketplace` | 技能市场 | ❌ | Phase 7.5 |
| `/api/personas` | 角色画像 | ❌ | Phase 4 |
| `/api/decision` | 决策智能 | ❌ | Phase 6.5 |
| `/api/compliance` | 合规引擎 | ❌ | Phase 4 |
| `/api/proactive` | 主动智能 | ❌ | Phase 6 |
| `/api/org-memory` | 组织记忆 | ❌ | Phase 5 |
| `/api/memory` | 个人记忆 | ❌ | Phase 5 |
| `/api/knowledge` | 个人知识库 | ❌ | Phase 5 |
| `/api/settings` | 系统设置 | ❌ | Phase 10 |

---

## 四、配置体系实现状态

| 配置目录 | PLAN.md 设计 | 实现 | 说明 |
|---------|-------------|------|------|
| `config/mcp-servers/` | 全部 MCP Server JSON 配置 + _template.json + schema.json | ✅ database.json + http-api.json | 2/15+ 配置文件 |
| `config/personas/` | 7 个角色画像 YAML + _template.yaml | ❌ | Phase 4 |
| `config/compliance/rules/` | finance/legal/hr/general YAML 规则 | ❌ | Phase 4 |
| `config/compliance/approval-flows.yaml` | 审批流定义 | ❌ | Phase 4 |
| `config/proactive/` | schedules/triggers/monitors YAML | ❌ | Phase 6 |
| `config/decision/` | metrics/collection/insight-rules/strategy YAML | ❌ | Phase 6.5 |

---

## 五、数据目录实现状态

| 数据目录 | PLAN.md 设计 | 实现 | 说明 |
|---------|-------------|------|------|
| `data/memory/` | conversations/ + facts/ + tasks/ | ❌ | Phase 5 |
| `data/org-memory/` | knowledge/ + decisions/ + lessons/ + policies/ | ❌ | Phase 5 |
| `data/knowledge/` | 文档 + 嵌入索引 | ❌ | Phase 5 |
| `data/marketplace/` | index.json + downloads/ | ❌ | Phase 7.5 |
| `data/mcp/credentials/` | 加密凭证 (AES-256-GCM) | ❌ | Phase 4 |
| `data/mcp/cache/` | MCP 响应缓存 | ❌ | 未规划具体 Phase |
| `data/mcp/audit/` | 持久化审计日志 | ❌ | 当前内存版，Phase 4 持久化 |
| `data/compliance/` | audit-trail/ + pending-approvals/ | ❌ | Phase 4 |
| `data/proactive/` | task-history/ + alert-log/ | ❌ | Phase 6 |
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
@synapse/shared (无依赖)                               ✅
  ├── @synapse/agent-core (shared, openai)             ✅
  ├── @synapse/mcp-hub (shared, @modelcontextprotocol/sdk, zod)  ✅
  │     └── @synapse/server (shared, agent-core, mcp-hub, hono)  ✅
  └── @synapse/mcp-servers (@modelcontextprotocol/sdk, zod)  ✅ 独立进程
```

---

## 七、已知偏差记录

| # | 偏差 | PLAN.md 设计 | 实际实现 | 原因 | 影响 |
|---|------|-------------|---------|------|------|
| 1 | MCP Auth | Auth Gateway: 凭证加密 AES-256-GCM + OAuth Token 刷新 | env 变量直传，无加密 | Phase 3 简化决策 | Phase 4 补齐 |
| 2 | MCP Audit | userId + approved 字段 | 无 userId/approved | 角色系统未实现 | Phase 4 角色系统后补 |
| 3 | MCP Router | 独立 Router 模块 | 路由逻辑内嵌在 Aggregator 适配器闭包中 | 只有 2 个 Server，独立模块过早抽象 | 多 Server 时可提取 |
| 4 | MCP Resources/Prompts | Server 暴露 Resources + Prompts | 未实现 | Phase 3 聚焦 Tools 能力 | 按需补充 |
| 5 | Database Server | MySQL/PostgreSQL/SQLite 多数据库 | 仅 SQLite (`bun:sqlite`) | 零配置本地验证优先 | Phase 8 加 MySQL/PG |
| 6 | HTTP API Server | 5 个分方法工具 (api_get/post/put/delete/graphql) | 1 个通用 http_request | 合并更灵活，减少工具数量 | 正向偏差，无需改回 |
| 7 | MCP Server 基类 | `BaseMCPServer` + `DomainAdapter` 接口 | 直接使用 SDK `McpServer` | 仅 2 个 Server，抽象过早 | Phase 8 多 Server 时抽象 |
| 8 | Agent Route | 模块级创建 Agent | 函数工厂 `createAgentRoutes(agent)` 注入 | 支持 MCP 工具动态注入 | 正向改进 |
| 9 | App 初始化 | 同步 `const app` 直接导出 | `async createApp()` + 顶层 await | MCP Hub 需要异步启动 | 正向改进，消除竞态 |
| 10 | Audit 持久化 | 文件存储 `data/mcp/audit/` | 内存数组 (max 1000 条) | Phase 3 简化 | Phase 4 持久化 |
| 11 | Rate Limit 超限策略 | 超限排队等待 | 超限直接拒绝 (throw Error) | 简化实现 | 可迭代为队列 |

---

## 八、Phase 进度总览

| Phase | 目标 | 状态 | 完成日期 | Commits |
|-------|------|------|---------|---------|
| Phase 1 | 基础框架 (Monorepo + Model Router + Chat) | ✅ 完成 | 2026-03-01 | `a9ca802`, `1535d38` |
| Phase 2 | 工具系统 (Tool Registry + 内置工具 + Agent tool loop) | ✅ 完成 | 2026-03-01 | `57817ef` |
| Phase 3 | MCP Hub + 基础连接器 (database + http-api) | ✅ 完成 | 2026-03-01 | 待提交 |
| Phase 4 | 角色画像 + 合规引擎 (Pre-Hook + Post-Hook) | 📋 待开始 | — | — |
| Phase 5 | 组织记忆 + 个人记忆 + 知识库 | 📋 待开始 | — | — |
| Phase 6 | 主动智能 (定时/事件/阈值) | 📋 待开始 | — | — |
| Phase 6.5 | 决策智能 (数据→洞察→决策→战略) | 📋 待开始 | — | — |
| Phase 7 | Skill 系统 + 管理器 | 📋 待开始 | — | — |
| Phase 7.5 | Skill Marketplace | 📋 待开始 | — | — |
| Phase 8 | 企业业务系统 MCP Servers | 📋 待开始 | — | — |
| Phase 9 | 浏览器自动化 | 📋 待开始 | — | — |
| Phase 10 | Web UI | 📋 待开始 | — | — |

**注意**: PLAN.md 原始阶段编号与 CLAUDE.md 中不一致（CLAUDE.md Phase 3=Skill, PLAN.md Phase 3=MCP Hub）。**以 PLAN.md 为准**，CLAUDE.md 需同步更新。

---

## 九、下一阶段（Phase 4）设计预检

Phase 4 将实现角色画像 + 合规引擎，需要关注以下设计点：

### 需新建的包
- `packages/personas/` — 角色画像系统
- `packages/compliance/` — 合规引擎

### 需扩展的模块
- `@synapse/shared` 新增: Persona, ComplianceRule, PreHookResult, PostRunResult 类型
- `@synapse/mcp-hub/audit.ts` 补充: userId, approved 字段
- `@synapse/mcp-hub` 新增: `auth.ts` 凭证加密存储
- `@synapse/server` 新增: `/api/personas`, `/api/compliance` 路由 + auth middleware

### 设计决策待定
- 合规规则 DSL 解析器: 自研 vs 复用 zod/ajv
- 审批流: 内嵌简单审批 vs 对接飞书/企微审批 API
- 凭证加密: Web Crypto API vs node:crypto

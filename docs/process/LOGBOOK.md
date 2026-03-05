# Synapse AI — 开发日志 (Logbook)

> 每个 Session 一条记录，遵循 PDCA 微循环。
> 格式：目标 → 实施 → 文件变更 → 经验沉淀 → 统计快照

---

## Session 1 — Phase 1: Monorepo 骨架 + Model Router + 流式 Chat

**日期**: 2026-03-01
**Commit**: `a9ca802` feat: Phase 1 — Monorepo skeleton + Model Router + Hono streaming chat
**Fix Commit**: `1535d38` fix: correct MiniMax baseURL to api.minimaxi.com + add error handling

### Plan（目标）

从零搭建 Monorepo 基础骨架，实现 Model Router 和流式 Chat 端点，验证双 LLM 引擎（MiniMax 2.5 + Claude）的可行性。

### Do（实施）

1. **Monorepo 基础设施**
   - Bun workspaces + Turborepo v2 构建管道
   - `tsconfig.base.json` 统一 TS 编译配置（ESNext + bundler moduleResolution）
   - `.gitignore`、`turbo.json`、根 `package.json`

2. **@synapse/shared（共享类型）**
   - `ChatMessage`（role: system/user/assistant）、`ChatRequest`、`ChatResponse`
   - `ChatStreamChunk`、`TokenUsage`、`RoutingStrategy`
   - `ProviderId`、`ModelConfig`、`ProviderConfig`

3. **@synapse/agent-core（Agent 引擎）**
   - `ModelRouter`: 模型选择路由（default / cost-optimized / quality-first 策略）
   - `MiniMaxProvider`: OpenAI 兼容格式调用 MiniMax-M2.5 / MiniMax-M1
   - `ClaudeProvider`: OpenAI 兼容格式调用 Claude Sonnet 4 / Claude Opus 4
   - `createDefaultRouter()` 工厂函数

4. **@synapse/server（API 服务）**
   - Hono 框架 + CORS + Logger 中间件
   - `GET /health` 健康检查
   - `POST /api/chat` 流式/非流式 Chat 端点（SSE）

5. **Bug 修复**
   - MiniMax 中国区 baseURL 纠正: `api.minimaxi.com/v1`（不是 `api.minimax.com`）
   - Chat 路由增加 try/catch 错误处理

### Check（验证）

| 测试项 | 结果 |
|--------|------|
| `bun run typecheck` (3 packages) | 通过 |
| `GET /health` | `{"status":"ok"}` |
| `POST /api/chat` 非流式 | 返回 ChatResponse |
| `POST /api/chat` SSE 流式 | 逐块返回 + `[DONE]` |

### Act（经验沉淀）

- **MiniMax 中国区 URL**: `https://api.minimaxi.com/v1`，注意 `minimaxi` 不是 `minimax`
- **OpenAI SDK 统一性**: MiniMax 和 Claude 都可用 `openai` npm 包，只需换 `baseURL` + `apiKey`
- **Turborepo pipeline**: `shared` 必须先构建，其他包才能 typecheck

### 统计快照

| 指标 | 值 |
|------|-----|
| 新建文件 | 26 |
| 修改文件 | 0 |
| 代码行数 (净增) | +4,470 (含文档 ~3,770) |
| Packages | 3 (`shared`, `agent-core`, `server`) |
| Commits | 2 (`a9ca802`, `1535d38`) |
| 类型检查 | 3/3 通过 |

---

## Session 2 — Phase 2: Tool System + Agent Tool Loop + 内置工具

**日期**: 2026-03-01
**Commit**: `57817ef` feat: Phase 2 — Tool system + Agent tool loop + built-in tools

### Plan（目标）

实现完整的工具系统，让 Agent 具备调用工具的能力：Tool 注册 → Agent 识别 tool_call → 执行工具 → 将结果反馈给 LLM → 循环直到最终回复。

### Do（实施）

1. **共享类型扩展**
   - `ToolDefinition`（name, description, parameters JSON Schema）
   - `ToolCall`（id, name, arguments）、`ToolResult`（callId, name, content, isError）
   - `ToolPermission`（always / ask / deny）、`ToolConfig`
   - `ChatMessage` 扩展: 新增 `tool` role、`toolCalls`、`toolCallId` 字段

2. **Provider Tool Calling 支持**
   - `MiniMaxProvider` + `ClaudeProvider`: 流式和非流式均支持 function calling
   - `CompletionParams`/`CompletionResult`/`StreamChunk` 扩展 tools 和 toolCalls 字段
   - `utils.ts`: 内部 ↔ OpenAI 格式的工具定义和调用转换工具
   - `extractThinking()`: 处理 MiniMax `reasoning_details` 格式

3. **Tool 基础设施**
   - `Tool` 接口: `{ definition, permission, execute(args) → Promise<string> }`
   - `ToolRegistry`: Map 存储，register / get / list / getPermission
   - `ToolExecutor`: 单个执行 + 批量并行执行，权限检查 + 错误处理

4. **5 个内置工具**
   - `file_read`: 读取文件（最大 100KB）
   - `file_write`: 写入/创建文件
   - `file_search`: 搜索文件内容（正则）
   - `shell_exec`: 执行 Shell 命令（30s 超时，permission=ask）
   - `web_fetch`: 抓取网页内容

5. **Agent 类（核心 Tool Loop）**
   - `run()`: 同步执行，最多 10 轮迭代
   - `runStream()`: AsyncIterable 流式执行，发出 text/tool_call/tool_result/done 事件
   - `createDefaultAgent()` 工厂: router + registry + executor + 内置工具

6. **API 端点**
   - `POST /api/agent`: SSE 流式端点，4 种事件类型

### Check（验证）

| 测试项 | 结果 |
|--------|------|
| `bun run typecheck` (3 packages) | 通过 |
| `POST /api/agent` 纯文本对话 | 正常回复，无 tool_call |
| `POST /api/agent` file_read | Agent 调用 file_read → 返回文件内容 |
| `POST /api/agent` shell_exec | Agent 调用 shell_exec → 返回命令输出 |
| SSE 流式 + tool loop | text → tool_call → tool_result → text → done |

### Act（经验沉淀）

- **Tool Loop 上限**: 默认 10 轮迭代防止死循环，可通过 `maxIterations` 配置
- **Permission 简化**: Phase 2 将 `ask` 当作 `always` 处理，Phase 4 合规引擎再做审批流
- **流式 Tool Calling**: MiniMax 和 Claude 的 function_call chunk 格式不同，统一在 Provider 层处理
- **批量执行**: `executeBatch` 使用 `Promise.all` 并行执行，提升多工具场景效率

### 统计快照

| 指标 | 值 |
|------|-----|
| 新建文件 | 14 |
| 修改文件 | 7 |
| 代码行数 (净增) | +854 行代码, -35 行重构 |
| 内置工具 | 5 个 |
| Agent 流事件类型 | 4 种 (text, tool_call, tool_result, done) |
| Commits | 1 (`57817ef`) |
| 类型检查 | 3/3 通过 |

---

## Session 3 — Phase 3: MCP Hub + Database/HTTP-API MCP Servers + Agent 集成

**日期**: 2026-03-01
**Commit**: 待提交（所有文件已创建，typecheck 通过）

### Plan（目标）

实现 MCP Hub 管理框架，让 Agent "能连通企业系统"——通过 MCP Hub 管理 MCP Server 连接，将外部工具自动注入 Agent。验证场景：Agent 通过 MCP 调用 SQLite 数据库。

### Do（实施）

1. **MCP 共享类型（@synapse/shared）**
   - `MCPServerCategory`: 11 种分类（infrastructure, communication, development, hrm, finance, legal, crm, erp, analytics, document, custom）
   - `MCPServerConfig`: 完整服务器配置（transport, command, args, env, healthCheck, rateLimit, permissions）
   - `MCPServerStatus`: 运行时状态（6 种状态 + tools + metrics）
   - `MCPToolInfo`, `MCPMetrics`, `MCPAuditEntry`

2. **@synapse/mcp-hub 包（10 个源文件）**
   - `types.ts`: `MCPServerInstance` 运行时实例、`createInitialInstance()`、`instanceToStatus()` 转换
   - `config.ts`: 配置加载器，扫描 `config/mcp-servers/*.json`，支持 `${env:VAR}` 变量解析
   - `client.ts`: `MCPClient` 封装 `@modelcontextprotocol/sdk` 的 `Client` + `StdioClientTransport`
     - connect / disconnect / refreshTools / callTool / metrics 统计（running average latency）
   - `registry.ts`: `MCPRegistry` — 服务器注册表，按 ID 管理、按状态查询
   - `lifecycle.ts`: `MCPLifecycle` — 生命周期管理，startServer / stopServer / restartServer / startAll / stopAll
     - `startAll()` 自动启动 `autoStart=true` 的服务器，使用 `Promise.allSettled` 隔离失败
   - `health.ts`: `MCPHealthMonitor` — 定时健康检查 + 指数退避重连（1s → 2s → 4s → ... → 30s 上限）
     - 连续 N 次失败后标记 error 状态，不阻塞其他 server
   - `rate-limiter.ts`: `MCPRateLimiter` — 滑动窗口限流（内存 Map + timestamps 数组）
   - `audit.ts`: `MCPAuditLogger` — console.log + 内存数组审计日志（最近 1000 条，UUID + 时间戳）
   - `aggregator.ts`: `MCPAggregator` — 核心集成点，将 MCP tool 包装为 agent-core `Tool` 适配器
     - 工具名前缀 `${serverId}_${toolName}` 避免冲突
     - 每次调用自动做限流检查 + 审计日志记录
     - `requireApproval` 通配符匹配（如 `db_execute` → permission=ask）
   - `hub.ts`: `MCPHub` 主类 — 一键 start/stop，编排 config → register → lifecycle → health → aggregate
   - `index.ts`: 导出所有公开 API

3. **@synapse/mcp-servers 包（2 个 MCP Server）**
   - `database/index.ts`: SQLite MCP Server（`bun:sqlite` + `McpServer` + `StdioServerTransport`）
     - `db_query`: 只允许 SELECT/PRAGMA/EXPLAIN，返回 JSON 行数组
     - `db_execute`: INSERT/UPDATE/DELETE，返回 affected rows
     - `db_list_tables`: 列出所有表（排除 sqlite_ 内部表）
     - WAL 模式启用，参数化查询防注入
   - `http-api/index.ts`: 通用 REST 代理 MCP Server
     - `http_request`: 支持 GET/POST/PUT/PATCH/DELETE/HEAD
     - 可配置 Base URL + Auth Header/Value

4. **配置文件**
   - `config/mcp-servers/database.json`: 启用，autoStart=true，限流 100req/min，`db_execute` 需审批
   - `config/mcp-servers/http-api.json`: 默认禁用，限流 60req/min

5. **Agent 集成**
   - `agent-core/src/index.ts`: 新增 `createAgentWithMCP(mcpTools)` 工厂，内置工具 + MCP 工具合并注册
   - `MCPToolAdapter` 接口避免循环依赖（不 import @synapse/mcp-hub）

6. **Server 集成**
   - `server/src/app.ts`: 重构为 `async createApp()` 工厂，顺序：Hub.start() → getTools() → createAgentWithMCP → 注册路由
     - 失败降级：MCP Hub 启动失败则 fallback 到 `createDefaultAgent()`（无 MCP 工具）
   - `server/src/index.ts`: 顶层 await `createApp()`，消除路由注册竞态条件
   - `server/src/routes/agent.ts`: 重构为 `createAgentRoutes(agent)` 工厂函数，接受注入的 Agent
   - `server/src/routes/mcp.ts`: 5 个 MCP 管理端点
     - `GET /api/mcp/servers` — 所有 Server 状态列表
     - `GET /api/mcp/servers/:id` — 单个 Server 详情
     - `POST /api/mcp/servers/:id/restart` — 重启 Server
     - `GET /api/mcp/tools` — 所有聚合 MCP 工具列表
     - `GET /api/mcp/audit` — 审计日志查询（支持 serverId + limit 过滤）

### Check（验证）

| 测试项 | 结果 |
|--------|------|
| `bun run typecheck` (5 packages) | 5/5 通过，零错误 |
| `bun install` 依赖安装 | 156 packages，含 @modelcontextprotocol/sdk |
| 类型安全 | SQLite bindings 类型修复（`unknown[]` → 联合类型） |
| 依赖拓扑 | shared → agent-core, mcp-hub → server; mcp-servers 独立 |

**运行时验证**（`DATABASE_PATH=/tmp/test-synapse.sqlite bun run packages/server/src/index.ts`）：

| 测试项 | 命令 | 结果 |
|--------|------|------|
| 服务启动 | 启动日志 | ✅ Hub 加载 1 个 enabled server，database connected with 3 tools |
| 健康检查 | `GET /health` | ✅ `{"status":"ok"}` |
| MCP Server 列表 | `GET /api/mcp/servers` | ✅ database status: connected，3 tools，metrics 正常 |
| 单个 Server 详情 | `GET /api/mcp/servers/database` | ✅ 完整状态含 connectedAt、lastHealthCheck、tools、metrics |
| Server 不存在 | `GET /api/mcp/servers/nonexistent` | ✅ 404 `{"error":"Server \"nonexistent\" not found"}` |
| MCP 工具列表 | `GET /api/mcp/tools` | ✅ 3 个工具: database_db_query(always), database_db_execute(ask), database_db_list_tables(always) |
| 重启 Server | `POST /api/mcp/servers/database/restart` | ✅ `success: true`，重新连接，新 connectedAt |
| 审计日志（空） | `GET /api/mcp/audit` | ✅ `{"entries":[]}` |
| Agent 纯文本 | `POST /api/agent "Say hello"` | ✅ 纯文本回复，toolCallsExecuted: 0 |
| Agent 查表 | `POST /api/agent "List all tables"` | ✅ tool_call → db_list_tables → "empty database"，toolCallsExecuted: 1 |
| Agent 建表+插入+查询 | `POST /api/agent "Create employees table, insert 3 rows, query all"` | ✅ 3 次 tool_call (CREATE TABLE → INSERT 3 rows → SELECT *)，返回格式化表格 |
| 审计日志（调用后） | `GET /api/mcp/audit` | ✅ 4 条记录，含 serverId、action、input SQL、output、latencyMs (3-13ms) |
| 健康监控 | lastHealthCheck 时间戳 | ✅ 每 30s 自动更新，心跳正常 |

### Act（经验沉淀）

- **MCP SDK stdio 模式**: `StdioClientTransport` 自己 spawn 子进程，不需要手动 `Bun.spawn`
- **循环依赖规避**: `mcp-hub` 不依赖 `agent-core`，而是定义兼容的 `AgentTool` 接口，由 `server` 层桥接
- **异步初始化**: Hono 路由动态注册在导出后可能有竞态，改用 `async createApp()` + 顶层 await 保证启动顺序
- **降级策略**: MCP Hub 失败不应阻塞整个服务，fallback 到纯内置工具 Agent
- **bun:sqlite 类型**: `stmt.all(...params)` 的 params 必须是 `SQLQueryBindings[]`，不能直接传 `unknown[]`，需要类型收窄
- **工具名前缀**: `${serverId}_${toolName}` 格式防止多个 MCP Server 工具名冲突
- **本地代理干扰**: `curl` 走 `http_proxy` 代理会导致 localhost 请求 502，需 `--noproxy localhost`
- **MCP 工具延迟**: SQLite 工具调用延迟 3-13ms，完全满足实时对话需求

### 文件变更表

**新建 21 个文件**:
```
packages/shared/src/types/mcp.ts                    # MCP 共享类型 (6 interfaces + 1 type)
packages/mcp-hub/package.json                       # 包配置 (依赖: shared, mcp-sdk, zod)
packages/mcp-hub/tsconfig.json                      # TS 配置
packages/mcp-hub/src/index.ts                       # 公开 API 导出
packages/mcp-hub/src/types.ts                       # 内部运行时类型
packages/mcp-hub/src/config.ts                      # 配置加载 + ${env:VAR} 解析
packages/mcp-hub/src/client.ts                      # MCP Client 封装
packages/mcp-hub/src/registry.ts                    # Server 注册表
packages/mcp-hub/src/lifecycle.ts                   # 生命周期管理
packages/mcp-hub/src/health.ts                      # 健康监控 + 指数退避重连
packages/mcp-hub/src/rate-limiter.ts                # 滑动窗口限流器
packages/mcp-hub/src/audit.ts                       # 审计日志 (内存 + console)
packages/mcp-hub/src/aggregator.ts                  # MCP→Agent Tool 适配器
packages/mcp-hub/src/hub.ts                         # Hub 主编排类
packages/mcp-servers/package.json                   # MCP Servers 包配置
packages/mcp-servers/tsconfig.json                  # TS 配置
packages/mcp-servers/src/database/index.ts          # SQLite MCP Server (3 tools)
packages/mcp-servers/src/http-api/index.ts          # HTTP API MCP Server (1 tool)
config/mcp-servers/database.json                    # Database 配置 (enabled)
config/mcp-servers/http-api.json                    # HTTP API 配置 (disabled)
packages/server/src/routes/mcp.ts                   # MCP 管理 API 路由 (5 endpoints)
```

**修改 7 个文件**:
```
packages/shared/src/index.ts                        # +9 行: 导出 MCP 类型
packages/agent-core/src/index.ts                    # +30 行: createAgentWithMCP() + MCPToolAdapter
packages/server/package.json                        # +1 行: @synapse/mcp-hub 依赖
packages/server/src/app.ts                          # 重写: async createApp() + MCP 初始化
packages/server/src/index.ts                        # 重写: 顶层 await createApp()
packages/server/src/routes/agent.ts                 # 重构: createAgentRoutes(agent) 工厂
bun.lock                                            # 自动更新
```

### 统计快照

| 指标 | 值 |
|------|-----|
| 新建文件 | 21 |
| 修改文件 | 7 |
| 新增 Packages | 2 (`mcp-hub`, `mcp-servers`) |
| 总 Packages | 5 (`shared`, `agent-core`, `mcp-hub`, `mcp-servers`, `server`) |
| MCP 管理端点 | 5 个 |
| MCP Server 工具 | 4 个 (db_query, db_execute, db_list_tables, http_request) |
| 类型检查 | 5/5 通过 |
| 外部依赖新增 | @modelcontextprotocol/sdk ^1.27.0, zod ^3.24.0 |

### 依赖拓扑

```
@synapse/shared (无依赖)
  ├── @synapse/agent-core (shared, openai)
  ├── @synapse/mcp-hub (shared, @modelcontextprotocol/sdk, zod)
  │     └── @synapse/server (shared, agent-core, mcp-hub, hono)
  └── @synapse/mcp-servers (@modelcontextprotocol/sdk, zod)  ← 独立进程
```

---

## Session 4 — Phase 4: 角色画像 + 合规引擎 (Pre-Hook + Post-Hook)

**日期**: 2026-03-01
**Commit**: `97cec13` feat: Phase 4 — Role Personas + Compliance Engine (Pre-Hook + Post-Hook)
**Fix Commit**: `518fc80` fix: align persona and compliance configs with MCP-prefixed tool names

### Plan（目标）

让 Agent "知道为谁服务"和"什么不能做"——通过角色画像控制每个用户看到什么工具、用什么风格交互，通过合规引擎在工具执行前后实施规则校验（Pre-Hook 拦截 + Post-Hook 脱敏）。

### Do（实施）

1. **共享类型扩展（@synapse/shared）**
   - `PersonaConfig`: 角色画像定义（personality, allowedTools, complianceRuleset, proactiveTasks 等）
   - `PersonaContext`: 运行时角色上下文（systemPromptAddition, allowedTools 列表）
   - `PreHookResult`: 4 种动作（allow / deny / require_approval / modify）
   - `PostHookResult`: 5 种动作（pass / mask / flag / notify / revoke）
   - `ComplianceRule`, `ComplianceRuleSet`: 合规规则内部表示
   - `AuditTrailEntry`: 全链路审计记录（persona → pre → execution → post → latency）
   - `MCPAuditEntry` 扩展: 新增 userId, personaId, approved 可选字段

2. **@synapse/personas 包（4 个源文件）**
   - `loader.ts`: YAML 文件加载器，snake_case → camelCase 映射
   - `registry.ts`: `PersonaRegistry` — 注册、查询、`buildContext()` 生成运行时上下文
     - `buildContext()` 根据 allowedTools glob 模式过滤可用工具列表
   - `context.ts`: `buildSystemPrompt()` — 根据 personality 配置生成中文角色描述
     - tone/focus/caution 三维度映射为具体的行为指令
   - `index.ts`: 导出所有公开 API

3. **7 个内置角色 YAML 配置**（`config/personas/`）
   - CEO 助理: 全局只读（db_query + db_list_tables），general 规则集
   - HR 经理助理: HRM 完整 + db 查询，hr 规则集
   - 财务总监助理: Finance + db 完整（含 execute），finance 规则集
   - 法务顾问助理: Legal + db 查询，legal 规则集
   - 销售代表助理: CRM + db 查询，general 规则集
   - 运营经理助理: ERP + db 查询，general 规则集
   - 工程师助理: db 完整 + 5 个内置工具（file/shell/web），general 规则集

4. **@synapse/compliance 包（10 个源文件）**
   - `loader.ts`: 规则 YAML 加载器，扫描 `config/compliance/rules/` 目录
   - `matcher.ts`: 工具名 glob 匹配器（精确匹配、`*` 通配、`|` 多模式）
   - `evaluator.ts`: 简单表达式求值器（tokenizer + recursive descent parser）
     - 支持: 属性访问、比较运算、AND/OR/NOT、IN/NOT IN、字面量
     - 失败模式: 解析错误 → 警告 + fail-open（返回 true）
   - `pre-hook.ts`: `PreHook` — 执行前校验，匹配规则 → 逐条评估 conditions → 返回第一个命中结果
   - `post-hook.ts`: `PostHook` — 执行后校验，支持 auto_mask、mask_fields、flag_if、notify、revoke
   - `masker.ts`: `DataMasker` — 数据脱敏器
     - JSON 递归遍历 + 字段名模式匹配
     - 4 种脱敏方法: middle_mask（保留前3后4）、tail_mask（保留后4）、full_mask、role_based
     - 内置 9 种敏感字段模式（phone, mobile, id_card, salary, password 等）
     - 纯文本回退: 正则匹配手机号（1xx****xxxx）和身份证号
   - `engine.ts`: `ComplianceEngine` — 主类，初始化 + preCheck/postCheck 代理
   - `audit-trail.ts`: `ComplianceAuditTrail` — 内存审计日志（最多 2000 条），支持多维查询
   - `approval.ts`: `ApprovalManager` — 内存审批流状态机（pending → approved/denied/expired）
   - `index.ts`: 导出所有公开 API

5. **Agent-Core 集成**
   - `AgentConfig` 新增 `personaContext?: PersonaContext`
   - `Agent.run()/runStream()`: 注入 persona system prompt（作为首条 system message），按角色过滤工具列表
   - `ToolExecutor` 新增 `ComplianceHooks` 接口 + `personaId`:
     - Pre-Hook: deny → 返回错误, require_approval → 返回审批提示, modify → 替换输入
     - Post-Hook: mask → 返回脱敏数据, flag → 附加告警, revoke → 返回错误, notify → console.log
     - 审计: 每次执行后记录完整链路（pre → execution → post → latency）
   - `ToolRegistry.listForPersona()`: 根据 glob 模式过滤工具定义
   - `createAgentWithCompliance()`: 新工厂函数，组装 persona + compliance + MCP tools

6. **Server 集成**
   - `app.ts` 重构: 初始化 PersonaRegistry + ComplianceEngine + AuditTrail + ApprovalManager
   - `routes/personas.ts`: 3 个角色 API 端点
     - `GET /api/personas` — 列出所有角色
     - `GET /api/personas/:id` — 角色详情
     - `GET /api/personas/:id/tools` — 角色可用工具列表
   - `routes/compliance.ts`: 5 个合规 API 端点
     - `GET /api/compliance/rules` — 所有规则集
     - `GET /api/compliance/rules/:id` — 单个规则集详情
     - `GET /api/compliance/audit` — 审计轨迹查询（支持 personaId, toolName, limit）
     - `GET /api/compliance/approvals` — 待审批列表
     - `POST /api/compliance/approvals/:id/approve|deny` — 审批操作
   - `routes/agent.ts` 重构: 接受 personaId 参数，按请求构建带角色+合规的 Agent

7. **4 套合规规则 YAML 配置**（`config/compliance/rules/`）
   - `general.yaml`（3 条）: PII 自动脱敏、db_execute 需审批、查询审计
   - `finance.yaml`（5 条）: 报销分级审批（≤5k 放行 / ≤50k 财务审批 / >50k CEO 审批）、结算期冻结、大额付款通知、薪酬访问控制、财务数据脱敏
   - `hr.yaml`（3 条）: 薪酬信息仅 HR+CEO+CFO 可查、员工信息脱敏、批量人事变更审批
   - `legal.yaml`（3 条）: 合同签署前置审核、合同信息脱敏、法务敏感信息访问限制

8. **Bug 修复**
   - 角色 YAML 和规则 YAML 中的工具名需使用 MCP 前缀（`database_db_query` 而非 `db_query`）

### Check（验证）

| 测试项 | 结果 |
|--------|------|
| `bunx tsc --noEmit` (7 packages) | 7/7 通过，零错误 |
| `GET /api/personas` | ✅ 返回 7 个角色 |
| `GET /api/personas/finance-controller` | ✅ 完整配置含 personality, allowedTools, proactiveTasks |
| `GET /api/personas/finance-controller/tools` | ✅ 3 个工具 (db_query, db_execute, db_list_tables) |
| `GET /api/personas/engineer/tools` | ✅ 8 个工具 (5 内置 + 3 MCP) |
| `GET /api/personas/ceo/tools` | ✅ 2 个工具 (db_query, db_list_tables — 无 execute) |
| `GET /api/personas/sales-rep/tools` | ✅ 2 个工具 (db_query, db_list_tables — 无 execute) |
| `GET /api/personas/nonexistent` | ✅ 404 错误 |
| `GET /api/compliance/rules` | ✅ 4 个规则集 (general:3, hr:3, finance:5, legal:3 = 14 条规则) |
| `GET /api/compliance/rules/finance` | ✅ 5 条规则详情 |
| `GET /api/compliance/audit` (初始) | ✅ 空列表 |
| `GET /api/compliance/approvals` (初始) | ✅ 空列表 |
| Agent + CEO 列表 | ✅ 调用 db_list_tables 成功，1 次 tool call |
| Agent + CEO 查询员工 | ✅ salary 字段被 Post-Hook 脱敏为 `****` |
| CEO 尝试写操作 | ✅ 工具列表中无 db_execute，模型未尝试 |
| Agent + finance-controller 写操作 | ✅ db_execute 成功（finance 规则集条件未匹配） |
| Agent + engineer db_execute | ✅ Pre-Hook require_approval 拦截 |
| Agent + engineer 查询含 phone | ✅ salary + phone 均被脱敏 |
| 审计轨迹查询 | ✅ 8 条记录，含完整 pre/post 结果和 maskedFields 细节 |
| 审计 latency | ✅ 3-6ms（含 Pre-Hook + 执行 + Post-Hook） |

### Act（经验沉淀）

- **MCP 工具名前缀**: MCP Hub 聚合的工具名带 `${serverId}_` 前缀（如 `database_db_query`），角色 YAML 和规则 YAML 中的 tool 匹配模式必须使用完整前缀名
- **规则条件与工具输入**: 规则 conditions 中的 `input.amount` 只在工具参数包含 `amount` 字段时生效；对于 `db_execute` 这类以 SQL 为输入的工具，金额条件不会匹配 — 这是设计预期，未来 Phase 8 可在业务层 MCP Server 中规范化输入
- **表达式求值器 fail-open**: 解析失败默认返回 true（allow/pass），避免规则配置错误导致系统瘫痪
- **Post-Hook 合并策略**: 多条 post 规则按优先级合并（mask > flag > notify > pass），确保脱敏永远优先
- **角色 system prompt 注入**: 作为首条 `role: 'system'` 消息插入对话历史，ChatMessage 类型已原生支持 system role
- **内存审计上限**: 2000 条 cap 防止内存泄漏，Phase 8 持久化到文件/DB

### 文件变更表

**新建 33 个文件**:
```
# Shared types
packages/shared/src/types/persona.ts              # Persona 共享类型 (PersonaConfig, PersonaContext)
packages/shared/src/types/compliance.ts           # Compliance 共享类型 (PreHookResult, PostHookResult, etc.)

# Personas package
packages/personas/package.json                     # 包配置 (依赖: shared, yaml)
packages/personas/tsconfig.json                    # TS 配置
packages/personas/src/index.ts                     # 公开 API 导出
packages/personas/src/loader.ts                    # YAML 加载器 (snake_case → camelCase)
packages/personas/src/registry.ts                  # 角色注册表 + buildContext()
packages/personas/src/context.ts                   # System prompt 构建器

# Compliance package
packages/compliance/package.json                   # 包配置 (依赖: shared, yaml)
packages/compliance/tsconfig.json                  # TS 配置
packages/compliance/src/index.ts                   # 公开 API 导出
packages/compliance/src/loader.ts                  # 规则 YAML 加载器
packages/compliance/src/matcher.ts                 # 工具名 glob 匹配器
packages/compliance/src/evaluator.ts               # 表达式求值器 (tokenizer + parser)
packages/compliance/src/pre-hook.ts                # Pre-Hook 执行前校验
packages/compliance/src/post-hook.ts               # Post-Hook 执行后校验
packages/compliance/src/masker.ts                  # 数据脱敏器 (4 种方法)
packages/compliance/src/engine.ts                  # 合规引擎主类
packages/compliance/src/audit-trail.ts             # 审计轨迹 (内存, max 2000)
packages/compliance/src/approval.ts                # 审批流管理器 (内存状态机)

# Persona configs
config/personas/ceo.yaml                           # CEO 助理
config/personas/hr-manager.yaml                    # HR 经理助理
config/personas/finance-controller.yaml            # 财务总监助理
config/personas/legal-counsel.yaml                 # 法务顾问助理
config/personas/sales-rep.yaml                     # 销售代表助理
config/personas/ops-manager.yaml                   # 运营经理助理
config/personas/engineer.yaml                      # 工程师助理

# Compliance rule configs
config/compliance/rules/general.yaml               # 通用规则 (3 条)
config/compliance/rules/finance.yaml               # 财务规则 (5 条)
config/compliance/rules/hr.yaml                    # 人事规则 (3 条)
config/compliance/rules/legal.yaml                 # 法务规则 (3 条)

# Server routes
packages/server/src/routes/personas.ts             # 角色 API (3 endpoints)
packages/server/src/routes/compliance.ts           # 合规 API (5 endpoints)
```

**修改 10 个文件**:
```
packages/shared/src/index.ts                       # +17 行: 导出 Persona + Compliance 类型
packages/shared/src/types/mcp.ts                   # +3 行: MCPAuditEntry 新增 userId, personaId, approved
packages/agent-core/src/agent/types.ts             # +2 行: AgentConfig.personaContext
packages/agent-core/src/agent/agent.ts             # +13 行: injectPersonaPrompt() + persona 工具过滤
packages/agent-core/src/tools/executor.ts          # 重写: ComplianceHooks + pre/post hook + audit
packages/agent-core/src/tools/registry.ts          # +10 行: listForPersona()
packages/agent-core/src/index.ts                   # +35 行: createAgentWithCompliance() + ComplianceHooks 导出
packages/server/src/app.ts                         # 重写: 初始化 Persona + Compliance + 新路由
packages/server/src/routes/agent.ts                # 重写: personaId 参数 + 按请求构建 Agent
packages/server/package.json                       # +2 行: @synapse/personas, @synapse/compliance 依赖
```

### 统计快照

| 指标 | 值 |
|------|-----|
| 新建文件 | 33 |
| 修改文件 | 10 |
| 代码行数 (净增) | +2,153 |
| 新增 Packages | 2 (`personas`, `compliance`) |
| 总 Packages | 7 (`shared`, `agent-core`, `mcp-hub`, `mcp-servers`, `personas`, `compliance`, `server`) |
| 角色模板 | 7 个 |
| 合规规则 | 14 条 (4 个规则集) |
| 新增 API 端点 | 8 个 (3 persona + 5 compliance) |
| Commits | 2 (`97cec13`, `518fc80`) |
| 类型检查 | 7/7 通过 |
| 外部依赖新增 | yaml ^2.7.0 |

### 依赖拓扑

```
@synapse/shared (无依赖)
  ├── @synapse/agent-core (shared, openai)
  ├── @synapse/personas (shared, yaml)                    ← 新建
  ├── @synapse/compliance (shared, yaml)                  ← 新建
  ├── @synapse/mcp-hub (shared, @modelcontextprotocol/sdk, zod)
  │     └── @synapse/server (shared, agent-core, mcp-hub, personas, compliance, hono)
  └── @synapse/mcp-servers (@modelcontextprotocol/sdk, zod)  ← 独立进程
```

---

## Session 5 — Phase 5: 组织记忆 + 个人记忆 + 知识库

**日期**: 2026-03-01 ~ 2026-03-02
**Commit**: `28ee1e7` feat: Phase 5 — Org Memory + Personal Memory + Knowledge Base
**Fix Commit**: `7d9f339` fix: align memory tools with persona system + fix seed data filenames

### Plan（目标）

让 Agent 具备记忆能力——组织级知识共享（制度、决策、经验、最佳实践）的 CRUD + 搜索，个人记忆（偏好/事实存取 + 对话摘要），个人知识库（文档导入 + 关键词搜索），以及 3 个新内置工具让 Agent 在对话中调用记忆系统。

### Do（实施）

1. **共享类型扩展（@synapse/shared）**
   - `OrgMemoryEntry`: 组织记忆条目（id, category, title, content, tags, createdBy, timestamps）
   - `PersonalFact`: 个人偏好/事实（id, personaId, key, value, timestamps）
   - `ConversationSummary`: 对话摘要（id, personaId, date, summary, topics）
   - `KnowledgeDocument`: 知识库文档（id, personaId, title, content, source, tags, timestamps）

2. **@synapse/memory 包（4 个源文件）**
   - `org-memory.ts`: `OrgMemoryStore` — 4 类组织知识（policies/decisions/lessons/knowledge）CRUD
     - 文件系统存储: `data/org-memory/{category}/{id}.json`
     - 内存索引: `_index.json` 加速搜索（title + tags + content 子串匹配）
     - `listByAccess()`: 根据 persona `orgMemoryAccess` glob 模式过滤可见条目
   - `personal-memory.ts`: `PersonalMemoryStore` — 按 personaId 隔离
     - facts: `data/memory/{personaId}/facts.json`（setFact 幂等更新）
     - conversations: `data/memory/{personaId}/conversations.json`（按时间倒序）
   - `knowledge-base.ts`: `KnowledgeBase` — 文档导入 + 关键词搜索
     - 存储: `data/knowledge/{id}.json` + `_index.json`
     - 搜索: title + tags 索引快筛 + content 全文回退
   - `index.ts`: 导出所有公开 API

3. **3 个新内置工具（agent-core）**
   - `memory-types.ts`: `MemoryToolDeps` 接口 + 结构类型适配器（`OrgMemoryStoreAdapter` 等）
     - 使用结构类型避免 agent-core → memory 直接依赖
   - `memory-read.ts`: `createMemoryReadTool()` — scope=personal 读偏好 / scope=org 搜索组织知识
   - `memory-write.ts`: `createMemoryWriteTool()` — scope=personal 写偏好 / scope=org 创建条目
   - `knowledge-search.ts`: `createKnowledgeSearchTool()` — 搜索个人知识库文档
   - `registerMemoryTools()`: 批量注册 3 个工具到 ToolRegistry
   - `createAgentWithCompliance()` 扩展: 新增 `memoryToolDeps` 可选参数

4. **Server 集成 — 17 个新 API 端点**
   - `routes/org-memory.ts`（6 个端点）:
     - `GET /api/org-memory` — 列出条目（可选 category 过滤）
     - `GET /api/org-memory/search?q=xxx` — 关键词搜索
     - `GET /api/org-memory/:id` — 单条详情
     - `POST /api/org-memory` — 创建条目
     - `PUT /api/org-memory/:id` — 更新条目
     - `DELETE /api/org-memory/:id` — 删除条目
   - `routes/memory.ts`（6 个端点）:
     - `GET /api/memory/:personaId/facts` — 列出偏好
     - `GET /api/memory/:personaId/facts/:key` — 获取特定偏好
     - `PUT /api/memory/:personaId/facts/:key` — 设置偏好
     - `DELETE /api/memory/:personaId/facts/:key` — 删除偏好
     - `GET /api/memory/:personaId/conversations` — 对话摘要列表
     - `POST /api/memory/:personaId/conversations` — 添加摘要
   - `routes/knowledge.ts`（5 个端点）:
     - `GET /api/knowledge` — 列出文档
     - `GET /api/knowledge/search?q=xxx` — 搜索文档
     - `POST /api/knowledge` — 导入文档
     - `GET /api/knowledge/:id` — 文档详情
     - `DELETE /api/knowledge/:id` — 删除文档
   - `app.ts`: 初始化 3 个 Memory stores + 注册路由 + 传递给 Agent 路由
   - `routes/agent.ts`: 从 PersonaConfig 读取 `orgMemoryAccess`，构建 `memoryToolDeps` 注入 Agent

5. **种子数据**
   - `data/org-memory/policies/expense-policy.json` — 员工报销制度（审批流程、标准）
   - `data/org-memory/knowledge/code-standards.json` — 代码规范与最佳实践
   - `data/org-memory/_index.json` — 索引文件

### Check（验证）

**编译验证**:

| 测试项 | 结果 |
|--------|------|
| `bunx tsc --noEmit` (8 packages) | 8/8 通过，零错误 |
| `bun install` 依赖安装 | 成功，136 packages |
| shared 类型导出 | 4 个新 Memory 类型正确导出 |
| memory 包编译 | OrgMemoryStore, PersonalMemoryStore, KnowledgeBase 零错误 |
| agent-core 结构类型 | MemoryToolDeps 使用适配器接口，无循环依赖 |
| server 路由注册 | 17 个新端点 + memory stores 注入 Agent 路由 |

**运行时验证**（`DATABASE_PATH=/tmp/test-synapse-p5.sqlite bun run packages/server/src/index.ts`）：

*Org Memory API (9 tests)*:

| 测试项 | 命令 | 结果 |
|--------|------|------|
| 列出种子数据 | `GET /api/org-memory` | ✅ 2 条: 员工报销制度, 代码规范 |
| 搜索 报销 | `GET /api/org-memory/search?q=报销` | ✅ 1 条匹配 |
| 按 category 过滤 | `GET /api/org-memory?category=policies` | ✅ 1 条 policies |
| 获取单条 | `GET /api/org-memory/expense-policy-001` | ✅ 完整 title + content + tags |
| 创建条目 | `POST /api/org-memory {category:"decisions",...}` | ✅ 201, UUID 生成 |
| 更新条目(仅tags) | `PUT /api/org-memory/:id {tags:[...]}` | ✅ title + content 保留不丢失 |
| 删除条目 | `DELETE /api/org-memory/:id` | ✅ deleted: true |
| 删后列表 | `GET /api/org-memory` | ✅ 恢复 2 条 |
| 删后 404 | `GET /api/org-memory/:deleted_id` | ✅ 404 |

*Personal Memory API (8 tests)*:

| 测试项 | 命令 | 结果 |
|--------|------|------|
| 设置偏好 | `PUT /api/memory/ceo/facts/report_day {value:"周三"}` | ✅ key=report_day, value=周三 |
| 设置第二个偏好 | `PUT /api/memory/ceo/facts/language {value:"中文"}` | ✅ |
| 获取特定偏好 | `GET /api/memory/ceo/facts/report_day` | ✅ value=周三 |
| 列出所有偏好 | `GET /api/memory/ceo/facts` | ✅ 2 条 |
| 更新已有偏好 | `PUT /api/memory/ceo/facts/report_day {value:"周五"}` | ✅ 幂等更新 |
| 删除偏好 | `DELETE /api/memory/ceo/facts/language` | ✅ |
| 删后列表 | `GET /api/memory/ceo/facts` | ✅ 1 条 (report_day=周五) |
| 不存在的偏好 | `GET /api/memory/ceo/facts/nonexistent` | ✅ 404 |

*Conversation Summary API (4 tests)*:

| 测试项 | 命令 | 结果 |
|--------|------|------|
| 添加摘要 | `POST /api/memory/ceo/conversations {date:"2026-03-01",...}` | ✅ 201 |
| 添加第二条 | `POST /api/memory/ceo/conversations {date:"2026-02-28",...}` | ✅ 201 |
| 列出摘要 | `GET /api/memory/ceo/conversations` | ✅ 2 条，按 createdAt 倒序 |
| 带 limit 列出 | `GET /api/memory/ceo/conversations?limit=1` | ✅ 1 条 |

*Knowledge Base API (8 tests)*:

| 测试项 | 命令 | 结果 |
|--------|------|------|
| 导入文档 | `POST /api/knowledge {title:"部署流程指南",...}` | ✅ 201, UUID |
| 导入第二个 | `POST /api/knowledge {title:"API设计规范",...}` | ✅ 201 |
| 列出文档 | `GET /api/knowledge` | ✅ 2 个文档 |
| 搜索 部署 | `GET /api/knowledge/search?q=部署` | ✅ 1 条: 部署流程指南 |
| 搜索+personaId | `GET /api/knowledge/search?q=API&personaId=engineer` | ✅ 1 条: API设计规范 |
| 获取单个文档 | `GET /api/knowledge/:id` | ✅ 完整 content + tags |
| 删除文档 | `DELETE /api/knowledge/:id` | ✅ deleted: true |
| 删后列表 | `GET /api/knowledge` | ✅ 1 个文档 |

*Agent + Memory Tool 集成 (4 tests)*:

| 测试项 | 命令 | 结果 |
|--------|------|------|
| CEO 工具列表 | `GET /api/personas/ceo/tools` | ✅ 5 个工具 (db_query, db_list_tables, memory_read, memory_write, knowledge_search) |
| Agent + memory_read | `POST /api/agent {personaId:"ceo",..."查看报销制度"}` | ✅ 1 次 tool_call, 返回完整报销制度内容 |
| Agent + memory_write | `POST /api/agent {personaId:"ceo",..."记住周三交周报"}` | ✅ 1 次 tool_call, 偏好已持久化到 `data/memory/ceo/facts.json` |
| Agent + knowledge_search | `POST /api/agent {personaId:"engineer",..."搜索API文档"}` | ✅ 1 次 tool_call, 返回 API设计规范 |

**总计: 33/33 测试通过**

### Act（经验沉淀）

- **结构类型规避循环依赖**: agent-core 的 memory tools 需要 memory stores 的方法签名，但不应直接 import `@synapse/memory`。定义 `OrgMemoryStoreAdapter` 等结构接口，由 server 层注入实际实例，TypeScript 的 structural typing 自动匹配
- **文件系统 + 索引模式**: 每个 store 维护 `_index.json` 做快速筛选（title + tags），content 全文匹配作为回退。写操作必须同步更新索引
- **工厂函数 + 闭包注入**: memory tools 使用 `createXxxTool(deps)` 模式，通过闭包捕获 stores 和 personaId，避免修改 Tool 接口
- **orgMemoryAccess 权限模型**: persona YAML 已有 `org_memory_access` 字段（如 CEO: `company/*`, `strategy/*`），`listByAccess()` 做 glob 映射到 category 过滤
- **种子数据文件名必须匹配 ID**: OrgMemoryStore 用 `{id}.json` 定位文件，手写种子数据的文件名必须与 JSON 中的 `id` 字段一致（如 `expense-policy-001.json`），否则 `get()` 找不到文件
- **新工具必须加入 persona allowedTools**: 注册了新工具后，必须同步更新所有 persona YAML 的 `allowed_tools` 列表，否则 `buildContext()` 会把新工具过滤掉，Agent 看不到
- **buildContext 的 availableTools 输入要完整**: agent 路由的 `allToolNames` 必须包含所有已注册工具名（MCP + 内置 + memory），否则 persona 的 glob 匹配有命中也会因为输入列表缺失而被过滤
- **PUT 路由避免 undefined 覆盖**: 解构 `const { title, content } = body` 后直接 spread 会把未传字段设为 `undefined`，覆盖已有值。应只传入 body 中实际存在的字段

### 文件变更表

**新建 15 个文件**:
```
# Shared types
packages/shared/src/types/memory.ts              # Memory 共享类型 (4 interfaces)

# Memory package
packages/memory/package.json                      # 包配置 (依赖: shared)
packages/memory/tsconfig.json                     # TS 配置
packages/memory/src/index.ts                      # 公开 API 导出
packages/memory/src/org-memory.ts                 # 组织记忆 CRUD + 搜索 + 权限过滤
packages/memory/src/personal-memory.ts            # 个人记忆 (facts + conversations)
packages/memory/src/knowledge-base.ts             # 知识库 CRUD + 搜索

# New built-in tools
packages/agent-core/src/tools/built-in/memory-types.ts     # MemoryToolDeps + 结构适配接口
packages/agent-core/src/tools/built-in/memory-read.ts      # memory_read 工具
packages/agent-core/src/tools/built-in/memory-write.ts     # memory_write 工具
packages/agent-core/src/tools/built-in/knowledge-search.ts # knowledge_search 工具

# Server routes
packages/server/src/routes/org-memory.ts          # 组织记忆 API (6 endpoints)
packages/server/src/routes/memory.ts              # 个人记忆 API (6 endpoints)
packages/server/src/routes/knowledge.ts           # 知识库 API (5 endpoints)

# Seed data
data/org-memory/_index.json                       # 索引
data/org-memory/policies/expense-policy-001.json  # 报销制度
data/org-memory/knowledge/code-standards-001.json # 代码规范
```

**修改 7 个文件**:
```
packages/shared/src/index.ts                      # +7 行: 导出 Memory 类型
packages/agent-core/src/tools/built-in/index.ts   # +13 行: registerMemoryTools()
packages/agent-core/src/index.ts                  # +16 行: 导出 memory tools + MemoryToolDeps + memoryToolDeps option
packages/server/package.json                      # +1 行: @synapse/memory 依赖
packages/server/src/app.ts                        # +21 行: 初始化 Memory stores + 新路由 + 传递 deps
packages/server/src/routes/agent.ts               # +19 行: 构建 memoryToolDeps + 注入 Agent
bun.lock                                          # 自动更新
```

### 统计快照

| 指标 | 值 |
|------|-----|
| 新建文件 | 15 (+3 seed data) |
| 修改文件 | 7 (+7 persona YAMLs in fix commit) |
| 代码行数 (净增) | +1,127 |
| 新增 Packages | 1 (`memory`) |
| 总 Packages | 8 (`shared`, `agent-core`, `mcp-hub`, `mcp-servers`, `personas`, `compliance`, `memory`, `server`) |
| 新增内置工具 | 3 (`memory_read`, `memory_write`, `knowledge_search`) |
| 内置工具总计 | 8 (5 原有 + 3 新增) |
| 新增 API 端点 | 17 (6 org-memory + 6 personal + 5 knowledge) |
| 运行时测试 | 33/33 通过 |
| 运行时 Bug 修复 | 4 个 (种子文件名、persona allowedTools、allToolNames、PUT undefined 覆盖) |
| Commits | 3 (`28ee1e7`, `9bf32b4`, `7d9f339`) |
| 类型检查 | 8/8 通过 |

### 依赖拓扑

```
@synapse/shared (无依赖)
  ├── @synapse/agent-core (shared, openai)
  ├── @synapse/personas (shared, yaml)
  ├── @synapse/compliance (shared, yaml)
  ├── @synapse/memory (shared)                     ← 新建
  ├── @synapse/mcp-hub (shared, @modelcontextprotocol/sdk, zod)
  │     └── @synapse/server (shared, agent-core, mcp-hub, personas, compliance, memory, hono)
  └── @synapse/mcp-servers (@modelcontextprotocol/sdk, zod)  ← 独立进程
```

---

## Session 6 — Phase 6: 主动智能 (Proactive Intelligence)

**日期**: 2026-03-02
**Commit**: 待提交（所有文件已创建，typecheck 通过）

### Plan（目标）

让 Agent 从被动等待用户提问转变为**主动行动**——定时生成经营摘要、监听事件自动预警、超阈值自动报告。激活 6 个 persona 中已定义但从未生效的 `proactiveTasks` YAML 字段。验证场景："每周一 9:00 自动生成高管经营日报；预算超 90% 主动预警"。

### Do（实施）

1. **共享类型扩展（@synapse/shared）**
   - `ProactiveTaskConfig`: 从 persona YAML 提取的主动任务配置（id, personaId, schedule/trigger, action）
   - `ActionDefinition`: YAML 加载的 action 定义（promptTemplate + variables + targetModel）
   - `ThresholdMonitorConfig` + `ThresholdRule`: 阈值监控配置（checkInterval, query, conditions）
   - `ProactiveTaskExecution`: 任务执行记录（triggerType, status, result, toolCallsExecuted）
   - `ProactiveEvent`: 事件总线事件（name, source, payload, timestamp）
   - `ProactiveNotification`: 主动通知（severity, read/unread, source）

2. **@synapse/proactive 包（10 个源文件）**
   - `cron-parser.ts`: 自写 5-field cron 解析器（~70 行）
     - 支持: `*`, `*/step`, `N-M`, `N-M/step`, 逗号分隔
     - `parseCron(expression)` → `CronFields`, `matchesCron(fields, date)` → boolean
   - `cron-scheduler.ts`: `CronScheduler` — 60s interval 定时检查
     - `lastRun` 时间戳（分钟级 key）防止同分钟重复触发
     - register / unregister / start / stop / listJobs
   - `event-bus.ts`: `EventBus` — Node.js EventEmitter 封装
     - `emit()` 自动生成 UUID + timestamp，返回 `ProactiveEvent`
     - `onAny()` 全局监听，`listEventNames()` 列出已注册事件
   - `action-loader.ts`: YAML action 文件加载器（snake_case → camelCase）
   - `action-registry.ts`: `ActionRegistry` — action 注册 + prompt 渲染
     - `renderPrompt()`: 替换 `{{var}}` 占位符，内置 `{{CURRENT_DATE}}` = 当天日期
   - `task-history.ts`: `TaskHistory` — 执行历史存储
     - 文件存储: `data/proactive/history/{id}.json` + `_index.json`
     - recordStart / recordComplete / query（支持 taskId, personaId, status, limit 过滤）
   - `notification-store.ts`: `NotificationStore` — 通知存储
     - 文件存储: `data/proactive/notifications/{id}.json` + `_index.json`
     - 已读/未读管理: markRead / markAllRead / getUnreadCount
     - getForPersona（支持 unreadOnly + limit）
   - `threshold-monitor.ts`: `ThresholdMonitor` — 阈值监控器
     - 通过 `AgentExecutor` 回调调用 Agent 查询数据
     - 简单条件解析器: `field op value`（支持 >=, <=, >, <, ==, !=）
     - 解析 Agent 返回的 JSON，逐条评估阈值规则
     - `loadFromDir()`: 从 YAML 文件加载监控配置
   - `task-manager.ts`: `ProactiveTaskManager` — **核心编排器**
     - 不直接依赖 agent-core/personas/compliance/memory，通过回调注入
     - `initialize()`: 加载 actions + 扫描 persona tasks + 注册 cron jobs + event handlers + threshold monitors
     - `executeAction()` 核心流程: renderPrompt → recordStart → agentExecutor → recordComplete → createNotification
     - `emitEvent()`: 手动发射事件，自动触发已注册的 event handler
     - `getStatus()`: 状态概览（running, scheduledJobs, registeredEvents, activeMonitors）
   - `index.ts`: 导出所有公开 API

3. **11 个 Action YAML 配置**（`config/proactive/actions/`）
   - CEO: `weekly_business_summary`（周一 8:00 经营周报）、`alert_ceo`（财务异常预警）
   - Finance: `daily_financial_summary`（每日 8:00 财务日报）、`expense_review_alert`（大额报销审核）
   - HR: `weekly_attendance_summary`（周一 9:00 考勤周报）、`onboarding_checklist`（入职清单）
   - Legal: `contract_renewal_reminder`（合同续签提醒）
   - Sales: `weekly_sales_report`（周一 9:00 销售周报）、`deal_update_notification`（商机变更通知）
   - Ops: `daily_operations_summary`（每日 8:00 运营日报）、`reorder_alert`（库存补货预警）

4. **2 个 Threshold Monitor YAML**（`config/proactive/monitors/`）
   - `budget-warning.yaml`: 预算使用率 ≥80% warning / ≥90% critical，通知 finance-controller + ceo
   - `inventory-alert.yaml`: 库存低于安全线 warning / 最低比例 ≤30% critical，通知 ops-manager + ceo

5. **Server 集成**
   - `routes/proactive.ts`: 8 个 API 端点
     - `GET /api/proactive/status` — 调度器状态
     - `GET /api/proactive/actions` — 列出所有 action
     - `POST /api/proactive/actions/:actionId/execute` — 手动执行 action
     - `POST /api/proactive/events` — 发射事件
     - `GET /api/proactive/history` — 查询执行历史（支持 personaId, taskId, status, limit）
     - `GET /api/proactive/notifications` — 查询通知（支持 personaId, unreadOnly, limit）
     - `POST /api/proactive/notifications/:id/read` — 标记已读
     - `POST /api/proactive/notifications/read-all` — 全部标记已读
   - `app.ts` 重构:
     - 构造 `agentExecutor` 回调: 复用 agent 路由中 `createAgentWithCompliance` 逻辑（含 persona context + compliance hooks + memory tools）
     - 构造 `getProactiveTasks` 回调: 从 PersonaRegistry 提取所有 persona 的 proactiveTasks
     - 创建 `ProactiveTaskManager` → `initialize()` → `start()` → 注册路由
     - 返回值新增 `proactiveManager` 用于 graceful shutdown
   - `index.ts`: 添加 SIGTERM/SIGINT 信号处理，graceful shutdown（proactiveManager.stop() + hub.stop()）

### Check（验证）

| 测试项 | 结果 |
|--------|------|
| `bunx tsc --noEmit` shared | 通过 |
| `bunx tsc --noEmit` proactive | 通过 |
| `bunx tsc --noEmit` server | 通过 |
| 依赖安装 | 138 packages，@synapse/proactive 正确识别 |
| 依赖拓扑 | proactive 仅依赖 shared + yaml，不依赖 agent-core |
| 文件清单 | ~27 新建 + 4 修改，与计划一致 |

### Act（经验沉淀）

- **回调注入模式**: proactive 包不依赖 agent-core/personas/compliance/memory，通过 `AgentExecutor` + `getProactiveTasks` 回调由 server 层桥接。这与 agent-core 的 memory tools 使用结构类型避免循环依赖是同一策略
- **Cron 防重触发**: 60s interval 可能在同一分钟执行两次，用 `lastRun` 的分钟级字符串 key 去重
- **文件存储一致性**: 继续沿用 memory 包确立的 `{id}.json + _index.json` 模式，写操作同步更新索引
- **阈值条件解析器**: 简单 `field op value` 解析足够 Phase 6，不需要引入完整表达式引擎。Agent 返回 JSON + 简单条件比对，比硬编码数据库查询更 AI-native
- **通知只存不推**: Phase 6 聚焦调度和执行逻辑，通知存入 NotificationStore 供 API 查询；Slack/邮件/企业微信推送推迟到 Phase 8+

### 文件变更表

**新建 ~27 个文件**:
```
# Shared types
packages/shared/src/types/proactive.ts             # Proactive 共享类型 (7 interfaces)

# Proactive package
packages/proactive/package.json                     # 包配置 (依赖: shared, yaml)
packages/proactive/tsconfig.json                    # TS 配置
packages/proactive/src/index.ts                     # 公开 API 导出
packages/proactive/src/cron-parser.ts               # 5-field cron 解析器
packages/proactive/src/cron-scheduler.ts            # 60s interval 调度器
packages/proactive/src/event-bus.ts                 # EventEmitter 封装
packages/proactive/src/action-loader.ts             # YAML action 加载器
packages/proactive/src/action-registry.ts           # Action 注册表 + prompt 渲染
packages/proactive/src/task-history.ts              # 执行历史存储
packages/proactive/src/notification-store.ts        # 通知存储
packages/proactive/src/threshold-monitor.ts         # 阈值监控器
packages/proactive/src/task-manager.ts              # ProactiveTaskManager 编排器

# Action YAML configs (11)
config/proactive/actions/weekly_business_summary.yaml
config/proactive/actions/alert_ceo.yaml
config/proactive/actions/daily_financial_summary.yaml
config/proactive/actions/expense_review_alert.yaml
config/proactive/actions/weekly_attendance_summary.yaml
config/proactive/actions/onboarding_checklist.yaml
config/proactive/actions/contract_renewal_reminder.yaml
config/proactive/actions/weekly_sales_report.yaml
config/proactive/actions/deal_update_notification.yaml
config/proactive/actions/daily_operations_summary.yaml
config/proactive/actions/reorder_alert.yaml

# Threshold Monitor YAML configs (2)
config/proactive/monitors/budget-warning.yaml
config/proactive/monitors/inventory-alert.yaml

# Server route
packages/server/src/routes/proactive.ts             # Proactive API (8 endpoints)
```

**修改 4 个文件**:
```
packages/shared/src/index.ts                        # +8 行: 导出 Proactive 类型
packages/server/package.json                        # +1 行: @synapse/proactive 依赖
packages/server/src/app.ts                          # +65 行: agentExecutor 回调 + ProactiveTaskManager 初始化 + 路由
packages/server/src/index.ts                        # +9 行: graceful shutdown (SIGTERM/SIGINT)
```

### 统计快照

| 指标 | 值 |
|------|-----|
| 新建文件 | 27 |
| 修改文件 | 4 |
| 新增 Package | 1 (`proactive`) |
| 总 Packages | 9 (`shared`, `agent-core`, `mcp-hub`, `mcp-servers`, `personas`, `compliance`, `memory`, `proactive`, `server`) |
| 新增 API 端点 | 8 |
| Action 定义 | 11 个 |
| Threshold Monitor | 2 个 |
| Cron 定时任务 | 5 个 (3 weekly + 2 daily) |
| 事件触发器 | 6 个 (financial_anomaly, large_expense_submitted, employee_onboarding, contract_expiry_approaching, deal_stage_change, inventory_low) |
| 类型检查 | shared + proactive + server 全部通过 |

### 依赖拓扑

```
@synapse/shared (无依赖)
  ├── @synapse/agent-core (shared, openai)
  ├── @synapse/personas (shared, yaml)
  ├── @synapse/compliance (shared, yaml)
  ├── @synapse/memory (shared)
  ├── @synapse/proactive (shared, yaml)              ← 新建
  ├── @synapse/mcp-hub (shared, @modelcontextprotocol/sdk, zod)
  │     └── @synapse/server (shared, agent-core, mcp-hub, personas, compliance, memory, proactive, hono)
  └── @synapse/mcp-servers (@modelcontextprotocol/sdk, zod)  ← 独立进程
```

---

## Session 7 — Phase 6.5: 决策智能引擎 (Decision Intelligence)

**日期**: 2026-03-02
**Commit**: `fe208ed` feat: Phase 6.5 — Decision Intelligence Engine (决策智能引擎)
**Data Commit**: `8b677df` test: add Phase 6.5 runtime verification data

### Plan（目标）

从"查→展示"升级到"查→分析→洞察→决策→追踪"——构建决策智能引擎：定期采集业务数据 → 自动计算 KPI → LLM 驱动洞察发现 → 结构化决策记录 → OKR/KPI 战略透视 → 自动报告生成。验证场景："定期采集数据自动计算 KPI；LLM 分析指标生成洞察；CEO 录入决策并追踪执行结果；自动生成经营日报"。

### Do（实施）

1. **共享类型扩展（@synapse/shared）**
   - `MetricSnapshot`: 指标快照（metricId, value, period, periodType, metadata）
   - `MetricDefinition`: YAML 指标定义（query, frequency, alertRules）
   - `Insight`: 洞察（6 种 type: trend/anomaly/attribution/prediction/correlation/benchmark, severity, evidence, suggestedActions, strategyImpact）
   - `DecisionRecord`: 决策记录（context, options with pros/cons/risk, decision with rationale, tracking lifecycle）
   - `StrategyObjective`: 战略目标（OKR: keyResults linked to metricId, targetValue, currentValue, status）
   - `DecisionReport`: 报告（type, content markdown, linked metricIds + insightIds）

2. **@synapse/decision-engine 包（8 个源文件）**
   - `metric-store.ts`: `MetricStore` — 指标快照文件存储
     - `data/decision/metrics/{id}.json` + `_index.json`
     - record / getLatest / getHistory / query（支持 metricId, periodType, from/to, limit）
     - getMetricIds / getCount
   - `collector.ts`: `DataCollector` — Cron 驱动数据采集器
     - 从 `metrics.yaml` 加载指标定义，按 frequency 映射 cron（daily 6:00, weekly 周一 7:00, monthly 1号 8:00）
     - 60s interval tick + lastRun 分钟级防重（复用 proactive CronScheduler 模式）
     - `collectMetric()`: 构建 prompt → AgentExecutor 调用 LLM → 解析 JSON `{value, metadata}` → MetricStore.record()
     - 内置 JSON 提取器（支持 markdown code block 和裸 JSON）
     - 自带轻量 cron 匹配（matchesCron + matchField），不依赖 proactive 包
   - `insight-engine.ts`: `InsightEngine` — LLM 驱动洞察生成
     - `data/decision/insights/{id}.json` + `_index.json`
     - `analyze()`: 收集最近指标快照 → 构建 6 维分析 prompt → Agent 生成 JSON 洞察数组 → 存储
     - query（支持 type, severity, personaId, limit）/ getRecent / getCount
   - `strategy-tracker.ts`: `StrategyTracker` — OKR/KPI 战略追踪
     - 从 `strategy.yaml` 加载目标定义，保留已有 currentValue/status 状态
     - `updateProgress()`: 从 MetricStore 读最新值 → 按 progress 比例计算 status（≥80% on_track, ≥50% at_risk, <50% off_track）
     - `data/decision/strategy/state.json` 持久化
   - `decision-journal.ts`: `DecisionJournal` — 决策记录 CRUD
     - `data/decision/journal/{id}.json` + `_index.json`
     - create / get / update（支持更新 decision + tracking 字段）/ query / getRecent
     - tracking lifecycle: pending → executing → reviewing → closed
   - `report-generator.ts`: `ReportGenerator` — LLM 驱动报告生成
     - `data/decision/reports/{id}.json` + `_index.json`
     - `generate()`: 收集指标 + 洞察 → 构建报告 prompt → Agent 生成 Markdown → 存储
     - 支持 daily/weekly/monthly/thematic 4 种报告类型
   - `engine.ts`: `DecisionEngine` — 主编排器
     - 组合 6 个子组件（MetricStore, DataCollector, InsightEngine, StrategyTracker, DecisionJournal, ReportGenerator）
     - initialize() → 加载 YAML 配置 + 更新策略进度
     - start() / stop() → 控制 DataCollector cron 调度
     - getStatus() → 综合状态快照
     - 可选 `notifyCallback` 关联 proactive NotificationStore
   - `index.ts`: 导出所有公开 API

3. **YAML 配置文件**
   - `config/decision/metrics.yaml`: 10 个核心指标
     - 日频: revenue, gross_margin, order_count, return_rate（含 alertRules）
     - 周频: customer_acquisition, inventory_turnover, cash_flow
     - 月频: employee_satisfaction, customer_nps, cost_ratio
   - `config/decision/strategy.yaml`: 4 个战略目标 + 8 个 KR
     - obj-revenue: 营收增长（Q1 目标 2500 万, 毛利率 ≥35%）
     - obj-efficiency: 运营效率（退货率 ≤3%, 库存周转 ≤30 天, 费用率 ≤30%）
     - obj-customer: 客户体验（NPS ≥60, 季度新客 ≥5000）
     - obj-talent: 人才发展（满意度 ≥85）

4. **Server 集成**
   - `routes/decision.ts`: 16 个 REST API 端点
     - 指标: status / metrics / metrics/:id/snapshots / metrics/:id/collect
     - 洞察: insights / insights/analyze
     - 战略: strategy / strategy/:id / strategy/refresh
     - 决策: journal(list) / journal(create) / journal/:id(get) / journal/:id(update)
     - 报告: reports(list) / reports/generate / reports/:id(get)
   - `app.ts`: 初始化 DecisionEngine + notifyCallback 关联 proactive NotificationStore + 路由注册
   - `index.ts`: 添加 `decisionEngine.stop()` 到 graceful shutdown
   - `package.json`: 添加 `@synapse/decision-engine` 依赖

### Check（验证）

**编译验证**:

| 测试项 | 结果 |
|--------|------|
| `bun run typecheck` (10 packages) | 10/10 通过，零错误 |
| bun install 依赖安装 | 成功，140 packages |
| shared 类型导出 | 6 个新 Decision 类型正确导出 |
| decision-engine 包编译 | 全部 8 个源文件零错误 |
| server 路由集成 | 16 个新端点 + DecisionEngine 生命周期管理 |

**运行时验证**（`bun run packages/server/src/index.ts`，从 monorepo 根目录启动）：

*启动确认*:
- 7 personas, 4 compliance rulesets, 11 proactive actions, 2 threshold monitors
- `[DataCollector] Loaded 10 metric definitions`
- `[StrategyTracker] Loaded 4 objectives`
- `[DecisionEngine] Initialized` → `Started`

*基础 API (9 tests)*:

| 测试项 | 命令 | 结果 |
|--------|------|------|
| 引擎状态 | `GET /api/decision/status` | `running=true, metricDefinitions=10, strategyObjectives=4, offTrack=8` |
| 列出指标 | `GET /api/decision/metrics` | 10 个指标定义（含 alertRules） |
| 战略概览 | `GET /api/decision/strategy` | 4 个目标 + 8 个 KR（初始全部 off_track） |
| 单个目标 | `GET /api/decision/strategy/obj-revenue` | 2 个 KR 含 targetValue |
| 目标 404 | `GET /api/decision/strategy/nonexistent` | 404 正确响应 |
| 空快照 | `GET /api/decision/metrics/revenue/snapshots` | 空数组 |
| 空洞察 | `GET /api/decision/insights` | 空数组 |
| 空日志 | `GET /api/decision/journal` | 空数组 |
| 空报告 | `GET /api/decision/reports` | 空数组 |

*决策 CRUD (4 tests)*:

| 测试项 | 命令 | 结果 |
|--------|------|------|
| 创建决策 | `POST /api/decision/journal {deciderId:"ceo",...}` | 201，完整 DecisionRecord（UUID, 2 个选项, pros/cons/risk） |
| 更新状态 | `PUT /api/decision/journal/:id {tracking:{status:"executing"}}` | status 从 pending → executing，updatedAt 更新 |
| 获取详情 | `GET /api/decision/journal/:id` | 完整记录含上下文 + 选项 + 决策 + 追踪 |
| 列表查询 | `GET /api/decision/journal` | 1 条记录 |

*LLM 驱动端点 (3 tests)*:

| 测试项 | 命令 | 结果 |
|--------|------|------|
| **手动采集** | `POST /api/decision/metrics/revenue/collect` | LLM 返回 `value: 1234567.89`，含 metadata（3 个业务线明细 + YoY/MoM） |
| **洞察分析** | `POST /api/decision/insights/analyze {personaId:"ceo"}` | 3 个洞察: attribution（收入构成 64.8%/24.3%/10.9%）、benchmark（YoY +12.5%）、trend（数据不足预警） |
| **生成日报** | `POST /api/decision/reports/generate {type:"daily",personaId:"ceo"}` | 完整 Markdown 报告含摘要、指标表格、洞察分析、风险预警、建议和展望 |

*数据联动验证 (3 tests)*:

| 测试项 | 命令 | 结果 |
|--------|------|------|
| 采集后快照 | `GET /api/decision/metrics/revenue/snapshots` | 1 条快照，value=1234567.89 + 完整 metadata |
| 战略刷新 | `POST /api/decision/strategy/refresh` | kr-revenue-q1 的 currentValue 从 0 更新为 1234567.89 |
| 最终状态 | `GET /api/decision/status` | `metricsCount=1, insightsCount=3, decisionsCount=1, reportsCount=1` |

**总计: 19/19 测试通过（含 3 个 LLM 端到端验证）**

### Act（经验沉淀）

- **monorepo 根目录启动**: `bun run --filter` 运行时 `process.cwd()` 为包目录（`packages/server/`），导致 `config/` 和 `data/` 找不到。应直接 `bun run packages/server/src/index.ts` 从 monorepo 根启动
- **Bun.serve idleTimeout**: 默认 10s，LLM 调用可能超时。数据虽成功写入但 HTTP 连接已被服务器关闭。curl 需 `--max-time 120`，生产环境需配置更长的 idleTimeout
- **JSON 提取器健壮性**: LLM 返回可能是 markdown code block 或裸 JSON。两阶段提取器先尝试 code block 再 fallback 到正则匹配裸 JSON
- **复用 vs 自包含 cron**: DataCollector 自带轻量 cron 匹配，不依赖 proactive 的 CronScheduler。两者模式一致但代码独立，避免了 decision-engine → proactive 的包间依赖
- **洞察质量与数据量正相关**: 仅 1 个指标 1 个快照时，LLM 仍生成了 3 条有价值洞察，但明确指出"数据不足"。更多数据积累后洞察质量会显著提升
- **KR status 计算简单有效**: progress = currentValue / targetValue，≥80% on_track, ≥50% at_risk, <50% off_track。足够 MVP，Phase 8+ 可引入加权和趋势预测

### 文件变更表

**新建 14 个文件**:
```
# Shared types
packages/shared/src/types/decision.ts              # Decision 共享类型 (6 interfaces)

# Decision Engine package
packages/decision-engine/package.json               # 包配置 (依赖: shared, yaml)
packages/decision-engine/tsconfig.json               # TS 配置
packages/decision-engine/src/index.ts                # 公开 API 导出
packages/decision-engine/src/metric-store.ts         # 指标快照存储 (file + _index.json)
packages/decision-engine/src/collector.ts            # Cron 数据采集器 + JSON 提取器
packages/decision-engine/src/insight-engine.ts       # LLM 洞察引擎 (6 维分析)
packages/decision-engine/src/strategy-tracker.ts     # OKR/KPI 战略追踪
packages/decision-engine/src/decision-journal.ts     # 决策记录 CRUD
packages/decision-engine/src/report-generator.ts     # LLM 报告生成器
packages/decision-engine/src/engine.ts               # DecisionEngine 主编排器

# YAML configs
config/decision/metrics.yaml                         # 10 个业务指标定义
config/decision/strategy.yaml                        # 4 个战略目标 + 8 个 KR

# Server route
packages/server/src/routes/decision.ts               # Decision API (16 endpoints)
```

**修改 4 个文件 + bun.lock**:
```
packages/shared/src/index.ts                         # +9 行: 导出 Decision 类型
packages/server/package.json                         # +1 行: @synapse/decision-engine 依赖
packages/server/src/app.ts                           # +86 行: DecisionEngine 初始化 + notifyCallback + 路由
packages/server/src/index.ts                         # +2 行: decisionEngine graceful shutdown
bun.lock                                             # 自动更新
```

**运行时验证数据 (11 files)**:
```
data/decision/metrics/{uuid}.json + _index.json      # 1 条 revenue 快照
data/decision/insights/{3 uuids}.json + _index.json  # 3 条洞察
data/decision/journal/{uuid}.json + _index.json      # 1 条决策记录
data/decision/reports/{uuid}.json + _index.json      # 1 份日报
data/decision/strategy/state.json                    # 策略状态
```

### 统计快照

| 指标 | 值 |
|------|-----|
| 新建文件 | 14 (+11 运行时数据) |
| 修改文件 | 4 (+bun.lock) |
| 代码行数 (净增) | +1,854 |
| 新增 Package | 1 (`decision-engine`) |
| 总 Packages | 10 (`shared`, `agent-core`, `mcp-hub`, `mcp-servers`, `personas`, `compliance`, `memory`, `proactive`, `decision-engine`, `server`) |
| 新增 API 端点 | 16 |
| YAML 指标定义 | 10 个 |
| 战略目标 | 4 个（8 个 KR） |
| 运行时测试 | 19/19 通过（含 3 个 LLM E2E） |
| Commits | 2 (`fe208ed`, `8b677df`) |
| 类型检查 | 10/10 通过 |

### 依赖拓扑

```
@synapse/shared (无依赖)
  ├── @synapse/agent-core (shared, openai)
  ├── @synapse/personas (shared, yaml)
  ├── @synapse/compliance (shared, yaml)
  ├── @synapse/memory (shared)
  ├── @synapse/proactive (shared, yaml)
  ├── @synapse/decision-engine (shared, yaml)        ← 新建
  ├── @synapse/mcp-hub (shared, @modelcontextprotocol/sdk, zod)
  │     └── @synapse/server (shared, agent-core, mcp-hub, personas, compliance, memory, proactive, decision-engine, hono)
  └── @synapse/mcp-servers (@modelcontextprotocol/sdk, zod)  ← 独立进程
```

---

## Session 8 — Phase 7: Skill 系统 + 管理器

**日期**: 2026-03-02
**Commit**: (已完成，补录 logbook)

### Plan（目标）

实现完整的 Skill 系统：SKILL.md 定义格式 → 解析/加载 → 注册表 → 执行引擎 → 历史追踪 → REST API → Agent 集成。

### Do（实施）

1. **@synapse/shared 类型扩展**
   - `SkillDefinition`、`SkillExecution`、`SkillParameter`
   - `SkillCategory` (8 种)、`SkillStatus`、`SkillSource`

2. **@synapse/skill-manager（新包，~790 行）**
   - `SkillParser`: SKILL.md 格式解析（YAML frontmatter + Markdown body）
   - `SkillLoader`: 目录扫描 + 批量解析
   - `SkillRegistry`: 内存目录，支持分类/来源/Persona glob 匹配（exact, prefix*, *）
   - `SkillStore`: 自定义 Skill 文件持久化（CRUD + 状态管理）
   - `SkillExecutor`: 执行引擎，作用域限定 Agent + 工具白名单交集
   - `ExecutionHistory`: 执行追踪，_index.json 索引 + 单条记录文件
   - `SkillManager`: 主编排器，整合以上所有组件

3. **8 个内置 Skill**
   - code-review, contract-review, customer-analysis, data-analysis
   - employee-onboarding, monthly-report, sales-summary, system-diagnostics

4. **REST API（10 个端点）**
   - `GET /api/skills` 列表 + 过滤
   - `GET /api/skills/status` 状态概览
   - `GET /api/skills/categories` 分类统计
   - `GET /api/skills/history` 执行历史
   - `GET /api/skills/:skillId` 详情
   - `POST /api/skills/:skillId/execute` 执行
   - `POST /api/skills/:skillId/status` 状态切换
   - `POST /api/skills/custom` 创建自定义 Skill
   - `PUT /api/skills/custom/:skillId` 更新
   - `DELETE /api/skills/custom/:skillId` 删除

5. **Agent 集成**
   - `skill-execute` 工具注册到 agent-core
   - `SkillToolDeps` 接口 + 延迟绑定
   - server/app.ts 中 ScopedAgentExecutor 实现工具域限制

### Check（验证）

| 测试项 | 结果 |
|--------|------|
| `bun run typecheck` (11 packages) | 11/11 通过 |
| SKILL.md 解析 (8 个内置) | 全部加载 |
| 自定义 Skill CRUD | 创建/更新/删除正常 |
| Persona glob 匹配 | exact/prefix*/全通配 正常 |

### Act（经验沉淀）

- **SKILL.md 格式**: YAML frontmatter + Markdown body 是最灵活的 Skill 定义方式，人可读、机器可解析
- **工具域限制**: Skill 的 allowedTools 与 Persona 的工具集取交集，实现最小权限执行
- **双源加载**: built-in (config/skills) + custom (data/skills) 分离，内置不可删、自定义可 CRUD

### 统计快照

| 指标 | 值 |
|------|-----|
| 新建文件 | 17 (7 源码 + 8 SKILL.md + 1 路由 + 1 类型) |
| 修改文件 | 4 (shared/index, server/package.json, server/app.ts, server/index.ts) |
| 代码行数 (净增) | ~790 (skill-manager) + ~164 (routes) |
| 新增 Package | 1 (`skill-manager`) |
| 总 Packages | 11 |
| 新增 API 端点 | 10 |
| 内置 Skills | 8 个 |
| 类型检查 | 11/11 通过 |

### 依赖拓扑

```
@synapse/shared (无依赖)
  ├── @synapse/agent-core (shared, openai)
  ├── @synapse/personas (shared, yaml)
  ├── @synapse/compliance (shared, yaml)
  ├── @synapse/memory (shared)
  ├── @synapse/proactive (shared, yaml)
  ├── @synapse/decision-engine (shared, yaml)
  ├── @synapse/skill-manager (shared)                ← 新建
  ├── @synapse/mcp-hub (shared, @modelcontextprotocol/sdk, zod)
  │     └── @synapse/server (shared, agent-core, mcp-hub, personas, compliance, memory, proactive, decision-engine, skill-manager, hono)
  └── @synapse/mcp-servers (@modelcontextprotocol/sdk, zod)  ← 独立进程
```

---

## Session 9 — Phase 7.5: Skill Marketplace

**日期**: 2026-03-03

### Plan（目标）

在 Phase 7 Skill 系统基础上构建 Skill Marketplace，实现技能发布 → 搜索发现 → 安装 → 评分评价 → 排名 → 质量管控 → 自动下架全流程。

### Do（实施）

1. **@synapse/shared 类型扩展**
   - `MarketplaceSkill`、`MarketplaceReview`、`InstallRecord`
   - `MarketplaceStats`、`QualityCheckResult`、`PublishInput`

2. **@synapse/skill-marketplace（新包，6 模块）**
   - `MarketplaceRegistry`: 发布注册表，`_index.json + {id}.json` 持久化
   - `RatingStore`: 评分评价存储，每用户每技能唯一约束，自动计算平均分
   - `RankingEngine`: 排名算法（纯函数），`score = downloads(0.3) + rating(0.3) + successRate(0.2) + recency(0.2)`，90 天半衰期
   - `ReviewEngine`: 发布审核 (validateForPublish) + 质量管控 (qualityCheck: 低评分/高失败率 → suspend)
   - `SkillInstaller`: 安装/卸载/更新到 `data/skills/installed/`，`installed.json` 记录管理
   - `SkillMarketplace`: 主编排器，通过 `SkillManagerAdapter` 回调注入避免循环依赖

3. **REST API（17 个端点）**
   - `GET /api/marketplace/status` 市场统计
   - `GET /api/marketplace/search` 搜索 (?q=&category=&tag=)
   - `GET /api/marketplace/browse` 浏览 (?category=&sort=ranking|recent|downloads)
   - `GET /api/marketplace/top` 排行榜 (?limit=)
   - `GET /api/marketplace/skills/:id` 详情 + 评价
   - `POST /api/marketplace/publish` 发布
   - `PUT /api/marketplace/skills/:id` 更新元数据
   - `DELETE /api/marketplace/skills/:id` 下架
   - `POST /api/marketplace/skills/:id/install` 安装
   - `DELETE /api/marketplace/installed/:id` 卸载
   - `GET /api/marketplace/installed` 已安装列表
   - `GET /api/marketplace/installed/updates` 检查更新
   - `POST /api/marketplace/installed/:id/update` 更新已安装技能
   - `POST /api/marketplace/skills/:id/reviews` 提交评价
   - `GET /api/marketplace/skills/:id/reviews` 获取评价
   - `PUT /api/marketplace/reviews/:id` 修改评价
   - `DELETE /api/marketplace/reviews/:id` 删除评价

4. **Server 集成**
   - `SkillManagerAdapter` 回调注入: getSkill, getHistory, reloadInstalledSkills
   - app.ts 初始化 SkillMarketplace 实例 + 路由挂载

### Check（验证）

| 测试项 | 结果 |
|--------|------|
| `bun run typecheck` (12 packages) | 12/12 通过 |
| 创建 custom skill → 发布 | ✅ 201 + checksum 正确 |
| 搜索/浏览/排行榜 | ✅ 排名算法生效 |
| 安装/已安装列表 | ✅ SKILL.md 写入 installed/ |
| 提交评价 (2 用户) + 自动更新平均分 | ✅ avg=4.5 |
| 查看统计 | ✅ published=1, installed=1, reviews=2 |
| 卸载/下架 | ✅ 数据清除正确 |
| 边界: 重复发布 | ✅ 400 "already published" |
| 边界: 不存在的 skill | ✅ 400 "not found in SkillManager" |
| 边界: 重复评价 | ✅ 400 "has already reviewed" |
| 边界: 无效评分 (6 分) | ✅ 400 "Rating must be between 1 and 5" |

### Act（经验沉淀）

- **回调注入模式**: SkillManagerAdapter 与 proactive/decision-engine 统一模式，server 层桥接注入避免循环依赖
- **安装概念**: marketplace registry (元数据) 与 installed/ (SKILL.md 文件) 分离，SkillRegistry.loadFromDir() 复用已有加载机制
- **质量管控**: 评分 < 2.0 且 ≥ 3 条评价 → 自动 suspend；失败率 > 50% 且 ≥ 10 次执行 → suspend；180 天无更新 → warn

### 统计快照

| 指标 | 值 |
|------|-----|
| 新建文件 | 10 (6 源码 + 1 路由 + 1 类型 + 2 配置) |
| 修改文件 | 3 (shared/index, server/package.json, server/app.ts) |
| 代码行数 (净增) | ~580 (skill-marketplace) + ~190 (routes) |
| 新增 Package | 1 (`skill-marketplace`) |
| 总 Packages | 12 |
| 新增 API 端点 | 17 |
| 类型检查 | 12/12 通过 |

### 依赖拓扑

```
@synapse/shared (无依赖)
  ├── @synapse/agent-core (shared, openai)
  ├── @synapse/personas (shared, yaml)
  ├── @synapse/compliance (shared, yaml)
  ├── @synapse/memory (shared)
  ├── @synapse/proactive (shared, yaml)
  ├── @synapse/decision-engine (shared, yaml)
  ├── @synapse/skill-manager (shared, yaml)
  ├── @synapse/skill-marketplace (shared)            ← 新建
  ├── @synapse/mcp-hub (shared, @modelcontextprotocol/sdk, zod)
  │     └── @synapse/server (shared, agent-core, mcp-hub, personas, compliance, memory, proactive, decision-engine, skill-manager, skill-marketplace, hono)
  └── @synapse/mcp-servers (@modelcontextprotocol/sdk, zod)  ← 独立进程
```

---

## Session 10 — Phase 10: Web UI 全部前端功能

**日期**: 2026-03-04

### Plan（目标）

补齐 Synapse AI 前端全部 8 个功能页面（MCP、Skills、Compliance、Memory、Proactive、Decision、Marketplace、Settings），使侧边栏所有入口可用。

### Do（实施）

1. **基础设施准备**
   - `lib/constants.ts`: 移除 8 个导航项的 `disabled: true`
   - 新增 7 个 shadcn/ui 组件: tabs, table, dialog, input, label, select, switch
   - `messages/zh.ts`: 扩展 i18n 词条 (~300 条)，覆盖 8 个新页面
   - `package.json`: 添加 @radix-ui/react-tabs, -label, -select, -switch + @types/node

2. **MCP 连接页** (`/mcp`)
   - McpPanel (tabs: 服务器/工具/审计日志)
   - ServerList: 服务器状态 + 重启按钮
   - ToolList: 聚合工具列表 + 权限徽标
   - AuditLog: 审计日志表格

3. **Skill 管理页** (`/skills`)
   - SkillPanel (tabs: 全部/历史)
   - SkillList + SkillCard: 卡片网格 + 分类筛选 + Switch 启禁
   - SkillDetailDialog: 参数填写 + 执行
   - CreateSkillDialog: 自定义 Skill 创建
   - SkillHistory: 执行历史表格

4. **合规审计页** (`/compliance`)
   - CompliancePanel (tabs: 规则/审计/审批)
   - RuleList: Collapsible 展开规则集 + 严重度徽标
   - AuditTrail: 审计日志表格 (passed/blocked/flagged)
   - ApprovalList: 审批列表 + 批准/拒绝按钮

5. **记忆系统页** (`/memory`)
   - MemoryPanel (tabs: 个人/组织/知识库)
   - PersonalMemory: 角色选择 (Select) + 事实 CRUD
   - OrgMemory: 搜索 + 分类筛选 + 卡片列表 + OrgMemoryDialog (新建/编辑)
   - KnowledgeBase: 文档表格 + ImportKnowledgeDialog

6. **主动智能页** (`/proactive`)
   - ProactivePanel (tabs: 概览/动作/通知/历史)
   - SchedulerStatus: 4 个状态卡片
   - ActionList: 动作表格 + 手动执行按钮
   - NotificationList: 通知卡片 + 标记已读
   - ExecutionHistory: 执行历史表格

7. **决策智能页** (`/decision`) — 最复杂，5 个 tabs
   - DecisionPanel (tabs: 指标/洞察/战略/日志/报告)
   - MetricsView: 指标卡片网格 + 趋势图标
   - InsightsView: 洞察卡片 + 类型筛选 + 触发分析
   - StrategyView: 战略目标 + 进度条 + 状态徽标
   - JournalView + JournalDialog: 决策日志 CRUD + 详情查看
   - ReportsView: 报告表格 + 生成按钮

8. **Skill 市场页** (`/marketplace`)
   - MarketplacePanel (MarketplaceStats + tabs: 浏览/已安装)
   - MarketplaceStats: 4 个统计卡片
   - SkillBrowser + MarketplaceCard: 搜索 + 分类浏览 + 安装
   - SkillDetailDialog: 详情 + 评论列表
   - InstalledList: 已安装表格 + 卸载/更新
   - ReviewDialog: 星级评分 + 评价提交

9. **系统设置页** (`/settings`)
   - SettingsPanel: 系统信息 + Skill 状态 + 服务状态 (Promise.allSettled 并行获取 3 个 API)

### Check（验证）

| 测试项 | 结果 |
|--------|------|
| TypeScript `tsc --noEmit` | ✅ 零错误 |
| `bun run build` (Next.js) | ✅ Compiled successfully，14 路由全生成 |
| Docker build (`docker compose build synapse-web`) | ✅ 镜像构建成功 |
| Docker run (`docker compose up -d synapse-web`) | ✅ 容器运行在 19300 端口 |
| 所有页面路由可访问 | ✅ 10/10 页面正常渲染 |
| 侧边栏全部入口启用 | ✅ 10/10 导航项可点击 |

### Act（经验沉淀）

- **批量创建模式**: 8 个页面 ~58 个文件，按复杂度递增实施（MCP 最简 → Decision 最复杂），每个页面作为独立单元
- **shadcn/ui 模式**: 标准 new-york style 组件直接手写，无需 `npx shadcn-ui@latest add`，只需 Radix UI 依赖 + cn() 工具
- **数据获取不过度设计**: `useState + useEffect + apiFetch` 足以支撑所有页面，无需引入 SWR/React Query
- **Tailwind v4**: `@import "tailwindcss"` 替代 v3 的 `@tailwind base/components/utilities`，`@theme inline` 替代 `theme.extend`
- **bun install 锁文件迁移**: pnpm-lock.yaml → bun.lock 迁移非常慢 (~3-5 分钟)，但 node_modules 内依赖已存在时可跳过安装直接构建
- **Next.js 15 standalone**: `output: 'standalone'` 模式下 Docker 仅需复制 `.next/standalone` + `.next/static`

### 统计快照

| 指标 | 值 |
|------|-----|
| 新建文件 | ~55 (8 page.tsx + ~40 组件 + 7 shadcn/ui) |
| 修改文件 | 3 (constants.ts, zh.ts, package.json) |
| 代码行数 (净增) | ~3500 |
| 新增页面 | 8 |
| 新增 shadcn/ui 组件 | 7 (tabs, table, dialog, input, label, select, switch) |
| i18n 词条增加 | ~250 条 |
| Total Bundle (First Load JS shared) | 102 kB |
| 类型检查 | 零错误 |
| Docker 构建 | 成功 (62s 编译 + 92s 总构建) |

---

## Session 11 — 全 Phase 设计基线审计

**日期**: 2026-03-04

### Plan（目标）

对 DESIGN-BASELINE.md 进行全 Phase (1-10) 交叉审计，修复所有过时/缺失/不一致的条目，确保文档与代码完全对齐。

### Do（实施）

1. **代码审计** — 使用 3 个并行 Agent 扫描全部后端路由、包结构、配置目录
2. **发现 15+ 处不一致**，逐一修复:
   - API 端点总数: 80 → **86** (实际 12 路由模块 + health/root)
   - agent-core 工具数: 8 → **16** (原 8 + skill_execute + 6 browser + browser-wait)
   - mcp-servers: "database + http-api" → **9 servers** (+ 7 stubs)
   - config/mcp-servers: "2/15+" → **9/15+** 配置文件
   - Skills API / Marketplace API: ❌ → **✅** (修复过时标记)
   - 新增 `@synapse/browser` 包到包表
   - Phase 9: "📋 待开始" → **✅ 完成** (浏览器自动化 + MCP stubs)
   - 删除幽灵端点 `GET /decision/insights/:id` (代码中不存在)
   - 展开聚合端点表示 (org-memory 6 条, memory 6 条, knowledge 5 条, compliance 批准/拒绝分行)
   - 修复 section 编号: 重复的 3.10/3.11 → 3.13/3.14
   - 新增 Phase 9 实施总结 (section 九)
   - 新增 data/browser/screenshots 数据目录
   - 更新依赖拓扑 (+browser, mcp-servers 9 servers)
   - 更新 CLAUDE.md (+browser 包, Phase 9 完成, 端点数 86, mcp-servers 9)
   - 修复 LOGBOOK Session 编号 (重复 Session 9 → Session 10)

### Check（验证）

| 检查项 | 结果 |
|--------|------|
| API 端点数与代码匹配 | ✅ 86 endpoints verified |
| 工具数与 built-in/ 目录匹配 | ✅ 16 tool files |
| 包表包含全部 14 个包 | ✅ 含 @synapse/browser |
| Section 编号无重复 | ✅ 3.1-3.14 连续 |
| Phase 进度与代码一致 | ✅ Phase 9 标记完成 |
| 幽灵端点已删除 | ✅ insights/:id 已移除 |

### Act（经验沉淀）

- **基线审计时机**: 多 Phase 连续实施后必须做全量审计，否则聚合偏差会越来越大
- **并行 Agent 审计**: 3 个 Agent 分别扫描路由/包/配置，比串行快 3x
- **幽灵端点**: 文档中存在但代码中不存在的 API 端点，必须通过 grep 路由文件逐条核实

### 统计快照

| 指标 | 值 |
|------|-----|
| 修改文件 | 3 (DESIGN-BASELINE.md, CLAUDE.md, LOGBOOK.md) |
| 发现不一致项 | 15+ |
| 修复编辑次数 | ~25 |
| 新增 DESIGN-BASELINE 行数 | ~40 |

---

## Session 12 — PLAN.md 未落地功能清单

**日期**: 2026-03-04

### Plan（目标）

对比 PLAN.md 全部设计内容 vs 当前代码实现，梳理所有未落地功能，按优先级分类写入 DESIGN-BASELINE.md。

### Do（实施）

1. **逐节审读 PLAN.md** — 全文 ~2277 行，覆盖 12 个核心设计章节 + 10 个 Phase 定义
2. **逐项交叉核实** — 每个 PLAN.md 功能点与代码实现 (grep/read) 逐条比对
3. **发现 33 项未落地功能**，按 P0/P1/P2/P3 分级:
   - P0 (5 项): Auth 中间件、WebSocket 推送、通知渠道、MCP Auth Gateway、审计持久化
   - P1 (7 项): Planner、多 Agent、向量搜索、决策顾问、MCP Server 填充、MySQL/PG、补偿器
   - P2 (10 项): 决策仪表盘、日报、Skill 向导/版本、Persona 编辑器、SSE 传输、Resources/Prompts、PDF 报告、记忆增强
   - P3 (11 项): Ollama、Git/Email/企微/DMS Server、远程 Registry、上报机制、Skill 依赖、BaseMCPServer、Onboarding、浏览器查看器
4. **写入 DESIGN-BASELINE.md 新增 section 十一** — 含完整功能清单 + 建议 Phase 路线 + 完成度总览

### Check（验证）

| 检查项 | 结果 |
|--------|------|
| PLAN.md 12 章节全覆盖 | ✅ |
| 33 项功能均有代码交叉核实 | ✅ |
| 每项功能有 PLAN.md 位置引用 | ✅ |
| 建议 Phase 路线无冲突 | ✅ Phase 8/11/12/13/14+ |
| 完成度数据与 section 二/三一致 | ✅ ~78% 功能点覆盖 |

### Act（经验沉淀）

- **PLAN.md 是设计锚点**: 即使代码质量很高 (78% 覆盖率)，剩余 22% 的缺失足以影响生产可用性
- **P0 优先级判定标准**: 重启丢数据、安全漏洞、核心交互缺失 = 必须在上线前解决
- **Phase 路线规划**: P0 清单应整合为一个 Phase (Phase 11)，不应分散到多个 Phase

### 统计快照

| 指标 | 值 |
|------|-----|
| 修改文件 | 2 (DESIGN-BASELINE.md, LOGBOOK.md) |
| 审读 PLAN.md 行数 | ~2277 |
| 发现未落地功能 | 33 |
| 新增 DESIGN-BASELINE 行数 | ~80 |
| PLAN.md 功能覆盖率 | ~78% (120/153) |

---

## Session 12.5 — Phase 9 集成修复 + MCP 增强 + 配置补全（未提交变更补录）

**日期**: 2026-03-04 ~ 2026-03-05
**状态**: 未提交（工作区变更）

### Plan（目标）

Phase 9 (浏览器自动化) 和 Phase 10 (Web UI) 完成后的集成修复：浏览器工具接入 Agent、MCP 动态管理、Persona 技能提示优化、Proactive 字段补全、基线文档更新。

### Do（实施）

1. **浏览器工具集成** (`packages/agent-core`, `packages/server`)
   - 新增 `registerBrowserTools()` 注册 7 个浏览器工具 (navigate, click, fill, screenshot, extract, evaluate, wait)
   - `BrowserToolDeps` 类型贯穿 agent-core → server → agent routes
   - `app.ts` 初始化 `BrowserPool`（lazy init），注入到 Agent 创建流程
   - `index.ts` 增加 `browserPool.shutdown()` 优雅关闭 + `idleTimeout: 120` 支持长时间 SSE

2. **MCP 动态管理** (`packages/mcp-hub`, `packages/server/src/routes/mcp.ts`)
   - 新增 `hub.addServer()` / `hub.removeServer()` 方法
   - 新增 `saveServerConfig()` / `deleteServerConfig()` 持久化到磁盘
   - 新增 `POST /api/mcp/servers` + `DELETE /api/mcp/servers/:id` 端点
   - MCP tools 列表返回 `server` 字段（从工具名前缀提取 serverId）
   - `MCPServerStatus` 增加 `name` 字段
   - `MCPServerCategory` 增加 `'business'` 类型

3. **Persona 技能提示优化** (`packages/personas/src/context.ts`)
   - `buildSystemPrompt()` 中 defaultSkills 从简单列举改为详细的技能使用规范
   - 明确优先使用 `skill_execute` 调用预定义技能而非手动调底层工具
   - 仅在非常具体的查询时才直接调用底层工具

4. **Proactive 字段补全** (`packages/proactive/src/action-loader.ts`)
   - `RawAction` 增加 `type`、`schedule`、`enabled` 可选字段
   - 解析时填充默认值 (`type='schedule'`, `enabled=true`)

5. **配置文件补全** (config/ 目录)
   - 12 个 proactive action YAML 增加 `type`/`schedule`/`enabled` 字段
   - `ceo.yaml` persona 增加投资相关技能
   - `metrics.yaml` / `strategy.yaml` 增加投资指标
   - `proactive/actions/:id/execute` 端点 body 改为可选，默认 `personaId='ceo'`

6. **基线文档更新** (`CLAUDE.md`, `DESIGN-BASELINE.md`)
   - CLAUDE.md: Phase 9/10 标记完成，项目结构更新（browser 包、MCP 9 配置、Web 前端）
   - DESIGN-BASELINE.md: 全 Phase 审计 + 33 项未落地功能清单

7. **包管理调整**
   - `package.json` workspaces 格式化
   - `server/package.json` 增加 `@synapse/browser` 依赖
   - 删除 `bun.lock`（切换到 pnpm-lock.yaml）

### Check（验证）

| 检查项 | 结果 |
|--------|------|
| Docker 容器启动 | 通过（13 built-in skills, MCP Hub, Browser Pool） |
| 浏览器工具注册 | 7 tools 注册成功 |
| MCP 增删 API | POST/DELETE 可用 |
| Proactive actions 加载 | 字段正确解析 |

### Act（经验沉淀）

- **BrowserPool lazy init**: 浏览器在首次工具调用时才启动，避免无用资源消耗
- **MCP 工具名约定**: `{serverId}_{toolName}` 前缀格式，用于前端展示 server 归属
- **Skill 提示工程**: Persona system prompt 需要明确"优先用技能"规范，否则 LLM 倾向于直接调底层工具

### 统计快照

| 指标 | 值 |
|------|-----|
| 修改文件 | 37 |
| 涉及包 | 6 (agent-core, mcp-hub, personas, proactive, server, shared) |
| 新增 API 端点 | 2 (POST/DELETE /mcp/servers) |
| 新增方法 | 4 (addServer, removeServer, saveServerConfig, deleteServerConfig) |

---

## Session 13 — Skill 市场上下架规则引擎 + 审核队列 UI

**日期**: 2026-03-05
**Commit**: `28ba49f` feat: Skill 市场上下架规则引擎 + 审核队列 UI

### Plan（目标）

补完 Skill 市场上下架治理体系：扩展状态机为 5 态、实现发布自动审核规则引擎、改造发布流程、新增人工审核 API、前端审核队列 UI。

### Do（实施）

1. **状态机扩展** (`packages/shared/src/types/marketplace.ts`)
   - `MarketplaceSkill.status`: 3 态 → 5 态 (`pending_review | active | deprecated | suspended | rejected`)
   - 新增 `PublishReviewResult`（自动审核结果）、`ReviewDecision`（人工审核决定）接口
   - `QualityCheckResult.action` 增加 `'deprecated'` 类型

2. **审核规则引擎** (`packages/skill-marketplace/src/review-engine.ts`)
   - 新增 `publishReview()` 函数 — 4 维度加权评分:
     - 功能完整性 (30%): instructions 含"任务说明"+"执行步骤"+"输出格式"
     - 工具合理性 (25%): 1-10 个工具且无高危组合
     - 安全合规 (25%): 无 shell_exec+file_write 同时存在
     - 用户体验 (20%): description ≤200 字 + 参数有描述
   - score ≥ 70 → 自动上架; 30-69 → 待人工审核; < 30 → 拒绝
   - `qualityCheck()` 增强: 零下载+180 天 → deprecated; 举报 ≥ 3 次 → suspended

3. **发布流程改造** (`packages/skill-marketplace/src/skill-marketplace.ts`)
   - `publish()` 集成 `publishReview()` 自动审核，返回 `reviewResult`
   - 新增 `reviewSkill()` — 人工审核 (approve → active, reject → rejected)
   - 新增 `listPendingReview()` — 获取待审核列表
   - 新增 `reactivate()` — 从 suspended/deprecated/rejected 重新走审核
   - `getStats()` 增加 `pendingReview` 计数

4. **后端 API** (`packages/server/src/routes/marketplace.ts`)
   - `GET /api/marketplace/pending` — 待审核列表
   - `POST /api/marketplace/skills/:skillId/review` — 审核决定
   - `POST /api/marketplace/skills/:skillId/reactivate` — 重新上架
   - `POST /api/marketplace/publish` 返回值包含 `reviewResult`

5. **前端审核队列 UI** (4 文件)
   - `marketplace-panel.tsx` — tabs 追加"审核队列"
   - `review-queue.tsx` [NEW] — 审核队列表格 + 驳回弹窗
   - `marketplace-stats.tsx` — Stats 卡片增加"待审核"（5 列布局）
   - `zh.ts` — 追加 `reviewQueue` i18n 键值

6. **测试数据 Skill** (`config/skills/discussion-report/SKILL.md`)
   - 新建"讨论报告生成器" Skill — 将讨论内容整理为结构化报告并生成文件
   - 工具: memory_read + knowledge_search + file_write
   - 发布测试: 自动审核 100 分，4 维度全 PASS，直接 active 上架

### Check（验证）

| 测试项 | 结果 |
|--------|------|
| `tsc --noEmit` (shared, skill-marketplace, server, web) | 4/4 通过 |
| `turbo build` (Next.js) | 通过，marketplace 页面 8.66 kB |
| Docker 重建 (synapse-server + synapse-web) | 成功 |
| `GET /api/marketplace/pending` | `{"skills":[],"count":0}` |
| `GET /api/marketplace/status` | 含 `"pendingReview":0` 新字段 |
| `POST /api/marketplace/publish` (discussion-report) | score=100, status=active, 4 checks 全 PASS |
| 前端 `http://localhost:19300/marketplace` | 200 OK |

### Act（经验沉淀）

- **Docker volume mount**: `config` 目录是 volume mount 的，新增 Skill 只需重启容器无需重建镜像
- **Privoxy 代理干扰**: 本地 curl 需加 `--noproxy localhost` 避免 Privoxy 500 错误
- **发布体验缺陷**: 当前发布只能通过 API 调用，缺少 UI 向导式发布流程和 SKILL.md 上传功能，用户体验不佳 — 下个 Session 需补完

### 统计快照

| 指标 | 值 |
|------|-----|
| 新建文件 | 2 (review-queue.tsx, discussion-report/SKILL.md) |
| 修改文件 | 8 (marketplace.ts types, review-engine, skill-marketplace, routes, panel, stats, zh, index) |
| 代码行数 (净增) | +1,225 |
| 新增 API 端点 | 3 (pending, review, reactivate) |
| 新增方法 | 4 (publishReview, reviewSkill, listPendingReview, reactivate) |
| Commits | 1 (`28ba49f`) |
| 类型检查 | 4/4 通过 |

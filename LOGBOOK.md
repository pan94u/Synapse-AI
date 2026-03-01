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

**待运行时验证**（需 `DATABASE_PATH` 环境变量）：

| 测试项 | 命令 | 预期 |
|--------|------|------|
| MCP Server 状态 | `GET /api/mcp/servers` | database server status: connected |
| MCP 工具列表 | `GET /api/mcp/tools` | 含 database_db_query, database_db_execute, database_db_list_tables |
| Agent 调用 db | `POST /api/agent {"messages":[...]}` | tool_call → db_list_tables → 返回表列表 |
| 审计日志 | `GET /api/mcp/audit` | 含 tool_call 记录 |

### Act（经验沉淀）

- **MCP SDK stdio 模式**: `StdioClientTransport` 自己 spawn 子进程，不需要手动 `Bun.spawn`
- **循环依赖规避**: `mcp-hub` 不依赖 `agent-core`，而是定义兼容的 `AgentTool` 接口，由 `server` 层桥接
- **异步初始化**: Hono 路由动态注册在导出后可能有竞态，改用 `async createApp()` + 顶层 await 保证启动顺序
- **降级策略**: MCP Hub 失败不应阻塞整个服务，fallback 到纯内置工具 Agent
- **bun:sqlite 类型**: `stmt.all(...params)` 的 params 必须是 `SQLQueryBindings[]`，不能直接传 `unknown[]`，需要类型收窄
- **工具名前缀**: `${serverId}_${toolName}` 格式防止多个 MCP Server 工具名冲突

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

# Synapse AI — 设计基线 (Design Baseline)

> 追踪 PLAN.md 设计与代码实现之间的对齐关系。每个 Phase 结束后更新。
> 最后更新: 2026-03-03 | Phase 7.5 完成后

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
| ⑥.5 | 决策智能 | 数据采集→指标→洞察→决策→战略追踪 | ✅ 已实现 | `packages/decision-engine/` + `config/decision/` | Phase 6.5 完成，6 组件 + 16 API |
| ⑦ | 能力层 | 技能系统 + 内置工具 + 记忆 + 知识 + 技能市场 | ✅ 已实现 | `packages/skill-manager/` + `packages/skill-marketplace/` + `packages/memory/` | Phase 7+7.5 完成，8 内置技能 + Marketplace (17 API) + 排名+评分+质量管控 |
| ⑧ | 企业集成层 | MCP Hub (Registry + Aggregator + Router + Auth + Health + Audit + Rate Limit) | ✅ 基础实现 | `packages/mcp-hub/` | Phase 3 完成核心框架。缺: Auth Gateway（凭证加密）、Router（独立路由模块） |
| ⑨ | 企业数字化系统 | 人财法 CRM ERP 等 MCP Servers | ⚠️ 基础实现 | `packages/mcp-servers/` | 已有: database (SQLite) + http-api。缺: 全部业务系统 Adapter |

---

## 二、包（Package）实现状态

### 2.1 已实现的包

| 包 | PLAN.md 规划 | 实际实现 | 完整度 |
|----|-------------|---------|--------|
| `@synapse/shared` | 全部共享类型 | Chat + Tool + Model + MCP + Persona + Compliance + Memory + Proactive + Decision + Skill + Marketplace 类型 | 100% |
| `@synapse/agent-core` | Model Router + Agent + Tools + Skills + Memory | Model Router + Agent + Tools (8 内置) + Compliance Hooks + Memory Tools + Skill Tool | 70% — 缺 Planner/多 Agent |
| `@synapse/personas` | 角色画像加载、注册、上下文构建 | YAML loader + PersonaRegistry + buildContext + buildSystemPrompt | 95% — 完整实现 |
| `@synapse/compliance` | Pre-Hook + Post-Hook + 审计 + 审批 | Engine + PreHook + PostHook + Masker + Evaluator + AuditTrail + ApprovalManager | 90% — 审计内存版，缺持久化 |
| `@synapse/memory` | 组织记忆 + 个人记忆 + 知识库 | OrgMemoryStore + PersonalMemoryStore + KnowledgeBase | 85% — 缺向量搜索 |
| `@synapse/proactive` | 定时任务 + 事件触发 + 阈值监控 | CronScheduler + EventBus + ActionRegistry + ThresholdMonitor + TaskManager + History + Notifications | 80% — 缺通知推送渠道 |
| `@synapse/decision-engine` | 决策智能: 指标采集+洞察+战略+决策+报告 | MetricStore + DataCollector + InsightEngine + StrategyTracker + DecisionJournal + ReportGenerator + Engine | 80% — 缺可视化+PDF 报告 |
| `@synapse/mcp-hub` | Hub + Client + Registry + Lifecycle + Aggregator + Health + Audit + Rate Limiter | 全部核心组件 | 80% — 缺 Auth Gateway + 独立 Router |
| `@synapse/mcp-servers` | 15+ 个 MCP Server | database (SQLite) + http-api | 10% — 基础设施层 2/4，业务系统层 0/5 |
| `@synapse/skill-manager` | Skill 系统: 解析+注册+执行+历史 | SkillParser + SkillLoader + SkillRegistry + SkillStore + SkillExecutor + ExecutionHistory + SkillManager | 90% — 缺 Skill 版本管理 |
| `@synapse/skill-marketplace` | Skill 市场: 发布+搜索+安装+评分+排名+质量管控 | MarketplaceRegistry + RatingStore + RankingEngine + ReviewEngine + SkillInstaller + SkillMarketplace | 85% — 缺远程 registry 联动 |
| `@synapse/server` | Hono API 全部路由 | chat + agent + mcp + personas + compliance + org-memory + memory + knowledge + proactive + decision + skills + marketplace (12 路由模块) | 70% — 12/14+ 路由模块 |

### 2.2 未实现的包

| 包 | 规划 Phase | 说明 |
|----|-----------|------|
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

### 3.8 决策智能（⑥.5 决策智能层）

| 设计项 | PLAN.md 设计 | 实现 | 状态 | 偏差 |
|--------|-------------|------|------|------|
| 指标存储 | MetricStore: 文件存储 + 索引 | ✅ `metric-store.ts` | `{id}.json + _index.json` | 与 memory/proactive 存储模式一致 |
| 数据采集 | DataCollector: cron 调度 + Agent 查询 | ✅ `collector.ts` | 自带 cron 匹配 + YAML 加载 | 自写 cron 匹配（不依赖 proactive） |
| 洞察引擎 | InsightEngine: 6 维 LLM 分析 | ✅ `insight-engine.ts` | trend/anomaly/attribution/prediction/correlation/benchmark | 全 LLM 驱动，非规则引擎 |
| 战略追踪 | StrategyTracker: OKR/KPI 自动更新 | ✅ `strategy-tracker.ts` | YAML 定义 + 指标自动关联 | 阈值: ≥80% on_track, ≥50% at_risk |
| 决策日志 | DecisionJournal: CRUD + 生命周期 | ✅ `decision-journal.ts` | pending→executing→reviewing→closed | 完全匹配 |
| 报告生成 | ReportGenerator: Agent 生成 Markdown | ✅ `report-generator.ts` | daily/weekly/monthly/thematic | 缺 PDF/Excel（Phase 10） |
| 主编排器 | DecisionEngine: 组合 6 子组件 | ✅ `engine.ts` | 回调注入，不依赖 agent-core | 与 proactive 解耦模式一致 |
| 通知联动 | 洞察→proactive NotificationStore | ✅ notifyCallback 桥接 | server 层注入 | 正向偏差: 松耦合 |
| 配置格式 | YAML 指标+战略定义 | ✅ metrics.yaml + strategy.yaml | 10 指标 + 4 目标 8 KR | 完全匹配 |
| 依赖 | decision-engine → mcp-hub + org-memory | ⚠️ decision-engine → shared + yaml | 回调注入 | 正向偏差: 更好解耦 |

### 3.9 Skill 系统（⑦ 能力层 — Phase 7）

| 设计项 | PLAN.md 设计 | 实现 | 状态 | 偏差 |
|--------|-------------|------|------|------|
| Skill 格式 | SKILL.md (YAML frontmatter + Markdown) | ✅ `skill-parser.ts` | 完全匹配 | — |
| Skill 加载 | 目录扫描 + 批量解析 | ✅ `skill-loader.ts` | 完全匹配 | 跳过 `.` `_` 开头目录 |
| Skill 注册表 | 内存目录 + 分类/来源/Persona 过滤 | ✅ `skill-registry.ts` | 完全匹配 | glob: exact/prefix*/全通配 |
| Skill 存储 | 文件持久化 CRUD | ✅ `skill-store.ts` | 完全匹配 | YAML frontmatter 序列化 |
| Skill 执行 | Agent 子任务 + 工具域限制 | ✅ `skill-executor.ts` | 完全匹配 | Persona ∩ Skill allowedTools |
| 执行历史 | `_index.json + {id}.json` | ✅ `execution-history.ts` | 完全匹配 | 与 memory 存储模式一致 |
| 主编排器 | SkillManager 整合所有组件 | ✅ `skill-manager.ts` | 完全匹配 | — |
| Agent 集成 | skill_execute 工具 + SkillToolDeps | ✅ agent-core + server 桥接 | 完全匹配 | 延迟绑定闭包 |
| 内置技能 | config/skills/ 目录 | ✅ 8 个 SKILL.md | 完全匹配 | — |
| Persona 技能 | defaultSkills glob 匹配 | ✅ persona YAML 字段 | 完全匹配 | — |

### 3.10 Skill Marketplace（⑦ 能力层 — Phase 7.5）

| 设计项 | PLAN.md 设计 | 实现 | 状态 | 偏差 |
|--------|-------------|------|------|------|
| 发布注册表 | `_index.json + {id}.json` | ✅ `marketplace-registry.ts` | 完全匹配 | publish/unpublish/search/setStatus |
| 评分评价 | 每用户每技能唯一 | ✅ `rating-store.ts` | 完全匹配 | 自动计算平均分 |
| 排名算法 | downloads(0.3)+rating(0.3)+success(0.2)+recency(0.2) | ✅ `ranking-engine.ts` | 完全匹配 | 90 天半衰期 |
| 发布审核 | name/description/instructions/category 必填 | ✅ `review-engine.ts` validateForPublish | 完全匹配 | + 安全检查 shell_exec+file_write |
| 质量管控 | 低评分/高失败率 → suspend | ✅ `review-engine.ts` qualityCheck | 完全匹配 | rating<2.0(≥3)+failRate>50%(≥10) |
| 安装器 | install/uninstall/update + installed.json | ✅ `skill-installer.ts` | 完全匹配 | checkUpdates 版本比对 |
| 主编排器 | SkillMarketplace + SkillManagerAdapter | ✅ `skill-marketplace.ts` | 完全匹配 | 回调注入避免循环依赖 |
| 依赖 | skill-marketplace → skill-manager | ⚠️ skill-marketplace → shared | 正向偏差 | 通过 adapter 解耦 |

### 3.11 MCP Hub（⑧ 企业集成层）

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

### 3.10 MCP Servers（⑨ 企业数字化系统）

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

### 3.11 Server API（③ 服务网关层）

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
| `GET /api/decision/status` | 决策引擎状态 | ✅ | Phase 6.5 |
| `GET /api/decision/metrics` | 指标定义列表 | ✅ | Phase 6.5 |
| `GET /api/decision/metrics/:id/snapshots` | 指标历史快照 | ✅ | Phase 6.5 |
| `POST /api/decision/metrics/:id/collect` | 手动采集指标 | ✅ | Phase 6.5 |
| `GET /api/decision/insights` | 洞察查询 | ✅ | Phase 6.5 |
| `GET /api/decision/insights/:id` | 洞察详情 | ✅ | Phase 6.5 |
| `POST /api/decision/insights/analyze` | 触发洞察分析 | ✅ | Phase 6.5 |
| `GET /api/decision/strategy` | 战略目标概览 | ✅ | Phase 6.5 |
| `GET /api/decision/strategy/:id` | 单个目标详情 | ✅ | Phase 6.5 |
| `POST /api/decision/strategy/refresh` | 刷新战略进度 | ✅ | Phase 6.5 |
| `GET /api/decision/journal` | 决策记录列表 | ✅ | Phase 6.5 |
| `POST /api/decision/journal` | 创建决策记录 | ✅ | Phase 6.5 |
| `GET /api/decision/journal/:id` | 决策详情 | ✅ | Phase 6.5 |
| `PUT /api/decision/journal/:id` | 更新决策追踪 | ✅ | Phase 6.5 |
| `GET /api/decision/reports` | 报告列表 | ✅ | Phase 6.5 |
| `POST /api/decision/reports/generate` | 生成报告 | ✅ | Phase 6.5 |
| `GET /api/decision/reports/:id` | 报告详情 | ✅ | Phase 6.5 |
| `GET /api/skills` | 技能列表 (过滤) | ✅ | Phase 7 |
| `GET /api/skills/status` | 技能系统状态 | ✅ | Phase 7 |
| `GET /api/skills/categories` | 分类统计 | ✅ | Phase 7 |
| `GET /api/skills/history` | 执行历史 | ✅ | Phase 7 |
| `GET /api/skills/:skillId` | 技能详情 | ✅ | Phase 7 |
| `POST /api/skills/:skillId/execute` | 执行技能 | ✅ | Phase 7 |
| `POST /api/skills/:skillId/status` | 启用/禁用 | ✅ | Phase 7 |
| `POST /api/skills/custom` | 创建自定义技能 | ✅ | Phase 7 |
| `PUT /api/skills/custom/:skillId` | 更新自定义技能 | ✅ | Phase 7 |
| `DELETE /api/skills/custom/:skillId` | 删除自定义技能 | ✅ | Phase 7 |
| `GET /api/marketplace/status` | 市场统计 | ✅ | Phase 7.5 |
| `GET /api/marketplace/search` | 搜索 | ✅ | Phase 7.5 |
| `GET /api/marketplace/browse` | 浏览 | ✅ | Phase 7.5 |
| `GET /api/marketplace/top` | 排行榜 | ✅ | Phase 7.5 |
| `GET /api/marketplace/skills/:id` | 详情+评价 | ✅ | Phase 7.5 |
| `POST /api/marketplace/publish` | 发布技能 | ✅ | Phase 7.5 |
| `PUT /api/marketplace/skills/:id` | 更新元数据 | ✅ | Phase 7.5 |
| `DELETE /api/marketplace/skills/:id` | 下架 | ✅ | Phase 7.5 |
| `POST /api/marketplace/skills/:id/install` | 安装 | ✅ | Phase 7.5 |
| `DELETE /api/marketplace/installed/:id` | 卸载 | ✅ | Phase 7.5 |
| `GET /api/marketplace/installed` | 已安装列表 | ✅ | Phase 7.5 |
| `GET /api/marketplace/installed/updates` | 检查更新 | ✅ | Phase 7.5 |
| `POST /api/marketplace/installed/:id/update` | 更新已安装 | ✅ | Phase 7.5 |
| `POST /api/marketplace/skills/:id/reviews` | 提交评价 | ✅ | Phase 7.5 |
| `GET /api/marketplace/skills/:id/reviews` | 获取评价 | ✅ | Phase 7.5 |
| `PUT /api/marketplace/reviews/:id` | 修改评价 | ✅ | Phase 7.5 |
| `DELETE /api/marketplace/reviews/:id` | 删除评价 | ✅ | Phase 7.5 |
| `/api/tasks` | 任务管理 | ❌ | 未来 Phase |
| `/api/settings` | 系统设置 | ❌ | Phase 10 |

**当前 API 总计**: 80 个端点 (Phase 1: 2, Phase 2: 1, Phase 3: 5, Phase 4: 8, Phase 5: 17, Phase 6: 8, Phase 6.5: 17, Phase 7: 10, Phase 7.5: 17, 减去重叠: 5)

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
| `config/decision/` | metrics/collection/insight-rules/strategy YAML | ✅ metrics.yaml + strategy.yaml | Phase 6.5 完成，10 指标定义 + 4 战略目标 |
| `config/skills/` | 内置技能 SKILL.md | ✅ 8 个 SKILL.md (8 子目录) | Phase 7 完成 |

---

## 五、数据目录实现状态

| 数据目录 | PLAN.md 设计 | 实现 | 说明 |
|---------|-------------|------|------|
| `data/org-memory/` | knowledge/ + decisions/ + lessons/ + policies/ | ✅ 4 category dirs + _index.json | Phase 5 完成 |
| `data/memory/` | {personaId}/facts.json + conversations.json | ✅ 按 persona 隔离 | Phase 5 完成 |
| `data/knowledge/` | 文档 + 索引 | ✅ {id}.json + _index.json | Phase 5 完成 |
| `data/proactive/history/` | 执行历史 | ✅ {id}.json + _index.json | Phase 6 完成 |
| `data/proactive/notifications/` | 通知存储 | ✅ {id}.json + _index.json | Phase 6 完成 |
| `data/skills/` | 自定义技能 SKILL.md 文件 | ✅ {skillId}/SKILL.md | Phase 7 完成 |
| `data/skills/installed/` | 已安装 marketplace 技能 | ✅ {skillId}/SKILL.md | Phase 7.5 完成 |
| `data/skill-history/` | 技能执行历史 | ✅ {id}.json + _index.json | Phase 7 完成 |
| `data/marketplace/registry/` | 已发布技能元数据 | ✅ _index.json + {id}.json | Phase 7.5 完成 |
| `data/marketplace/reviews/` | 用户评价 | ✅ _index.json + {id}.json | Phase 7.5 完成 |
| `data/marketplace/installed.json` | 安装记录 | ✅ JSON 数组 | Phase 7.5 完成 |
| `data/mcp/credentials/` | 加密凭证 (AES-256-GCM) | ❌ | Phase 8+ |
| `data/mcp/cache/` | MCP 响应缓存 | ❌ | 未规划具体 Phase |
| `data/mcp/audit/` | 持久化审计日志 | ❌ | 当前内存版 |
| `data/compliance/` | audit-trail/ + pending-approvals/ | ❌ | 当前内存版 |
| `data/decision/` | metrics/ + insights/ + journal/ + strategy/ + reports/ | ✅ 5 子目录 + state.json + _index.json | Phase 6.5 完成 |
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
  ├── @synapse/decision-engine (shared, yaml)                     ✅ ⚠️ 偏差: 不依赖 mcp-hub/org-memory
  ├── @synapse/skill-manager (shared, yaml)                       ✅
  ├── @synapse/skill-marketplace (shared)                         ✅ ⚠️ 偏差: 通过 adapter 回调访问 skill-manager
  ├── @synapse/mcp-hub (shared, @modelcontextprotocol/sdk, zod)   ✅
  │     └── @synapse/server (shared, agent-core, mcp-hub, personas, compliance, memory, proactive, decision-engine, skill-manager, skill-marketplace, hono)  ✅
  └── @synapse/mcp-servers (@modelcontextprotocol/sdk, zod)       ✅ 独立进程
```

**偏差说明**: PLAN.md 设计 proactive、decision-engine、skill-marketplace 依赖 agent-core + mcp-hub 等上游包，实际实现均通过回调注入（`AgentExecutor`/`SkillManagerAdapter`）避免了直接依赖，仅依赖 shared (+ yaml)。这是正向偏差，提供了更好的包解耦和可测试性。

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
| 16 | Decision 依赖 | decision-engine → mcp-hub + org-memory | decision-engine → shared + yaml（回调注入） | 与 proactive 统一解耦模式 | 正向偏差 |
| 17 | Decision Cron | 复用 proactive CronScheduler | 自写 matchesCron（~40 行） | 不引入包间依赖，保持独立 | 正向偏差 |
| 18 | 指标计算 | 内置公式引擎 | Agent prompt 查询+计算（LLM-driven） | AI-native：灵活适配任意数据源 | 简化，Phase 8+ 增强 |
| 19 | 洞察算法 | 6 种独立分析算法 | 单一 LLM prompt 驱动 6 维分析 | 开发效率高，质量依赖 LLM | 简化，Phase 8+ 混合模式 |
| 20 | 报告格式 | Markdown + PDF + Excel | 仅 Markdown 文本 | Phase 6.5 聚焦核心流程 | Phase 10 补齐 |
| 21 | Skill 格式 | TypeScript 插件 or YAML 模板 | SKILL.md (YAML frontmatter + Markdown body) | 人可读+机器可解析，与 config/ 模式一致 | 正向偏差 |
| 22 | Skill 执行 | 隔离沙箱 | Agent 子任务 + allowedTools 交集限制 | 复用 Agent 引擎，最小权限 | 简化，Phase 8+ 沙箱 |
| 23 | Marketplace 依赖 | skill-marketplace → skill-manager | skill-marketplace → shared（SkillManagerAdapter 回调注入） | 与 proactive/decision 统一解耦模式 | 正向偏差 |
| 24 | Marketplace Registry | 远程 JSON Registry | 本地文件模拟 (`_index.json + {id}.json`) | Phase 7.5 初期，PLAN.md 明确要求 JSON 文件模拟 | Phase 8+ 远程 |

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
| Phase 6.5 | 决策智能 (数据→洞察→决策→战略) | ✅ 完成 | 2026-03-02 | `fe208ed`, `8b677df` |
| Phase 7 | Skill 系统 + 管理器 | ✅ 完成 | 2026-03-02 | 待提交 |
| Phase 7.5 | Skill Marketplace | ✅ 完成 | 2026-03-03 | 待提交 |
| Phase 8 | 企业业务系统 MCP Servers | 📋 待开始 | — | — |
| Phase 9 | 浏览器自动化 | 📋 待开始 | — | — |
| Phase 10 | Web UI | 📋 待开始 | — | — |

---

## 九、下一阶段（Phase 8）设计预检

Phase 8 将实现企业业务系统 MCP Servers，需要关注以下设计点：

### 需扩展的模块
- `packages/mcp-servers/` 新增: feishu, hrm, finance, legal, crm 等业务系统 Adapter
- `@synapse/mcp-hub` 可能: Auth Gateway（凭证加密）、独立 Router 模块
- `@synapse/server` 新增: `/api/settings` 路由 (MCP Server 配置管理)

### 设计决策待定
- MCP Auth: 凭证加密 AES-256-GCM vs 环境变量 vs Vault 集成
- MCP Router: 基于 tool name 的路由 vs 基于 Server category 的路由
- 业务系统适配: 直接 API 调用 vs SDK 封装 vs 通用 HTTP 适配器

### 前置依赖检查
- ✅ MCP Hub 核心框架已完成（Registry + Aggregator + Health + Audit + Rate Limit）
- ✅ database + http-api 两个基础 MCP Server 已验证模式
- ✅ Agent tool loop 支持 MCP 工具自动发现和注册
- ⚠️ 需要企业系统 API 文档和测试账号

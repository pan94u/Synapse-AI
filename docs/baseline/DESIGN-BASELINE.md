# Synapse AI — 设计基线 (Design Baseline)

> 追踪 PLAN.md 设计与代码实现之间的对齐关系。每个 Phase 结束后更新。
> 最后更新: 2026-03-05 | 全 Phase 审计完成 (Phase 1-10) + Session 13 审核引擎增量更新 + PLAN.md 未落地功能清单 (33 项)

---

## 一、九层架构实现状态

| 层 | 名称 | PLAN.md 设计 | 实现状态 | 实现位置 | 偏差说明 |
|----|------|-------------|---------|---------|---------|
| ① | 用户与角色层 | 角色画像 Personas（职责、权限、默认技能、沟通风格） | ✅ 已实现 | `packages/personas/` + `config/personas/` | Phase 4 完成，7 个角色画像 |
| ② | 交互体验层 | Web UI (Next.js + shadcn/ui)，6 大功能模块 | ✅ 已实现 | `packages/web/` | Phase 10 完成，10 个页面（chat + personas + 8 新增），~40 个组件，19 个 shadcn/ui 组件 |
| ③ | 服务网关层 | Hono API 路由、鉴权、角色上下文注入、SSE、WebSocket | ⚠️ 部分实现 | `packages/server/` | 已有: 路由 + SSE + CORS + 角色注入。缺: 鉴权、WebSocket |
| ④ | 智能中枢层 | Agent 引擎 (Planner + Executor + Tool Loop + Model Router + 多 Agent 协调 + 上下文管理) | ⚠️ 部分实现 | `packages/agent-core/` | 已有: Model Router + Agent + Tool Loop (16 内置工具) + persona context + compliance hooks + memory/browser/skill tools。缺: Planner、多 Agent 协调 |
| ⑤ | 合规引擎 | Pre-Hook + Post-Run Hook 双阶段 | ✅ 已实现 | `packages/compliance/` + `config/compliance/` | Phase 4 完成，14 条规则，4 个规则集 |
| ⑥ | 主动智能 | 定时任务 + 事件触发 + 阈值监控 | ✅ 已实现 | `packages/proactive/` + `config/proactive/` | Phase 6 完成，5 cron + 6 events + 2 monitors |
| ⑥.5 | 决策智能 | 数据采集→指标→洞察→决策→战略追踪 | ✅ 已实现 | `packages/decision-engine/` + `config/decision/` | Phase 6.5 完成，6 组件 + 16 API |
| ⑦ | 能力层 | 技能系统 + 内置工具 + 记忆 + 知识 + 技能市场 | ✅ 已实现 | `packages/skill-manager/` + `packages/skill-marketplace/` + `packages/memory/` | Phase 7+7.5 完成，10 内置技能 + Marketplace (20 API) + 排名+评分+质量管控+**上下架审核引擎** |
| ⑧ | 企业集成层 | MCP Hub (Registry + Aggregator + Router + Auth + Health + Audit + Rate Limit) | ✅ 基础实现 | `packages/mcp-hub/` | Phase 3 完成核心框架。缺: Auth Gateway（凭证加密）、Router（独立路由模块） |
| ⑨ | 企业数字化系统 | 人财法 CRM ERP 等 MCP Servers | ⚠️ 部分实现 | `packages/mcp-servers/` | 已有: database (SQLite) + http-api (完整) + 7 stub servers (bi, crm, erp, feishu, finance, hrm, legal)。缺: stub 填充实际业务逻辑 |

---

## 二、包（Package）实现状态

### 2.1 已实现的包

| 包 | PLAN.md 规划 | 实际实现 | 完整度 |
|----|-------------|---------|--------|
| `@synapse/shared` | 全部共享类型 | Chat + Tool + Model + MCP + Persona + Compliance + Memory + Proactive + Decision + Skill + Marketplace 类型 (含 PublishReviewResult + ReviewDecision) | 100% |
| `@synapse/agent-core` | Model Router + Agent + Tools + Skills + Memory | Model Router + Agent + Tools (16 内置: 3 file + shell + web-fetch + 3 memory + knowledge-search + skill-execute + 6 browser) + Compliance Hooks | 75% — 缺 Planner/多 Agent |
| `@synapse/personas` | 角色画像加载、注册、上下文构建 | YAML loader + PersonaRegistry + buildContext + buildSystemPrompt | 95% — 完整实现 |
| `@synapse/compliance` | Pre-Hook + Post-Hook + 审计 + 审批 | Engine + PreHook + PostHook + Masker + Evaluator + AuditTrail + ApprovalManager | 90% — 审计内存版，缺持久化 |
| `@synapse/memory` | 组织记忆 + 个人记忆 + 知识库 | OrgMemoryStore + PersonalMemoryStore + KnowledgeBase | 85% — 缺向量搜索 |
| `@synapse/proactive` | 定时任务 + 事件触发 + 阈值监控 | CronScheduler + EventBus + ActionRegistry + ThresholdMonitor + TaskManager + History + Notifications | 80% — 缺通知推送渠道 |
| `@synapse/decision-engine` | 决策智能: 指标采集+洞察+战略+决策+报告 | MetricStore + DataCollector + InsightEngine + StrategyTracker + DecisionJournal + ReportGenerator + Engine | 80% — 缺可视化+PDF 报告 |
| `@synapse/mcp-hub` | Hub + Client + Registry + Lifecycle + Aggregator + Health + Audit + Rate Limiter | 全部核心组件 | 80% — 缺 Auth Gateway + 独立 Router |
| `@synapse/mcp-servers` | 15+ 个 MCP Server | database (SQLite) + http-api + 7 stub servers (bi, crm, erp, feishu, finance, hrm, legal) | 30% — 基础设施层 2/4，业务系统层 7/9 stub |
| `@synapse/skill-manager` | Skill 系统: 解析+注册+执行+历史 | SkillParser + SkillLoader + SkillRegistry + SkillStore + SkillExecutor + ExecutionHistory + SkillManager | 90% — 缺 Skill 版本管理 |
| `@synapse/skill-marketplace` | Skill 市场: 发布+搜索+安装+评分+排名+质量管控+**上下架审核** | MarketplaceRegistry + RatingStore + RankingEngine + ReviewEngine (validateForPublish + **publishReview** + qualityCheck) + SkillInstaller + SkillMarketplace | 90% — 缺远程 registry 联动 |
| `@synapse/browser` | 浏览器自动化 (BrowserPool + Playwright) | BrowserPool (session 管理 + max 5 并发 + 10min 自动清理) | 80% — 缺: 多浏览器支持 |
| `@synapse/server` | Hono API 全部路由 | chat + agent + mcp + personas + compliance + org-memory + memory + knowledge + proactive + decision + skills + marketplace (12 路由模块, 89 端点) | 75% — 12/14+ 路由模块 |

### 2.2 Phase 10 新增

| 包 | PLAN.md 规划 | 实际实现 | 完整度 |
|----|-------------|---------|--------|
| `@synapse/web` | Next.js 前端: 6 大功能模块 | 10 个页面 + ~40 组件 + 19 shadcn/ui 组件 + i18n + API Proxy + SSE 流式 + Zustand 状态管理 | 85% — 缺: 登录鉴权、WebSocket 实时推送、移动端适配优化 |

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
| skill_execute | 执行技能 | ✅ `built-in/skill-execute.ts` | Phase 7 |
| browser_navigate | 浏览器导航 | ✅ `built-in/browser-navigate.ts` | Phase 9 |
| browser_click | 浏览器点击 | ✅ `built-in/browser-click.ts` | Phase 9 |
| browser_fill | 浏览器输入 | ✅ `built-in/browser-fill.ts` | Phase 9 |
| browser_extract | 浏览器提取 | ✅ `built-in/browser-extract.ts` | Phase 9 |
| browser_evaluate | 浏览器执行 JS | ✅ `built-in/browser-evaluate.ts` | Phase 9 |
| browser_screenshot | 浏览器截图 | ✅ `built-in/browser-screenshot.ts` | Phase 9 |

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
| 内置技能 | config/skills/ 目录 | ✅ 10 个 SKILL.md | 完全匹配 | Session 13 新增 discussion-report + quick-summary |
| Persona 技能 | defaultSkills glob 匹配 | ✅ persona YAML 字段 | 完全匹配 | — |

### 3.10 Skill Marketplace（⑦ 能力层 — Phase 7.5 + Session 13 增强）

| 设计项 | PLAN.md 设计 | 实现 | 状态 | 偏差 |
|--------|-------------|------|------|------|
| 发布注册表 | `_index.json + {id}.json` | ✅ `marketplace-registry.ts` | 完全匹配 | publish/unpublish/search/setStatus |
| 评分评价 | 每用户每技能唯一 | ✅ `rating-store.ts` | 完全匹配 | 自动计算平均分 |
| 排名算法 | downloads(0.3)+rating(0.3)+success(0.2)+recency(0.2) | ✅ `ranking-engine.ts` | 完全匹配 | 90 天半衰期 |
| 发布基础审核 | name/description/instructions/category 必填 | ✅ `review-engine.ts` validateForPublish | 完全匹配 | + 安全检查 shell_exec+file_write |
| **发布自动评分** | — | ✅ `review-engine.ts` publishReview | **Session 13 新增** | 4 维度 100 分制 (见下表) |
| **5 态状态机** | 3 态: active/deprecated/suspended | ✅ `MarketplaceSkill.status` | **Session 13 扩展** | 新增 pending_review + rejected |
| 质量管控 | 低评分/高失败率 → suspend | ✅ `review-engine.ts` qualityCheck | 增强 | + 零下载 180 天→deprecated + 举报≥3→suspended |
| **人工审核** | — | ✅ `skill-marketplace.ts` reviewSkill | **Session 13 新增** | pending_review → active/rejected |
| **审核队列** | — | ✅ `skill-marketplace.ts` listPendingReview | **Session 13 新增** | registry.search({ status: 'pending_review' }) |
| **重新上架** | — | ✅ `skill-marketplace.ts` reactivate | **Session 13 新增** | suspended/deprecated/rejected → 重新审核 |
| 安装器 | install/uninstall/update + installed.json | ✅ `skill-installer.ts` | 完全匹配 | checkUpdates 版本比对 |
| 主编排器 | SkillMarketplace + SkillManagerAdapter | ✅ `skill-marketplace.ts` | 完全匹配 | 回调注入避免循环依赖 |
| 依赖 | skill-marketplace → skill-manager | ⚠️ skill-marketplace → shared | 正向偏差 | 通过 adapter 解耦 |

#### publishReview 自动评分维度

| 维度 | 权重 | 满分条件 | 0 分条件 |
|------|------|---------|---------|
| 功能完整性 | 30% | instructions 含"任务说明"+"执行步骤"+"输出格式" | instructions < 50 字 |
| 工具合理性 | 25% | allowedTools 1-10 个且无高危组合 | 0 个工具或 >15 个 |
| 安全合规 | 25% | 无 shell_exec+file_write 同时存在 | 仅含 shell_exec 且无描述 |
| 用户体验 | 20% | description ≤200 字 + parameters 有 description | 无 description |

**评分阈值**: ≥70 自动上架 (active) | 30-69 待人工审核 (pending_review) | <30 拒绝发布

#### 状态流转图

```
                   ┌─── score ≥ 70 ───→ active
                   │                      │
publish() → publishReview() → 30-69 → pending_review → approve → active
                   │                      │                │
                   └─── score < 30 ──→ rejected ←── reject ┘
                                          │
                                   reactivate() → 重新审核
                                          ▲
           qualityCheck() ── 低评分/高失败率 ──→ suspended
                          ── 零下载 180 天 ──→ deprecated
```

### 3.11 Web UI（② 交互体验层 — Phase 10）

| 设计项 | PLAN.md 设计 | 实现 | 状态 | 偏差 |
|--------|-------------|------|------|------|
| 框架 | Next.js + React + TailwindCSS + shadcn/ui | Next.js 15 (App Router) + React 19 + Tailwind CSS 4 + shadcn/ui (new-york) | ✅ | Tailwind v4 + React 19 超前 |
| 页面数 | 6 大功能模块 | 10 个页面 (chat, personas, mcp, skills, compliance, memory, proactive, decision, marketplace, settings) | ✅ | 8 新增功能页面 > PLAN 设计的 6 |
| 组件库 | shadcn/ui 基础组件 | 19 个 shadcn/ui 组件 (button, card, badge, avatar, skeleton, textarea, scroll-area, tooltip, dropdown-menu, sheet, collapsible, separator, tabs, table, dialog, input, label, select, switch) | ✅ | 完全匹配 |
| 功能组件 | — | ~40 个业务组件 (panels, lists, cards, dialogs, views) | ✅ | 每个页面独立 panel + 子组件 |
| 状态管理 | — | Zustand 5 (persona-store 持久化 + chat-store + ui-store) | ✅ | 轻量级，无 Redux |
| API 通信 | — | `apiFetch<T>()` 通用函数 + Next.js API 代理路由 (`/api/[...path]`) | ✅ | 完全匹配 |
| 流式 Chat | SSE 流式 | `streamAgentChat()` SSE 解析 + 流式渲染 (text/tool_call/tool_result/done) | ✅ | 完全匹配 |
| 国际化 | — | `messages/zh.ts` 静态对象 (~300 词条)，8 页面全覆盖 | ✅ | 单语言静态对象，简洁有效 |
| 部署 | Docker 容器化 | `Dockerfile.web` (standalone output) + docker-compose `synapse-web:19300→3000` | ✅ | 完全匹配 |
| 登录鉴权 | 用户认证 | ❌ 未实现 | — | Phase 8+ 补齐 |
| WebSocket | 实时推送 | ❌ 未实现 (通知仅 API 轮询) | — | Phase 8+ 补齐 |
| 响应式 | 移动端适配 | ⚠️ 基础响应式 (sidebar collapse + sheet) | — | 需更多移动端优化 |

#### Phase 10 页面实现清单

| 页面 | 路径 | 核心组件 | 对接 API | Bundle Size |
|------|------|---------|---------|-------------|
| 智能对话 | `/chat` | ChatPanel + MessageList + ChatInput + SSE streaming | POST /api/agent | 108 kB |
| 角色管理 | `/personas` | PersonaList + PersonaCard + PersonaTools | GET /api/personas | 7.91 kB |
| MCP 连接 | `/mcp` | McpPanel (tabs: 服务器/工具/审计日志) | GET /api/mcp/* | 3.33 kB |
| Skill 管理 | `/skills` | SkillPanel (tabs: 全部/历史) + SkillCard + DetailDialog + CreateDialog | GET/POST /api/skills/* | 6.41 kB |
| 合规审计 | `/compliance` | CompliancePanel (tabs: 规则/审计/审批) + RuleList (collapsible) | GET/POST /api/compliance/* | 4.56 kB |
| 记忆系统 | `/memory` | MemoryPanel (tabs: 个人/组织/知识库) + OrgMemoryDialog + ImportDialog | /api/memory/*, /api/org-memory, /api/knowledge | 13.4 kB |
| 主动智能 | `/proactive` | ProactivePanel (tabs: 概览/动作/通知/历史) + SchedulerStatus cards | GET/POST /api/proactive/* | 3.91 kB |
| 决策智能 | `/decision` | DecisionPanel (tabs: 指标/洞察/战略/日志/报告) + JournalDialog | /api/decision/* | 6.43 kB |
| Skill 市场 | `/marketplace` | MarketplacePanel + Stats + SkillBrowser + ReviewDialog + InstalledList + **ReviewQueue** | /api/marketplace/* | 8.66 kB |
| 系统设置 | `/settings` | SettingsPanel (系统信息 + Skill 状态 + 服务状态) | GET /health, /api/skills/status, /api/mcp/servers | 1.54 kB |

#### 前端架构模式

```
src/
├── app/{route}/page.tsx          # 页面入口: 'use client' + p-6 + h1 + Panel
├── components/{route}/           # 业务组件: Panel + List/Card/Dialog/View
│   ├── *-panel.tsx               # 主面板: Tabs 容器，切换子视图
│   ├── *-list.tsx / *-view.tsx   # 数据列表: fetch + loading/error/empty 三态
│   └── *-dialog.tsx              # 弹窗: 创建/编辑/详情
├── components/ui/                # shadcn/ui 原子组件 (19 个)
├── lib/api.ts                    # apiFetch<T>() 统一请求
├── lib/constants.ts              # NAV_ITEMS 导航配置
├── messages/zh.ts                # i18n 静态文案
└── stores/                       # Zustand 状态 (persona, chat, ui)
```

**数据获取模式**: `useState + useEffect + apiFetch<T>()` → loading → error → data，无需额外 SWR/React Query。
**UI 三态模式**: `<Skeleton />` 骨架屏 → `text-muted-foreground` 错误提示 → 实际内容。
**操作模式**: Button onClick → `apiFetch(POST)` → 刷新列表；Dialog 用于 CRUD 表单。

### 3.12 MCP Hub（⑧ 企业集成层）

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

### 3.13 MCP Servers（⑨ 企业数字化系统）

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
| **bi** | ⚠️ stub | Phase 9 新增 stub，待填充 BI 系统 API |
| **crm** | ⚠️ stub | Phase 9 新增 stub，待填充 CRM API |
| **erp** | ⚠️ stub | Phase 9 新增 stub，待填充 ERP API |
| **feishu** | ⚠️ stub | Phase 9 新增 stub，待填充飞书 API |
| **finance** | ⚠️ stub | Phase 9 新增 stub，待填充财务系统 API |
| **hrm** | ⚠️ stub | Phase 9 新增 stub，待填充 HRM API |
| **legal** | ⚠️ stub | Phase 9 新增 stub，待填充法务系统 API |
| wechat-work / dms | ❌ | 未创建 |

### 3.14 Server API（③ 服务网关层）

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
| `GET /api/compliance/rules` | 合规规则集列表 | ✅ | Phase 4 |
| `GET /api/compliance/rules/:id` | 规则集详情 | ✅ | Phase 4 |
| `GET /api/compliance/audit` | 合规审计轨迹 | ✅ | Phase 4 |
| `GET /api/compliance/approvals` | 待审批列表 | ✅ | Phase 4 |
| `POST /api/compliance/approvals/:id/approve` | 批准审批 | ✅ | Phase 4 |
| `POST /api/compliance/approvals/:id/deny` | 拒绝审批 | ✅ | Phase 4 |
| `GET /api/org-memory` | 组织记忆列表 | ✅ | Phase 5 |
| `GET /api/org-memory/search` | 组织记忆搜索 | ✅ | Phase 5 |
| `GET /api/org-memory/:id` | 组织记忆详情 | ✅ | Phase 5 |
| `POST /api/org-memory` | 新建组织记忆 | ✅ | Phase 5 |
| `PUT /api/org-memory/:id` | 更新组织记忆 | ✅ | Phase 5 |
| `DELETE /api/org-memory/:id` | 删除组织记忆 | ✅ | Phase 5 |
| `GET /api/memory/:personaId/facts` | 个人偏好列表 | ✅ | Phase 5 |
| `GET /api/memory/:personaId/facts/:key` | 单个偏好 | ✅ | Phase 5 |
| `PUT /api/memory/:personaId/facts/:key` | 设置偏好 | ✅ | Phase 5 |
| `DELETE /api/memory/:personaId/facts/:key` | 删除偏好 | ✅ | Phase 5 |
| `GET /api/memory/:personaId/conversations` | 对话摘要列表 | ✅ | Phase 5 |
| `POST /api/memory/:personaId/conversations` | 记录对话摘要 | ✅ | Phase 5 |
| `GET /api/knowledge` | 知识库文档列表 | ✅ | Phase 5 |
| `GET /api/knowledge/search` | 知识库搜索 | ✅ | Phase 5 |
| `POST /api/knowledge` | 导入知识文档 | ✅ | Phase 5 |
| `GET /api/knowledge/:id` | 知识文档详情 | ✅ | Phase 5 |
| `DELETE /api/knowledge/:id` | 删除知识文档 | ✅ | Phase 5 |
| `GET /api/proactive/status` | 调度器状态 | ✅ | Phase 6 |
| `GET /api/proactive/actions` | 列出所有 action | ✅ | Phase 6 |
| `POST /api/proactive/actions/:id/execute` | 手动执行 action | ✅ | Phase 6 |
| `POST /api/proactive/events` | 发射事件 | ✅ | Phase 6 |
| `GET /api/proactive/history` | 执行历史 | ✅ | Phase 6 |
| `GET /api/proactive/notifications` | 通知查询 | ✅ | Phase 6 |
| `POST /api/proactive/notifications/:id/read` | 标记已读 | ✅ | Phase 6 |
| `POST /api/proactive/notifications/read-all` | 全部已读 | ✅ | Phase 6 |
| `GET /api/decision/status` | 决策引擎状态 | ✅ | Phase 6.5 |
| `GET /api/decision/metrics` | 指标定义列表 | ✅ | Phase 6.5 |
| `GET /api/decision/metrics/:id/snapshots` | 指标历史快照 | ✅ | Phase 6.5 |
| `POST /api/decision/metrics/:id/collect` | 手动采集指标 | ✅ | Phase 6.5 |
| `GET /api/decision/insights` | 洞察查询 (支持 type/severity 筛选) | ✅ | Phase 6.5 |
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
| `POST /api/marketplace/publish` | 发布技能 (含自动审核评分) | ✅ | Phase 7.5 + Session 13 增强 |
| `GET /api/marketplace/pending` | 待审核列表 | ✅ | Session 13 |
| `POST /api/marketplace/skills/:id/review` | 审核决定 (approve/reject) | ✅ | Session 13 |
| `POST /api/marketplace/skills/:id/reactivate` | 重新上架 | ✅ | Session 13 |
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
| `/api/settings` | 系统设置 | ⚠️ 前端组合 | Phase 10 前端通过 /health + /api/skills/status + /api/mcp/servers 组合实现 |

**当前 API 总计**: 89 个后端端点 (12 路由模块 + health/root) + 1 个前端 API 代理路由 (`/api/[...path]` → backend)

**Phase 10 前端 API 代理**: Next.js App Router 的 `app/api/[...path]/route.ts` 将所有 `/api/*` 请求透传至后端 `BACKEND_URL/api/*`，支持 SSE 流式透传。前端 8 个新页面共对接 ~33 个后端 API 端点（含 Session 13 审核队列 3 个新端点）。

---

## 四、配置体系实现状态

| 配置目录 | PLAN.md 设计 | 实现 | 说明 |
|---------|-------------|------|------|
| `config/mcp-servers/` | 全部 MCP Server JSON 配置 | ✅ 9 个 JSON (database, http-api, bi, crm, erp, feishu, finance, hrm, legal) | 9/15+ 配置文件 |
| `config/personas/` | 7 个角色画像 YAML | ✅ 7 个 YAML | Phase 4 完成 |
| `config/compliance/rules/` | finance/legal/hr/general YAML 规则 | ✅ 4 个 YAML (14 条规则) | Phase 4 完成 |
| `config/compliance/approval-flows.yaml` | 审批流定义 | ❌ 内置在 ApprovalManager | 简化 |
| `config/proactive/actions/` | action prompt 模板 | ✅ 11 个 YAML | Phase 6 完成 |
| `config/proactive/monitors/` | 阈值监控配置 | ✅ 2 个 YAML | Phase 6 完成 |
| `config/decision/` | metrics/collection/insight-rules/strategy YAML | ✅ metrics.yaml + strategy.yaml | Phase 6.5 完成，10 指标定义 + 4 战略目标 |
| `config/skills/` | 内置技能 SKILL.md | ✅ 10 个 SKILL.md (10 子目录) | Phase 7 完成，Session 13 新增 discussion-report + quick-summary |

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
| `data/browser/screenshots/` | 浏览器截图 | ✅ BrowserPool 自动管理 | Phase 9 完成 |
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
  ├── @synapse/browser (playwright)                               ✅ Phase 9 新增
  ├── @synapse/mcp-hub (shared, @modelcontextprotocol/sdk, zod)   ✅
  │     └── @synapse/server (shared, agent-core, mcp-hub, personas, compliance, memory, proactive, decision-engine, skill-manager, skill-marketplace, browser, hono)  ✅
  ├── @synapse/web (shared, next, react, zustand, radix-ui, lucide-react)  ✅ Phase 10 新增
  └── @synapse/mcp-servers (@modelcontextprotocol/sdk, zod)       ✅ 独立进程 (9 servers)
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
| 25 | Web UI 模块数 | 6 大功能模块 | 10 个页面 (2 原有 + 8 新增) | 8 个功能入口 > PLAN 设计的 6 (多: mcp, marketplace) | 正向偏差: 覆盖更全 |
| 26 | Web UI 状态管理 | PLAN 未明确 | Zustand 5 (3 store: persona + chat + ui) | 轻量级选型 | 正向偏差: 无 Redux 复杂度 |
| 27 | Web UI 数据获取 | PLAN 未明确 | useState + useEffect + apiFetch<T>() | 无 SWR/React Query 依赖 | 正向偏差: 零额外依赖 |
| 28 | Web UI i18n | 多语言 | 单语言 `zh.ts` 静态对象 (~300 词条) | Phase 10 聚焦功能完整性 | Phase 8+ 多语言 |
| 29 | Web UI 鉴权 | 用户登录认证 | 前端无鉴权，后端 API 透传 | Phase 10 聚焦 UI，鉴权依赖 Phase 8 企业系统 | Phase 8+ 补齐 |
| 30 | API Proxy | PLAN 未明确 | Next.js `app/api/[...path]/route.ts` 透传至 BACKEND_URL + SSE 流式透传 | 前端无需 CORS，统一代理 | 正向偏差 |

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
| Phase 10 | Web UI (8 功能页面 + ~40 组件 + 7 shadcn/ui) | ✅ 完成 | 2026-03-04 | 待提交 |
| Phase 8 | 企业业务系统 MCP Servers | 📋 待开始 | — | — |
| Phase 9 | 浏览器自动化 + MCP Server Stubs | ✅ 完成 | 2026-03-03 | 待提交 |
| Phase 10.5 | MCP Server 能力扩展（远程 SSE UX + Swagger 导入 + 原语 + 双模式客户端） | 📋 待开始 | — | — |
| Phase 11.5 | MCP OAuth 认证（per-user 身份 + Token 管理） | 📋 待开始 | — | — |

---

## 九、Phase 9 实施总结

### 实施范围

Phase 9 完成浏览器自动化能力和 MCP Server 业务系统 stub 创建。

### 关键产出

1. **@synapse/browser 包** — `BrowserPool` 类 (Playwright Chromium)，session 管理 + max 5 并发 + 10min 自动清理
2. **6 个浏览器工具** — browser_navigate, browser_click, browser_fill, browser_extract, browser_evaluate, browser_screenshot，集成到 agent-core built-in tools
3. **7 个 MCP Server stubs** — bi, crm, erp, feishu, finance, hrm, legal，含配置文件 (config/mcp-servers/*.json)

### 文件统计

| 类别 | 数量 |
|------|------|
| 新增 @synapse/browser 包 | 1 (src/index.ts + package.json + tsconfig.json) |
| 新增浏览器工具 (agent-core) | 8 (6 tools + browser-types.ts + browser-wait.ts) |
| 新增 MCP Server stubs | 7 子目录 |
| 新增 MCP Server 配置 | 7 JSON |
| **总计新增文件** | **~25** |

---

## 九.二、Phase 10 实施总结

### 实施范围

Phase 10 完成了 Synapse AI 全部前端功能，从 2 个页面 (chat + personas) 扩展到 10 个页面，覆盖全部后端 API。

### 实施过程

1. **基础设施准备** — 移除 8 个导航项的 `disabled: true`，新增 7 个 shadcn/ui 组件 (tabs, table, dialog, input, label, select, switch)，扩展 `zh.ts` i18n (~300 词条)
2. **8 个页面按复杂度递增实施** — MCP (最简只读) → Skills (CRUD) → Compliance (规则+审计+审批) → Memory (三模块+角色关联) → Proactive (状态+动作+通知) → Decision (最复杂 5 tabs) → Marketplace (浏览+安装+评价) → Settings (聚合展示)
3. **构建验证** — `bun run build` 编译通过，14 个路由全部生成，TypeScript 零错误
4. **Docker 发布** — `docker compose build synapse-web && docker compose up -d synapse-web`，容器运行在 19300 端口

### 构建产物

```
Route (app)                    Size      First Load JS
/                              124 B     102 kB
/chat                          107 kB    220 kB
/compliance                    4.56 kB   125 kB
/decision                      6.43 kB   136 kB
/marketplace                   6.09 kB   136 kB
/mcp                           3.33 kB   124 kB
/memory                        13.4 kB   155 kB
/personas                      7.83 kB   117 kB
/proactive                     3.90 kB   125 kB
/settings                      1.54 kB   115 kB
/skills                        6.42 kB   136 kB
+ First Load JS shared         102 kB
```

### 文件统计

| 类别 | 数量 |
|------|------|
| 新增页面 (page.tsx) | 8 |
| 新增业务组件 | ~40 |
| 新增 shadcn/ui 组件 | 7 |
| 修改文件 (constants.ts, zh.ts, package.json) | 3 |
| **总计新增/修改文件** | **~58** |

### 技术决策记录

| 决策 | 选择 | 理由 |
|------|------|------|
| 数据获取 | `useState + useEffect + apiFetch` | 无额外依赖，与现有 hooks 模式一致 |
| Tab 子页面 | Radix Tabs 统一容器 | 每页 1 个 Panel 组件管理多 tabs，简洁 |
| CRUD 操作 | Dialog 弹窗 | 保持列表页简洁，Dialog 承载表单 |
| 筛选/搜索 | `useState` 本地状态 | 无需 Zustand，组件内自管理 |
| 新增 Radix 依赖 | tabs, label, select, switch | node_modules 已有，package.json 补齐声明 |

---

## 十、MCP Marketplace 设计（Phase 8 扩展）

### 架构概览

```
MCPHub ←──── MCPHubAdapter (接口) ←──── MCPMarketplace
  │                                          │
  ├─ Registry (connected servers)        ├─ MarketplaceRegistry (file-based)
  ├─ Metrics (uptimeRate/latency/error)  ├─ RatingStore (user reviews)
  └─ Config (MCPServerConfig)            ├─ RankingEngine (纯函数)
                                         └─ ReviewEngine (发布审核 + 质量检查)
```

**循环依赖避免**: `MCPMarketplace` 不直接依赖 `@synapse/mcp-hub`，通过 `MCPHubAdapter` 接口由 `server` 层桥接注入，实现真正的模块隔离。

### 数据模型

**MCPServerListing 三段结构**:
| 段 | 字段 | 来源 |
|---|------|------|
| 静态元数据 | id/name/description/category/tags/author/version/toolCount/toolNames/serverConfig | 发布时写入 |
| 运行时指标 | uptimeRate/avgLatencyMs/errorRate/totalCalls | `syncMetrics()` 从 MCPHub 同步 |
| 市场数据 | installs/rating{average,count}/status/publishedAt/updatedAt | 用户行为驱动 |

**状态机 (MCPListingStatus)**:
```
pending_review → active ←→ suspended
                     ↓
               deprecated / rejected
```

### 排名算法

```
score = reliability×0.35 + performance×0.25 + rating×0.25 + recency×0.15

reliability = uptimeRate × (1 - errorRate)
performance = 1 - clamp(avgLatencyMs / 5000, 0, 1)
rating      = count===0 ? 0.5 : average / 5          # 无评价给中立 0.5
recency     = 2^(-daysSinceUpdate / 90)              # 90 天半衰期
```

### 质量检查触发条件

| 条件 | 操作 |
|------|------|
| errorRate > 30% && totalCalls ≥ 20 | suspend |
| uptimeRate < 70% && totalCalls ≥ 10 | suspend |
| rating.average < 2.0 && rating.count ≥ 3 | suspend |
| reportCount ≥ 3 | suspend |
| avgLatencyMs > 5000 | warn |
| 90 天无调用 | deprecated |

### 发布审核评分

| 维度 | 权重 | 通过条件 |
|------|------|---------|
| 文档质量 | 30% | description 非空 + tags ≥ 1 + name 合规 |
| 工具覆盖 | 25% | toolCount ≥ 1 |
| 安全配置 | 25% | requireApproval 已配置 |
| 配置完整性 | 20% | healthCheck + rateLimit 字段完整 |

- score ≥ 70 → `active` (autoApprove)
- 30-69 → `pending_review`
- < 30 → 拒绝发布 (400)

### API 端点 (16 个)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /mcp-marketplace/status | 市场统计 |
| GET | /mcp-marketplace/browse | 浏览（category, sort） |
| GET | /mcp-marketplace/top | 排行榜（limit=10） |
| GET | /mcp-marketplace/search | 搜索 |
| GET | /mcp-marketplace/pending | 待审核列表 |
| POST | /mcp-marketplace/publish | 发布 MCP Server |
| GET/PUT/DELETE | /mcp-marketplace/servers/:id | 详情/更新/下架 |
| POST | /mcp-marketplace/servers/:id/install | 安装到 Hub |
| POST | /mcp-marketplace/servers/:id/uninstall | 卸载 |
| POST | /mcp-marketplace/servers/:id/review | 人工审核 |
| GET/POST | /mcp-marketplace/servers/:id/reviews | 评价列表/提交 |
| GET | /mcp-marketplace/installed | 已安装列表 |
| POST | /mcp-marketplace/sync/:id | 同步运行时指标 |

### 文件存储结构

```
data/mcp-marketplace/
├── registry/
│   ├── _index.json      # { id, name, category, status, publishedAt }[]
│   └── {serverId}.json  # 完整 MCPServerListing
└── reviews/
    ├── _index.json      # { id, serverId, userId, rating, createdAt }[]
    └── {reviewId}.json  # 完整 MCPServerReview
```

### 前端页面结构

```
/mcp-marketplace
└── McpMarketplacePanel
    ├── McpMarketplaceStats（5 卡片：已发布/已安装/待审核/平均可用率/总调用数）
    └── Tabs
        ├── browse — ServerBrowser（搜索+分类过滤+排序） → ServerCard × N
        │           → ServerDetailDialog（工具列表+运行指标+评价）
        ├── installed — 已安装列表（inline）
        └── pending   — 审核队列（inline），同 Skill Marketplace ReviewQueue 模式
```

### 技术决策记录

| 决策 | 选择 | 理由 |
|------|------|------|
| Hub-Marketplace 解耦 | MCPHubAdapter 接口 + server 层桥接 | 避免循环依赖，两包独立可测 |
| hub['registry'] bracket 访问 | 不新增 MCPHub 公共方法 | 保持 MCPHub API 清洁 |
| getServerStatus 返回 string | 不用 MCPListingStatus 枚举 | Hub 状态(connected/error/...) ≠ 市场状态 |
| syncMetrics 双态检查 | `=== 'connected' \|\| === 'active'` | app.ts adapter 已将 hub 状态映射为 'active' |
| toolCount 在 seed 时为 0 | 已知限制，sync 后更新 | Hub 连接工具发现是异步的，seed 时还未完成 |

---

## 十一、下一阶段设计预检

### Phase 9+ — 能力增强

**设计决策待定**:
- MCP Auth: 凭证加密 AES-256-GCM vs 环境变量 vs Vault 集成
- MCP Router: 基于 tool name 的路由 vs 基于 Server category 的路由
- 业务系统适配: 直接 API 调用 vs SDK 封装 vs 通用 HTTP 适配器
- 用户鉴权: 前端登录 + 后端 Token 校验方案

**前置依赖检查**:
- ✅ MCP Hub 核心框架已完成（Registry + Aggregator + Health + Audit + Rate Limit）
- ✅ MCP Marketplace 已完成（16 API 端点 + 前端页面 + 排名/审核/质量检查）
- ✅ 7 个业务系统 stub server 已启用并注册到市场（bi, crm, erp, feishu, finance, hrm, legal）
- ✅ Agent tool loop 支持 MCP 工具自动发现和注册
- ✅ 浏览器自动化已完成 (@synapse/browser + 6 browser tools)
- ✅ Web UI 全部功能页面就绪（含 /mcp-marketplace）
- ⚠️ 需要企业系统 API 文档和测试账号（stub → 真实 API）

---

## 十一、PLAN.md 未落地功能清单

> 对比 PLAN.md 全部设计内容 vs 当前代码实现，按优先级分类。
> 最后审计: 2026-03-04

### P0 — 系统完整性关键缺失（影响生产可用性）

| # | 功能 | PLAN.md 位置 | 所属层 | 说明 | 建议 Phase |
|---|------|-------------|--------|------|-----------|
| 1 | Auth 中间件 (JWT/Session) | §服务网关层 | ③ | 前后端均无鉴权，API 完全开放 | Phase 11 |
| 2 | WebSocket 实时推送 | §服务网关层 | ③ | 通知/洞察仅 API 轮询，无实时推送 | Phase 11 |
| 3 | 通知推送渠道 | §主动智能 §7.4 | ⑥ | NotificationStore 仅存储，缺 Slack/邮件/企微推送 | Phase 11 |
| 4 | MCP Auth Gateway | §MCP Hub §4.5 | ⑧ | 凭证明文传递，缺 AES-256-GCM 加密 + OAuth Token 刷新 | Phase 8 |
| 5 | 审计/审批持久化 | §合规引擎 §6.3 | ⑤ | 内存存储 (max 1000/2000)，重启丢失 | Phase 11 |

### P1 — 核心能力缺失（影响功能深度）

| # | 功能 | PLAN.md 位置 | 所属层 | 说明 | 建议 Phase |
|---|------|-------------|--------|------|-----------|
| 6 | Planner (任务分解) | §Agent 引擎 §2.2 | ④ | 复杂任务缺多步骤分解能力 | Phase 12 |
| 7 | 多 Agent 协调器 | §Agent 引擎 §2.5 | ④ | 跨部门协作缺调度器 | Phase 12 |
| 8 | 向量嵌入 + 语义搜索 | §知识库 §11.2 | ⑦ | 知识库仅关键词搜索，缺 embedding | Phase 12 |
| 9 | 决策顾问 (Decision Advisor) | §决策智能 §8.6 | ⑥.5 | 缺 Agent 驱动的决策建议生成 | Phase 12 |
| 10 | MCP Server 实际 API 逻辑 | §企业系统 §9 | ⑨ | 7 个 stub server 仅返回模拟数据 | Phase 8 |
| 11 | Database Server: MySQL/PG | §MCP Servers §9.1 | ⑨ | 仅 SQLite，缺 MySQL/PostgreSQL 驱动 | Phase 8 |
| 12 | 补偿器 (Compensator) | §合规引擎 §6.4 | ⑤ | 违规操作缺自动回滚/补偿 | Phase 12 |

### P2 — 功能增强（影响用户体验和完整度）

| # | 功能 | PLAN.md 位置 | 所属层 | 说明 | 建议 Phase |
|---|------|-------------|--------|------|-----------|
| 13 | 决策仪表盘可视化 | §决策智能 §8.7 | ⑥.5 | 前端仅列表展示，缺图表/仪表盘 | Phase 13 |
| 14 | digest.ts (每日摘要) | §主动智能 §7.3 | ⑥ | PLAN 中设计的自动日报生成器 | Phase 13 |
| 15 | Skill Creator Wizard | §Skill 系统 §3.4 | ⑦ | 前端仅表单创建，缺引导式向导 | Phase 13 |
| 16 | Skill 版本管理 | §Skill 系统 §3.3 | ⑦ | 缺 Skill 版本号管理和升级机制 | Phase 13 |
| 17 | Persona 编辑器 UI | §角色画像 §5.2 | ① | 前端仅只读展示，缺在线编辑角色配置 | Phase 13 |
| 18 | SSE 传输 (MCP) | §MCP Hub §4.2 | ⑧ | MCP Client 仅 stdio，缺 SSE 远程传输 | Phase 8 |
| 19 | MCP Resources/Prompts | §MCP Hub §4.3 | ⑧ | Server 未暴露 Resources 和 Prompts 能力 | Phase 8 |
| 20 | PDF/Excel 报告 | §决策智能 §8.5 | ⑥.5 | 报告仅 Markdown，缺导出格式 | Phase 13 |
| 21 | 记忆自动整合 | §组织记忆 §9.3 | ⑦ | 缺过期清理和自动摘要整合 | Phase 13 |
| 22 | Agent 自动提取记忆 | §个人记忆 §10.2 | ⑦ | 缺对话自动提取偏好/事实 | Phase 13 |

### Phase 10.5 新增需求（用户反馈 2026-03-08）

| # | 功能 | 来源 | 说明 | 建议 Phase |
|---|------|------|------|-----------|
| 34 | 远程 SSE Server UX 优化 | 周小帅反馈 | 接入指南补充远程配置示例；Server Browser 增加远程/本地标签 | Phase 10.5 Step 1 |
| 35 | Swagger/OpenAPI → MCP 一键导入 | 朱广聪反馈 | 解析 OpenAPI 3.x / Swagger 2.0 → 生成 config + adapter stub → 发布市场 | Phase 10.5 Step 2 |
| 36 | MCP 原语扩展（resource/root/prompt） | 周小帅反馈 | Hub 扩展三种原语；前端展示 | Phase 10.5 Step 3 |
| 37 | MCP 客户端双模式（无状态/有状态） | 周小帅反馈 | one-call + 长连接 session 可配置 | Phase 10.5 Step 4 |
| 38 | MCP OAuth 认证 | 胖胖神反馈 | per-server OAuth2 授权跳转 + Token 管理 + Agent 携带用户身份 | Phase 11.5 |

### P3 — 扩展功能（不影响核心，按需推进）

| # | 功能 | PLAN.md 位置 | 所属层 | 说明 | 建议 Phase |
|---|------|-------------|--------|------|-----------|
| 23 | Ollama Provider | §Model Router §1.3 | ④ | 缺本地模型支持 | Phase 14+ |
| 24 | Git MCP Server | §MCP Servers §9.2 | ⑨ | git clone/pr/commit 等 | Phase 8 |
| 25 | Email MCP Server | §MCP Servers §9.2 | ⑨ | 邮件收发搜索 | Phase 8 |
| 26 | 企业微信 MCP Server | §MCP Servers §9.3 | ⑨ | 消息/通讯录/审批 | Phase 8 |
| 27 | DMS 文档管理 Server | §MCP Servers §9.3 | ⑨ | 文档上传/搜索/权限 | Phase 8 |
| 28 | 远程 Registry 联动 | §Skill Marketplace §3.5 | ⑦ | 本地文件模拟，缺远程 JSON Registry 同步 | Phase 14+ |
| 29 | 上报机制 | §合规引擎 §6.5 | ⑤ | 违规事件上报到外部合规系统 | Phase 14+ |
| 30 | Skill 依赖管理 | §Skill 系统 §3.6 | ⑦ | 技能间依赖声明和解析 | Phase 14+ |
| 31 | BaseMCPServer 基类 | §MCP Hub §4.6 | ⑧ | 通用基类 + DomainAdapter 抽象 | Phase 8 |
| 32 | Onboarding 推送 | §主动智能 §7.5 | ⑥ | 新用户引导任务自动触发 | Phase 14+ |
| 33 | 浏览器查看器 UI | §浏览器自动化 §12.2 | ⑦ | 前端实时查看浏览器截图/操作 | Phase 14+ |

### 统计汇总

| 优先级 | 数量 | 说明 |
|--------|------|------|
| **P0** | 5 | 生产可用性关键缺失 |
| **P1** | 7 | 核心能力深度不足 |
| **P2** | 10 | 用户体验和功能完整度 |
| **P3** | 11 | 扩展功能，按需推进 |
| **总计** | **33** | — |

### 建议实施路线

```
Phase 10.5 (新增) → 远程 SSE UX + Swagger 导入 + resource/root/prompt 原语 + 客户端双模式 (用户反馈)
Phase 8  (已规划) → MCP Auth + MCP Servers 填充 + SSE/Resources + MySQL/PG + Git/Email/企微/DMS Server + BaseMCPServer
Phase 11 (新增)   → Auth 鉴权 + WebSocket 推送 + 通知渠道 + 审计持久化 (P0 全清)
Phase 11.5 (新增) → MCP OAuth 认证 + per-user Token 管理 + Agent 身份携带 (用户反馈)
Phase 12 (新增)   → Planner + 多 Agent + 向量搜索 + 决策顾问 + 补偿器 (P1 全清)
Phase 13 (新增)   → 可视化仪表盘 + 日报 + Skill 增强 + Persona 编辑器 + 报告导出 + 记忆增强 (P2 全清)
Phase 14+(长期)   → Ollama + 远程 Registry + 上报机制 + Skill 依赖 + Onboarding + 浏览器查看器 (P3 按需)
```

### 完成度总览

| 维度 | 已实现 | 总规划 | 完成率 |
|------|--------|--------|--------|
| 九层架构 | 9/9 基础实现 | 9 层 | 100% 覆盖，75% 深度 |
| Package | 15 个（含 mcp-marketplace） | 15 个 | 100% |
| API 端点 | 105 个（+16 mcp-marketplace） | ~110+ | ~95% |
| MCP Servers | 10 个 (2 完整 + 8 stub + 1 feishu 真实) | 15+ | ~40% |
| 内置工具 | 16 个 | 16 个 | 100% |
| 前端页面 | 11 个（含 /mcp-marketplace） | 11 个 | 100% |
| 配置文件 | 10 MCP + 7 persona + 4 compliance + 11 proactive + 2 decision + 10 skills = 44 | ~50 | ~88% |
| **PLAN.md 功能点** | **~130/153** | **~153** | **~85%** |

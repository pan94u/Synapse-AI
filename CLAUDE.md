# Synapse AI — 项目级开发规范

> 基于 Forge 交付方法论 v2.0（32 Session 实战验证）+ Synapse AI 平台特性定制
> 日期: 2026-03-01 | 适用范围: ~/super-agent/ 全部代码

---

## 一、项目概述

Synapse AI 是面向投资管控型集团企业的 AI 原生智能 Agent 平台。

- **技术栈**: Bun + Hono (后端) + Next.js + React + TailwindCSS + shadcn/ui (前端) + Turborepo (Monorepo)
- **AI 引擎**: MiniMax 2.5 + Claude API（均使用 OpenAI 兼容格式，统一 `openai` npm 包）
- **运行时**: Bun（原生 TypeScript，兼做包管理器）
- **语言**: TypeScript（全栈）

---

## 二、交付方法论

### 2.1 核心理念

> **用文档对抗 AI 遗忘，用验收测试对抗质量腐化，用双基线对抗设计偏移，用知识沉淀对抗经验流失。**

AI 协同交付的核心约束是 **"上下文的连续性"** 和 **"质量的可控性"**。高产出 + 无纪律 = 加速混乱。

### 2.2 三层迭代结构

```
Phase（里程碑）
├─ 粒度：1 个可验收的功能集
├─ 周期：1-6 个 Session（弹性）
├─ 产出：可运行的系统 + 验收测试 + 基线更新
└─ 闭环：验收 → 基线交叉校验 → 经验编码

Session（最小工作单元）
├─ 粒度：1 次 Claude Code 对话（~2-3 小时）
├─ 周期：固定 PDCA 微循环
├─ 产出：代码 + 测试 + logbook 条目 + Git commit
└─ 闭环：文件变更表 → 经验沉淀 → 统计快照

Turn（执行回合）
├─ 粒度：1 次 Agentic Loop 迭代
├─ 周期：秒级
└─ 闭环：OODA → 底线检查 → 失败自修复
```

### 2.3 Session PDCA 循环（不允许跳步）

```
Plan  → 声明本 Session 目标（1 句话）
Do    → 实施（编码 + 测试 + Bug 修复）
Check → 文件变更表 + 统计快照 + 运行验证
Act   → 经验沉淀 + Git commit + logbook 更新
```

**为什么不能跳步**：没有结构化记录，下次 Session 会重复踩坑。PDCA 纪律建立后，同类问题零复发。

---

## 三、质量保障体系

### 3.1 四道防线

```
第 1 道：本地快速验证（30 秒反馈）
  └─ bun test + tsc --noEmit + turbo build

第 2 道：底线自动检查（Turn 级）
  └─ 代码风格 + 安全扫描，失败自动修复（最多 2 轮）

第 3 道：验收测试（Phase 级）
  └─ 结构化测试用例，自动化 + 手动，通过率 ≥ 90%

第 4 道：双基线交叉校验（Phase 级）
  └─ 设计基线 vs 规划基线 vs 代码实现，三角校验
```

### 3.2 验收测试驱动（ATDD）

- **场景先行**：编码前写场景标题 + 关键预期
- **交叉验证**：TC 的操作和预期必须与代码实现逐条比对
- **数据校准**：实际运行后回填真实数据

### 3.3 Bug 全局排查纪律

发现一个 Bug 属于系统性问题时，**立即**全局排查同类问题并一次性修复：

```bash
# 示例：发现某类型序列化问题
grep -r "该模式" --include="*.ts" packages/
# → 找到所有匹配 → 一次性全部修复 → 零复发
```

**原则**：越早做系统性测试，越早发现聚集性 Bug。

---

## 四、开发纪律

### 4.1 本地验证优先

代码修改后先跑本地测试（`bun test` + `tsc --noEmit`），确认无误后再做集成验证。
**反模式**：每改一行都 Docker 重建 3-5 分钟。

### 4.2 Git 粒度提交

每个逻辑变更一个 commit。
**反模式**：一个 commit 包含 20+ 文件（难以 bisect 和回滚）。

### 4.3 多入口测试

同一功能如果有多个入口（REST API + WebSocket + CLI），每个入口都要测。
**反模式**：只测 REST API，WebSocket 入口有 Bug 不知道。

### 4.4 文档债务控制

| 规则 | 频率 |
|------|------|
| logbook 每 Session 更新 | 每次 |
| 基线交叉校验 | 每 Phase 结束 |
| 文档全量审查 | 每 5 个 Session |
| 统计数据校准 | 每 Phase 结束 |

---

## 五、知识管理

### 5.1 经验编码管道

```
发现经验
    ↓
logbook 记录（即时）
    ↓
验证（跨 2+ Session 确认有效）
    ↓
编码到 CLAUDE.md（已知陷阱 / 纪律 / 方法论）
    ↓
进一步固化为 Skill / Baseline（平台能力）
```

### 5.2 知识飞轮

```
交付 → 记录(logbook) → 验证(跨Session确认) → 编码(CLAUDE.md/Skill) → 更好的交付
  ↑                                                                      │
  └──────────────────────────────────────────────────────────────────────┘
```

### 5.3 CLAUDE.md 增长标准

- 每 Session 增长 ~2-10 行
- 0 行 = 没在沉淀知识
- \>10 行 = 写太碎，需要合并

---

## 六、人 + AI 协作模式

### 6.1 角色分工

| 维度 | 人类（决策者） | AI（执行者） |
|------|-------------|------------|
| 战略方向 | 定义 Phase 目标和优先级 | 评估可行性、提供方案 |
| 架构决策 | 最终拍板 | 分析利弊、推荐方案 |
| 代码实现 | 审查、验收 | 生成、修复、重构 |
| 质量守护 | 定义验收标准 | 执行测试、运行底线、修复 Bug |
| 知识沉淀 | 确认经验有效性 | 记录 logbook、更新基线、编码到 CLAUDE.md |
| 异常处理 | 判断是否放弃/换方向 | 最多 3 轮自修复后上报 |

### 6.2 协作模式

**模式 1：声明式意图 + 自主执行**（功能明确时）
```
人类: "实现 Model Router"
AI:   自主完成 → 类型定义 → Provider → Router → 测试 → 验收
```

**模式 2：探索式对话 + 渐进实现**（需求不明确时）
```
人类: "需要重新考虑权限方案"
AI:   分析现状 → 提出方案 → 人类确认 → 逐步实现
```

**模式 3：并行 Agent 加速**（5+ 文件的独立功能集）
```
限制每次 2-3 个 Agent 并明确权限，成功率可达 100%
```

### 6.3 反模式（必须避免）

| 反模式 | 表现 | 纠正方式 |
|--------|------|---------|
| 过度自动化 | AI 做了所有事但人不理解 | 执行透明度 + 关键审批点 |
| Docker 循环 | 改一行→重建 3 分钟 | 本地验证优先 |
| 后补验收 | 先写代码后补测试 | 场景先行，编码前写预期 |
| 单入口测试 | 只测一个入口 | 同一功能多路径测试 |
| 大杂烩提交 | 一个 commit 包含太多文件 | 每个逻辑变更一个 commit |

---

## 七、已知陷阱

> 此区域记录已验证的陷阱和解决方案。随项目推进持续更新。

### 7.1 技术栈相关

- **Bun + Next.js**: Next.js 构建可能需要 Node.js，确保 `node@22` 已安装
- **OpenAI SDK**: MiniMax 和 Claude 都用 `openai` npm 包，但 MiniMax 的 `<think>` 标签需要单独解析
- **Turborepo**: 注意 `turbo.json` 中的 pipeline 依赖关系，`shared` 包必须先构建
- **SSE 流式**: Hono 的 SSE 需要手动管理连接生命周期，注意客户端断开时的清理

### 7.2 API 兼容性

- MiniMax 2.5 的 `base_url` 和 Claude API 的 `base_url` 不同，需在 Model Router 中正确配置
- 两个 Provider 的 `tool_calling` 格式可能有微小差异，统一在 adapter 层处理

---

## 八、项目结构速查

```
~/super-agent/
├── packages/
│   ├── shared/          # ✅ 共享类型 (Chat, Tool, Model, MCP)
│   ├── agent-core/      # ✅ Agent 引擎 (Model Router, Agent, Tools)
│   ├── mcp-hub/         # ✅ MCP 中心 (Hub, Client, Registry, Health, Audit, RateLimit)
│   ├── mcp-servers/     # ✅ MCP Server 适配器 (database, http-api)
│   ├── personas/        # ✅ 角色画像 (loader, registry, context builder)
│   ├── compliance/      # ✅ 合规引擎 (pre-hook, post-hook, masker, evaluator)
│   ├── server/          # ✅ Hono API 服务端 (chat, agent, mcp, personas, compliance 路由)
│   ├── web/             # 📋 Next.js 前端 (Phase 10)
│   └── knowledge/       # 📋 知识库引擎 (Phase 5)
├── config/
│   ├── mcp-servers/     # ✅ MCP Server 配置 (database.json, http-api.json)
│   ├── personas/        # ✅ 7 个角色 YAML (ceo, hr, finance, legal, sales, ops, engineer)
│   └── compliance/rules/# ✅ 4 套合规规则 YAML (general, finance, hr, legal)
├── PLAN.md              # 总体技术方案
├── STRATEGY-5Y.md       # 五年战略规划
├── DISCUSSION-LOG.md    # 讨论演化记录
├── LOGBOOK.md           # 开发日志 (Session 级)
├── DESIGN-BASELINE.md   # 设计基线 (Phase 级)
└── CLAUDE.md            # 本文件 — 项目级开发规范
```

---

## 九、Phase 命名规范

| 规则 | 说明 |
|------|------|
| 格式 `Phase X — 语义标题` | 如 `Phase 1 — 基础框架` |
| 新增中间阶段用小数点 | Phase 1 和 2 之间插入 1.5 |
| **禁止重命名已有编号** | 编号一旦确定永不更改 |

---

## 十、实施阶段（当前进度）

> 以 PLAN.md 阶段定义为准。

| Phase | 目标 | 状态 |
|-------|------|------|
| Phase 1 | 基础框架 (Monorepo + Model Router + 流式 Chat) | ✅ 完成 |
| Phase 2 | 工具系统 (Tool Registry + 内置工具 + Agent tool loop) | ✅ 完成 |
| Phase 3 | MCP Hub + 基础连接器 (database + http-api) | ✅ 完成 |
| Phase 4 | 角色画像 + 合规引擎 (Pre-Hook + Post-Hook) | ✅ 完成 |
| Phase 5 | 组织记忆 + 个人记忆 + 知识库 | 📋 |
| Phase 6 | 主动智能 (定时/事件/阈值) | 📋 |
| Phase 6.5 | 决策智能 (数据→洞察→决策→战略) | 📋 |
| Phase 7 | Skill 系统 + 管理器 | 📋 |
| Phase 7.5 | Skill Marketplace | 📋 |
| Phase 8 | 企业业务系统 MCP Servers | 📋 |
| Phase 9 | 浏览器自动化 | 📋 |
| Phase 10 | Web UI | 📋 |

---

## 十一、交付质量公式

```
交付质量 = f(验收前置 × 底线拦截 × 基线守护 × 全局排查)
```

任何一项缺失都会导致质量下降：
- 缺验收前置 → 后补测试发现大量错误
- 缺底线拦截 → 安全问题直接进 commit
- 缺基线守护 → 增量修改后文档逻辑矛盾
- 缺全局排查 → 同类 Bug 重复出现

---

## 十二、度量指标

| 指标 | 健康范围 | 说明 |
|------|---------|------|
| 验收测试通过率 | ≥ 90% | 低于 90% 说明质量防线有漏洞 |
| Bug 复发率 | 0% | >0% 说明全局排查纪律未执行 |
| CLAUDE.md 增长率 | ~2-10 行/Session | 0 = 没沉淀；>10 = 太碎 |
| 首次构建成功率 | ≥ 80% | <80% 说明 pre-flight 检查缺失 |

---

## 十三、效率公式

```
效率 = AI 产出速度 × 人类决策质量 × 上下文连续性
```

- **AI 产出速度**: 受限于 API rate limit 而非能力
- **人类决策质量**: 通过验收测试和基线把控方向
- **上下文连续性**: 通过 logbook + CLAUDE.md + 记忆系统保持（最脆弱的一环）

---

## 十四、可复制实践引入顺序

```
Day 1:  logbook + 本地验证优先 + 全局排查 + 粒度提交
Week 1: CLAUDE.md 经验编码 + 并行 Agent
Week 2: 场景先行(ATDD) + 多入口测试
Week 3: 双基线交叉校验 + 文档审查制度
```

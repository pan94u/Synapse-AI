# Synapse AI — 企业 AI 原生智能体平台

> **Synapse** /ˈsɪnæps/ — 突触，神经元之间传递信号的连接点。
> 像突触连接神经元一样，Synapse AI 连通组织的每个人、每个系统、每个流程。

## 愿景

**用 AI 原生重新定义组织运作方式。**

Synapse AI 是企业构建 AI 原生组织的基石。它不是一个"效率工具"，而是一种新的组织操作系统：

- **解放人**：让每个员工从重复繁重的事务性工作中解脱，回归创造性工作
- **消灭流程摩擦**：不是"优化流程"，而是让 AI 成为流程本身 — 高合规、零等待、自动流转
- **数据驱动决策**：让数据持续运营，从散落在各系统的数据中提炼洞察，支撑管理者做出有效决策、追踪战略落地
- **聚焦价值创造**：组织的注意力从"怎么走流程"转移到"怎么创造价值"
- **跨时代竞争力**：当其他企业还在用人堆流程时，我们的组织已经用 AI 在思考和行动

### AI 原生组织 vs 传统组织

| | 传统组织 | AI 原生组织 |
|---|---------|------------|
| **信息流转** | 人传人、层层审批、信息衰减 | Agent 实时聚合全局信息，一步到位 |
| **决策方式** | 等报表、凭经验、拍脑袋 | Agent 实时分析数据 + 主动预警 + 辅助决策 |
| **战略推进** | 年初定目标、年底看结果、中间靠感觉 | 战略→指标→数据实时追踪，偏离自动预警，决策全程留痕复盘 |
| **流程执行** | 人工填表 → 等审批 → 人工执行 → 人工检查 | 员工说一句话 → Agent 自动编排执行 → 合规内嵌 |
| **知识管理** | 在老员工脑里、在某个不知道的文档里 | 组织记忆永不丢失，新人即刻获得老兵的知识 |
| **跨部门协作** | 开会、邮件、扯皮、等排期 | Agent 之间自动协作，数据自动流转 |
| **合规检查** | 事后审计、人工核查、漏洞百出 | 每个动作实时合规校验，违规无法执行 |

### 愿景 → 架构的映射

| 愿景目标 | 意味着什么 | 需要的架构能力 |
|----------|-----------|--------------|
| **解放人** | 每个角色有专属 AI 伙伴，懂我的职责和上下文 | 角色画像系统（Role Personas） |
| **消灭流程摩擦** | AI 就是流程本身，不是流程旁边的工具 | 流程引擎 + 合规内嵌 |
| **高合规零等待** | 每个动作执行前后自动校验，违规做不出去 | 合规引擎（Pre-Hook + Post-Run Hook） |
| **数据驱动决策** | 数据持续运营，洞察辅助决策，战略可追踪 | 决策智能引擎（洞察 + 决策支持 + 战略追踪） |
| **聚焦价值创造** | 知识不在人脑里，新人秒变老兵 | 组织记忆（非个人记忆） |
| **跨时代竞争力** | Agent 不等人指挥，主动发现问题和机会 | 主动智能（定时任务 + 事件触发 + 异常预警） |

### 现有方案差距分析

```
已有 ✅                          缺失 ❌
─────────────────────          ─────────────────────
Agent 引擎（对话式）              角色画像（谁在用？什么职责？）
MCP Hub（连系统）                 流程引擎（跨系统业务编排）
Skill 系统（任务模板）             合规引擎（规则前置+后置校验）
个人记忆                          组织记忆（全员共享知识）
被动响应                          主动智能（Agent 主动行动）
单 Agent                         多 Agent 协作
BI 数据查询（有数据）              决策智能（数据→洞察→决策→战略闭环）
```

## Context

基于以上愿景，Synapse AI 采用 Anthropic Skill 规范构建企业级智能 Agent 平台。技术上使用 MiniMax 2.5 + Claude API（OpenAI 兼容格式）作为 AI 引擎，通过 MCP Hub 打通企业全部数字化系统（人财法 CRM ERP），最终让 AI Agent 成为每个员工的智能工作伙伴、每个部门的自动化引擎、整个组织的数字神经系统。

## 整体架构

### 分层架构总览

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                         🏢 AI 原生组织                                      │
│          解放人 ─ 消灭流程 ─ 高合规 ─ 知识不丢 ─ 主动智能                      │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                      ① 用户与角色层                                    │  │
│  │                                                                       │  │
│  │   CEO    HR经理    财务总监    法务    销售    运营    工程师    ...     │  │
│  │    │       │         │        │       │      │       │              │  │
│  │    ▼       ▼         ▼        ▼       ▼      ▼       ▼              │  │
│  │  ┌─────────────────────────────────────────────────────────────┐    │  │
│  │  │              角色画像 Personas                                │    │  │
│  │  │   职责定义 │ 权限矩阵 │ 默认技能 │ 沟通风格 │ 知识范围       │    │  │
│  │  └─────────────────────────────────────────────────────────────┘    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│       │                                                                     │
│       │  角色上下文                                                          │
│       ▼                                                                     │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                      ② 交互体验层                                      │  │
│  │                                                                       │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐  │  │
│  │  │智能对话 │ │决策驾驶 │ │主动推送 │ │审批中心 │ │组织知识 │ │系统管理 │  │  │
│  │  │Chat UI │ │舱/战略  │ │通知/日报│ │合规审批 │ │记忆浏览 │ │MCP/技能│  │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘  │  │
│  │                                                                       │  │
│  │                    Web UI (Next.js + shadcn/ui)                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│       │                                                                     │
│       │  API / SSE / WebSocket                                              │
│       ▼                                                                     │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                      ③ 服务网关层                                      │  │
│  │                                                                       │  │
│  │                   Hono API Server                                      │  │
│  │          路由 │ 鉴权 │ 角色上下文注入 │ SSE │ WebSocket                │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│       │                                                                     │
│       ▼                                                                     │
│  ╔═══════════════════════════════════════════════════════════════════════╗  │
│  ║                      ④ 智能中枢层（大脑）                              ║  │
│  ║                                                                       ║  │
│  ║  ┌─────────────────────────────────────────────────────────────────┐  ║  │
│  ║  │                    Agent 引擎                                    │  ║  │
│  ║  │                                                                 │  ║  │
│  ║  │    Planner ──→ Executor ──→ Tool Loop                          │  ║  │
│  ║  │    任务规划      逐步执行      工具调用循环                        │  ║  │
│  ║  │                                                                 │  ║  │
│  ║  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │  ║  │
│  ║  │  │ Model Router │  │ 多 Agent     │  │ 上下文管理            │  │  ║  │
│  ║  │  │ MiniMax 2.5  │  │ 协调器       │  │ 角色+记忆+知识        │  │  ║  │
│  ║  │  │ Claude API   │  │ (跨部门协作)  │  │ → System Prompt      │  │  ║  │
│  ║  │  └──────────────┘  └──────────────┘  └──────────────────────┘  │  ║  │
│  ║  └─────────────────────────────────────────────────────────────────┘  ║  │
│  ║       │                                                               ║  │
│  ║       │ tool_calls                                                    ║  │
│  ║       ▼                                                               ║  │
│  ║  ┌──────────────────────────────┐  ┌──────────────────────────────┐  ║  │
│  ║  │ ⑤ 合规引擎（双阶段守门人）   │  │ ⑥ 主动智能引擎               │  ║  │
│  ║  │                              │  │                              │  ║  │
│  ║  │  Pre-Hook (执行前)           │  │ ┌────────┐ ┌──────┐ ┌────┐ │  ║  │
│  ║  │  ├ 权限/规则/审批/参数修正   │  │ │定时任务 │ │事件   │ │阈值│ │  ║  │
│  ║  │  └ → allow/deny/approval    │  │ │Cron    │ │触发器 │ │监控│ │  ║  │
│  ║  │           ↓ 执行 ↓           │  │ └───┬────┘ └──┬───┘ └─┬──┘ │  ║  │
│  ║  │  Post-Run Hook (执行后)      │  │     │        │       │    │  ║  │
│  ║  │  ├ 脱敏/异常检测/通知/回滚   │  │     ▼        ▼       ▼    │  ║  │
│  ║  │  └ → pass/mask/flag/revoke  │  │   主动触发 Agent 执行任务   │  ║  │
│  ║  │                              │  │   (结果推送给目标角色)      │  ║  │
│  ║  │  全链路审计轨迹               │  │                              │  ║  │
│  ║  └──────────────────────────────┘  └──────────────────────────────┘  ║  │
│  ║  ┌─────────────────────────────────────────────────────────────────┐  ║  │
│  ║  │ ⑥.5 决策智能引擎（数据→洞察→决策→战略）                         │  ║  │
│  ║  │                                                                 │  ║  │
│  ║  │  数据采集 ──→ 指标计算 ──→ 洞察发现 ──→ 决策建议 ──→ 战略追踪   │  ║  │
│  ║  │  (MCP定期)    (KPI树)    (趋势/异常   (选项/风险    (OKR进度    │  ║  │
│  ║  │                           归因/预测)   历史类比)    穿透对齐)    │  ║  │
│  ║  │                                  │                              │  ║  │
│  ║  │                           决策日志 → 复盘 → 组织记忆              │  ║  │
│  ║  └─────────────────────────────────────────────────────────────────┘  ║  │
│  ╚═══════════════════════════════════════════════════════════════════════╝  │
│       │                                                                     │
│       │ 合规通过的 tool_calls                                                │
│       ▼                                                                     │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                      ⑦ 能力层                                          │  │
│  │                                                                       │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────────────┐ │  │
│  │  │ 技能系统     │  │ 内置工具      │  │ 记忆与知识                    │ │  │
│  │  │ Skills       │  │ Built-in     │  │                              │ │  │
│  │  │              │  │ Tools        │  │  ┌──────────┐ ┌──────────┐  │ │  │
│  │  │ ┌──────────┐ │  │              │  │  │ 组织记忆  │ │ 个人记忆  │  │ │  │
│  │  │ │ built-in │ │  │ file_read    │  │  │ 制度规章  │ │ 对话上下文│  │ │  │
│  │  │ │ installed│ │  │ file_write   │  │  │ 决策记录  │ │ 用户偏好  │  │ │  │
│  │  │ │ custom   │ │  │ shell_exec   │  │  │ 经验教训  │ │ 任务历史  │  │ │  │
│  │  │ └──────────┘ │  │ web_fetch    │  │  │ 最佳实践  │ │           │  │ │  │
│  │  │       ↕      │  │ browser_*    │  │  └──────────┘ └──────────┘  │ │  │
│  │  │ ┌──────────┐ │  │ memory_*     │  │        ↕                    │ │  │
│  │  │ │Skill     │ │  │ knowledge_*  │  │  ┌──────────┐              │ │  │
│  │  │ │Market-   │ │  │              │  │  │ 个人     │              │ │  │
│  │  │ │place     │ │  │              │  │  │ 知识库    │              │ │  │
│  │  │ └──────────┘ │  │              │  │  └──────────┘              │ │  │
│  │  └─────────────┘  └──────────────┘  └──────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│       │                                                                     │
│       │ mcp_* tool_calls                                                    │
│       ▼                                                                     │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                      ⑧ 企业集成层                                      │  │
│  │                                                                       │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │                       MCP Hub                                    │  │  │
│  │  │   Registry │ Aggregator │ Router │ Auth │ Health │ Rate Limit   │  │  │
│  │  └──────┬─────────┬──────────┬──────────┬──────────┬──────────────┘  │  │
│  │         │         │          │          │          │                  │  │
│  │         ▼         ▼          ▼          ▼          ▼                  │  │
│  │  ┌──────────────────────────────────────────────────────────────────┐ │  │
│  │  │                    MCP Servers (适配器)                           │ │  │
│  │  │                                                                  │ │  │
│  │  │  基础设施        协作通讯         业务系统           数据文档      │ │  │
│  │  │  ┌────────┐    ┌────────┐     ┌────────────┐    ┌──────────┐   │ │  │
│  │  │  │database│    │ feishu │     │  hrm  (人)  │    │   bi     │   │ │  │
│  │  │  │http-api│    │ wxwork │     │finance(财)  │    │  dms     │   │ │  │
│  │  │  │  git   │    │ email  │     │ legal (法)  │    │          │   │ │  │
│  │  │  └────────┘    └────────┘     │  crm       │    └──────────┘   │ │  │
│  │  │                               │  erp       │                    │ │  │
│  │  │                               └────────────┘                    │ │  │
│  │  └──────────────────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│       │                                                                     │
│       │ Adapter Pattern (每个 Server 内部适配不同厂商)                        │
│       ▼                                                                     │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                      ⑨ 企业数字化系统                                   │  │
│  │                                                                       │  │
│  │   用友/北森    金蝶/用友    法大大    纷享销客    SAP     飞书/企微     │  │
│  │   (HRM)      (Finance)   (Legal)   (CRM)     (ERP)   (通讯)         │  │
│  │                                                                       │  │
│  │                    MySQL │ PostgreSQL │ REST API                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 架构层说明

| 层 | 名称 | 职责 | 对应愿景 |
|---|------|------|---------|
| ① | **用户与角色层** | 定义"谁在用" — 每个角色有专属 AI 画像 | 解放人 |
| ② | **交互体验层** | 角色专属 UI + 决策驾驶舱 + 主动推送 + 审批交互 | 聚焦价值 |
| ③ | **服务网关层** | API 路由、鉴权、角色上下文注入 | - |
| ④ | **智能中枢层** | Agent 大脑：理解意图 → 规划步骤 → 调用工具 | 核心引擎 |
| ⑤ | **合规引擎** | Pre-Hook 管"能不能做"，Post-Hook 管"做得对不对" | 高合规 |
| ⑥ | **主动智能** | 定时/事件/阈值触发 Agent 自主行动 | 主动智能 |
| ⑥.5 | **决策智能** | 数据持续运营 → 洞察 → 决策辅助 → 战略追踪闭环 | **数据驱动决策** |
| ⑦ | **能力层** | 技能模板 + 内置工具 + 组织记忆 + 个人记忆 | 消灭流程 / 知识不丢 |
| ⑧ | **企业集成层** | MCP Hub 统一连接所有企业系统 | 全局贯通 |
| ⑨ | **企业数字化系统** | 实际的人财法 CRM ERP 等系统 | 现实世界 |

### 核心数据流

#### 流程 A：用户主动对话（被动模式）

```
用户: "查一下张三这个月的考勤和他负责的项目进度"
  │
  ▼
① 角色识别 → HR经理
  │
  ▼
④ Agent 规划:
   Step 1: hrm_query_attendance(employee="张三", month="current")
   Step 2: erp_query_project(owner="张三", status="active")
  │
  ▼
⑤ Pre-Hook 校验:
   ✅ HR经理有权查看考勤 → 放行
   ✅ HR经理有权查看项目进度(只读) → 放行
  │
  ▼
⑧ MCP Hub 路由:
   Step 1 → HRM MCP Server → 用友 API → 返回考勤数据
   Step 2 → ERP MCP Server → 金蝶 API → 返回项目数据
  │
  ▼
⑤ Post-Run Hook:
   🔄 脱敏: 张三身份证号 → 110***1234
   📝 审计: 记录 HR经理 查看了张三的考勤和项目数据
  │
  ▼
④ Agent 汇总分析，生成自然语言回复（已脱敏）
  │
  ▼
② UI 流式展示结果
```

#### 流程 B：Agent 主动行动（主动模式）

```
⑥ 定时触发: 每周一 9:00，目标角色=CEO
  │
  ▼
④ Agent 执行 Skill "高管经营日报":
   fin_query_ledger → 营收数据
   crm_sales_pipeline → 销售数据
   hrm_query_attendance → 人效数据
   erp_query_inventory → 库存数据
  │
  ▼
⑤ 合规校验: 所有操作均为只读 + CEO 有全系统权限 → 全部放行
  │
  ▼
⑧ MCP Hub → 各业务系统 → 数据回传
  │
  ▼
④ Agent 汇总生成经营日报
  │
  ▼
② 通过 WebSocket 主动推送到 CEO 的工作台
   + 调用 feishu_send_msg 发送到高管群
```

#### 流程 C：Pre-Hook 拦截 + 审批 + Post-Hook 通知

```
销售: "帮我给客户报价，折扣打到3折"
  │
  ▼
④ Agent 规划: crm_update_opportunity(discount=0.3)
  │
  ▼
⑤ Pre-Hook:
   规则: "折扣低于5折需销售总监审批"
   判定: ⚠️ 需审批
  │
  ├──→ 暂停执行
  ├──→ 自动发起审批 → feishu_create_approval(approver="销售总监")
  ├──→ 通知用户: "折扣低于5折，已提交销售总监审批"
  │
  │   ... 销售总监在飞书审批通过 ...
  │
  ├──→ 审批回调 → Pre-Hook 放行
  │
  ▼
⑧ MCP Hub → CRM → 更新报价成功
  │
  ▼
⑤ Post-Run Hook:
   📝 审计: 记录报价变更（含审批链）
   🔔 通知: 推送给销售总监 "您审批的报价已生效，客户X 折扣3折"
   ⚠️ 标记: 该商机利润率低于阈值，标记需关注
  │
  ▼
② 通知销售: "审批已通过，报价已更新"
```

#### 流程 E：决策智能闭环（数据→洞察→决策→追踪→复盘）

```
⑥.5 数据采集 (每天 22:00 自动)
  │
  ├── fin_query_ledger → 今日营收 85 万（目标 100 万）
  ├── crm_sales_pipeline → 新签 3 单，丢单 2 单
  ├── erp_query_inventory → 产品X 库存偏低
  └── crm_service_tickets → 华东区退货 12 单（异常）
  │
  ▼
⑥.5 指标计算
  │
  ├── 本月营收: 1850 万 / 目标 2500 万 = 74%（进度偏慢）
  ├── 退货率: 8%（基线 3%，偏差 2.6 倍 → 异常）
  └── 现金流: 正常
  │
  ▼
⑥.5 洞察引擎
  │
  ├── 异常: "华东区退货率 8%，是历史均值的 2.6 倍"
  ├── 归因: "72% 退货集中在产品X，关联质量投诉 +300%"
  ├── 预测: "按当前趋势，本月营收将差目标 18%"
  └── 战略影响: "Q1 KR1（营收达标 25%）状态变为 at_risk"
  │
  ▼
⑥ 主动智能触发 → 推送给 CEO 和销售VP:
  "⚠️ 华东区退货率异常飙升，产品X是主因，已影响本月营收目标"
  │
  ▼
CEO: "分析一下怎么处理"
  │
  ▼
④ Agent 调用决策支持:
  → 生成 3 个方案 + 风险评估 + 历史类比 + 战略对齐检查
  │
  ▼
CEO 选择方案C → 决策日志记录
  │
  ▼
⑥ 主动追踪: 2 周后自动检查退货率 → 降至 4% → 决策标记"有效"
  │
  ▼
⑨ 决策复盘 → 经验沉淀到组织记忆:
  "产品质量问题处理方案: 问题批次暂停 + 其余加强品控，2周见效"
```

#### 流程 D：组织记忆闭环

```
某员工对话中: "上次 ERP 迁移踩了个大坑，xxx 接口不兼容..."
  │
  ▼
④ Agent 识别: 这是有组织价值的经验
  │
  ▼
② 提示: "这个经验很有价值，建议保存到组织记忆？"
  │
  ▼
用户确认 → 写入 ⑦ org-memory/lessons/
  │
  ▼
  ... 半年后，新员工入职 ...
  │
① 角色画像加载 → 工程师 → 可访问 lessons/engineering/*
  │
  ▼
④ Agent 入职引导: "有几条前任同事沉淀的经验你可能需要了解..."
```

### 模块关系矩阵

展示各模块之间的依赖和协作关系（→ 表示"调用/依赖"）：

```
              角色    合规    主动    决策    Agent   MCP    Skill   组织    个人
             画像    引擎    智能    智能    引擎    Hub    系统    记忆    记忆
            ─────   ─────  ─────  ─────   ─────  ─────  ─────   ─────  ─────
角色画像      ─      提供    提供    控制    注入     过滤    过滤    控制    ─
                    规则集  任务    可见    上下文   权限    可见性  访问
                                  指标

合规引擎     读取     ─      受管    数据    Pre拦    Pre拦   ─     引用    ─
(Pre+Post)  角色            控     采集    截tool   截MCP         制度
            权限                   受合规  Post校   Post校        异常→
                                         验结果   验结果        经验

主动智能     读取    受合     ─     洞察    触发     监听    执行    ─      ─
            目标    规管          驱动    执行     数据    Skill
            角色    控            预警             变化

决策智能     按角色  数据     异常    ─     被调     数据    被调    决策→   ─
            呈现   采集     触发          用生     采集    用生    经验
            指标   受合规   预警          成建议   来源    成报告  类比←

Agent引擎   加载    经过    被触    调用     ─      调用    加载    检索    读写
            画像    校验    发     洞察            MCP     指令    知识    记忆
                                 和建议           工具

MCP Hub      ─     被拦    被监    被定     被调     ─      ─      ─      ─
                   截      听     期采集   用

Skill系统   按角色  声明    被触    可调     被加    声明     ─     引用    ─
            过滤   合规    发执    用指标   载执    MCP           最佳
                   要求    行     和洞察   行     依赖          实践

组织记忆    按角色  提供     ─     决策     被检     ─     被引     ─      ─
            控制   制度          复盘→    索            用
            访问   依据          经验←

个人记忆     ─      ─      ─      ─      被读      ─      ─      ─      ─
                                        写
```

### 一句话总结架构

> **角色**决定了你是谁，**Agent** 理解你要什么，**合规 Pre-Hook** 确保能不能做，**MCP** 连通去哪做，**Skill** 定义怎么做，**合规 Post-Hook** 确保做得对不对，**决策智能**把数据变成洞察、把洞察变成决策、把决策变成可追踪的战略，**主动智能**让 Agent 不等你说就做，**组织记忆**保证做过的事和做过的决策永远不会忘。

## 技术栈

| 组件 | 选型 | 理由 |
|------|------|------|
| 运行时 | Bun | 原生 TS 支持，速度快，兼做包管理器 |
| 前端 | Next.js + React + TailwindCSS + shadcn/ui | 成熟生态，可同时作为 Web 和桌面前端 |
| 后端 | Hono (TypeScript) | 轻量高性能，TypeScript 优先 |
| AI SDK | openai npm 包 | MiniMax 和 Claude 都兼容 OpenAI 格式 |
| 浏览器自动化 | Playwright | 多浏览器支持，稳定性好 |
| 构建工具 | Turborepo | Monorepo 管理 |
| 桌面 | 先做 Web 版，后续可包装 Electron/Tauri |

## 环境安装（前置）

```bash
brew install oven-sh/bun/bun    # Bun 运行时 + 包管理
brew install node@22             # Next.js 构建需要
```

## 项目结构

```
~/super-agent/
├── package.json                 # Monorepo 根配置
├── turbo.json                   # Turborepo 管道
├── tsconfig.base.json           # 共享 TS 配置
├── .env.local                   # API 密钥（gitignored）
│
├── packages/
│   ├── shared/                  # 共享类型和常量
│   │   └── src/types/           # ChatMessage, AgentTask, Skill, Memory, Marketplace, MCP 等类型
│   │
│   ├── agent-core/              # 核心 Agent 引擎
│   │   └── src/
│   │       ├── models/          # Model Router + Provider (MiniMax/Claude/Ollama)
│   │       ├── agent/           # Agent 主类、Planner、Executor、多 Agent 协调器
│   │       ├── tools/           # 工具注册表 + 内置工具
│   │       │   └── built-in/    # filesystem, shell, web-fetch, browser, memory, knowledge
│   │       ├── skills/          # SKILL.md 解析器、加载器、注册表、管理器
│   │       └── memory/          # 长短期记忆管理器
│   │
│   ├── personas/                # 角色画像系统（谁在用 Agent）
│   │   └── src/
│   │       ├── persona.ts       # 角色定义：职责、权限、默认技能、常用系统、沟通风格
│   │       ├── registry.ts      # 角色注册表：内置角色 + 自定义角色
│   │       ├── context.ts       # 角色上下文构建器：将角色信息注入 Agent system prompt
│   │       ├── permissions.ts   # 角色权限矩阵：哪些角色能用哪些工具/MCP/技能
│   │       └── types.ts
│   │
│   ├── compliance/              # 合规引擎（Pre-Hook + Post-Run Hook 双阶段）
│   │   └── src/
│   │       ├── engine.ts        # 合规引擎主类：注册 hook、协调执行
│   │       ├── pre-hook.ts      # Pre-Hook：执行前校验（权限/规则/审批/参数修正）
│   │       ├── post-hook.ts     # Post-Run Hook：执行后校验（脱敏/异常检测/通知/回滚）
│   │       ├── rules.ts         # 规则定义 + DSL 解析（支持 phase: pre | post）
│   │       ├── evaluator.ts     # 规则评估器：解析条件表达式，判定结果
│   │       ├── masker.ts        # 数据脱敏器：身份证/银行卡/手机号/薪酬等字段遮掩
│   │       ├── approval.ts      # 审批流：Pre 阶段发起审批，审批通过后恢复执行
│   │       ├── compensator.ts   # 补偿器：Post 阶段发现异常时触发回滚/冲销
│   │       ├── audit-trail.ts   # 审计轨迹：Pre 判定 + 执行过程 + Post 处理全链路记录
│   │       └── types.ts
│   │
│   ├── proactive/               # 主动智能引擎（Agent 主动行动）
│   │   └── src/
│   │       ├── scheduler.ts     # 定时任务调度器（cron 表达式）
│   │       ├── triggers.ts      # 事件触发器：监听 MCP 数据变化，满足条件自动执行
│   │       ├── monitors.ts      # 阈值监控器：指标超限自动预警
│   │       ├── digest.ts        # 智能摘要：每日/每周自动生成工作摘要
│   │       └── types.ts
│   │
│   ├── decision-engine/          # 决策智能引擎（数据→洞察→决策→战略）
│   │   └── src/
│   │       ├── engine.ts        # 决策引擎主类：协调数据采集→洞察→建议→追踪
│   │       ├── collector.ts     # 数据采集器：定期从各 MCP 系统拉取经营数据
│   │       ├── metrics.ts       # 指标体系：KPI/OKR 定义、计算、基线、同环比
│   │       ├── insight.ts       # 洞察引擎：趋势分析、异常检测、归因分析、关联发现
│   │       ├── advisor.ts       # 决策顾问：基于数据+知识生成决策建议和风险评估
│   │       ├── strategy.ts      # 战略追踪：战略目标→关键结果→指标→数据的穿透链路
│   │       ├── journal.ts       # 决策日志：记录每个决策的背景、选项、结果、复盘
│   │       ├── report.ts        # 智能报告：自动生成经营分析、专题报告、决策简报
│   │       └── types.ts
│   │
│   ├── org-memory/              # 组织记忆（全员共享知识）
│   │   └── src/
│   │       ├── org-knowledge.ts # 组织知识库：制度、流程、最佳实践、FAQ
│   │       ├── decisions.ts     # 决策记录：为什么这样决策，上下文是什么
│   │       ├── lessons.ts       # 经验教训：踩过的坑、成功的模式
│   │       ├── policies.ts      # 制度规章：与合规引擎联动
│   │       ├── onboarding.ts    # 新人上手：角色相关知识自动推送
│   │       └── types.ts
│   │
│   ├── mcp-hub/                 # MCP 中心（企业系统集成网关）
│   │   └── src/
│   │       ├── hub.ts           # MCP Hub 主类：启动、停止、全局协调
│   │       ├── client.ts        # MCP Client：与单个 MCP Server 通信 (JSON-RPC over stdio/SSE)
│   │       ├── registry.ts      # Server 注册表：发现、注册、注销 MCP Servers
│   │       ├── lifecycle.ts     # 生命周期管理：启动、停止、重启、健康检查
│   │       ├── auth.ts          # 鉴权网关：统一管理企业系统凭证 (OAuth/API Key/Token)
│   │       ├── aggregator.ts    # 工具聚合器：合并所有 MCP Server 的 tools → Agent 工具注册表
│   │       ├── router.ts        # 请求路由：将 tool call 路由到正确的 MCP Server
│   │       ├── health.ts        # 健康监控：心跳检测、自动重连、降级策略
│   │       ├── audit.ts         # 审计日志：记录所有 MCP 调用（企业合规）
│   │       ├── rate-limiter.ts  # 限流器：保护企业系统 API 不被过度调用
│   │       ├── config.ts        # 配置加载：读取 mcp-servers/ 配置文件
│   │       └── types.ts         # MCP 相关类型定义
│   │
│   ├── mcp-servers/             # MCP Server 适配器（可独立进程运行）
│   │   └── src/
│   │       ├── base/            # MCP Server 基类 + 工具函数 + 开发 SDK
│   │       │
│   │       │  # ── 基础设施层（通用连接器）──
│   │       ├── database/        # 数据库 MCP Server (MySQL/PostgreSQL/SQLite)
│   │       ├── http-api/        # 通用 HTTP API MCP Server (REST/GraphQL 代理)
│   │       ├── git/             # Git MCP Server (仓库操作/PR/Issue)
│   │       │
│   │       │  # ── 协作通讯层 ──
│   │       ├── feishu/          # 飞书 MCP Server (消息/文档/审批/日历)
│   │       ├── wechat-work/     # 企业微信 MCP Server (消息/应用/通讯录)
│   │       ├── email/           # 邮件 MCP Server (IMAP/SMTP, Exchange)
│   │       │
│   │       │  # ── 业务系统层（人财法 + CRM + ERP）──
│   │       ├── hrm/             # 人事 MCP Server (组织/员工/考勤/薪酬/招聘)
│   │       ├── finance/         # 财务 MCP Server (总账/应收应付/报销/预算/发票)
│   │       ├── legal/           # 法务 MCP Server (合同/签章/合规/案件/知识产权)
│   │       ├── crm/             # CRM MCP Server (客户/商机/线索/销售漏斗/售后)
│   │       ├── erp/             # ERP MCP Server (采购/库存/生产/供应链/BOM)
│   │       │
│   │       │  # ── 数据与文档层 ──
│   │       ├── bi/              # BI MCP Server (报表/仪表盘/数据分析)
│   │       └── dms/             # 文档管理 MCP Server (企业网盘/知识库/审批流文档)
│   │
│   ├── skill-manager/           # 技能管理器（个人用户）
│   │   └── src/
│   │       ├── manager.ts       # 技能 CRUD、启用/禁用、版本管理
│   │       ├── creator.ts       # 技能创建向导（交互式生成 SKILL.md）
│   │       ├── validator.ts     # 技能格式校验 + 安全审查
│   │       ├── packager.ts      # 打包技能为可发布格式 (.skill.tar.gz)
│   │       └── types.ts
│   │
│   ├── skill-marketplace/       # 技能市场（社区共享）
│   │   └── src/
│   │       ├── marketplace.ts   # 市场核心：发布、搜索、下载、更新
│   │       ├── registry.ts      # 远程技能注册表（类似 npm registry）
│   │       ├── rating.ts        # 评分评价系统
│   │       ├── ranking.ts       # 排名算法（下载量 × 评分 × 活跃度）
│   │       ├── review.ts        # 审核系统（自动 + 人工）
│   │       ├── sync.ts          # 本地 ↔ 远程同步
│   │       └── types.ts
│   │
│   ├── server/                  # Hono API 服务端
│   │   └── src/
│   │       ├── routes/          # chat, tasks, skills, marketplace, mcp, personas, decision,
│   │       │                    # compliance, proactive, org-memory, memory, knowledge, settings
│   │       ├── middleware/      # auth, cors, logger, persona-context（角色上下文注入）
│   │       └── ws/              # WebSocket 实时推送（含主动推送通道）
│   │
│   ├── web/                     # Next.js 前端
│   │   └── src/
│   │       ├── app/             # 页面: chat, decision-cockpit, tasks, skills, marketplace,
│   │       │                    #        mcp, compliance, proactive, org-memory, personas, settings
│   │       ├── components/      # UI 组件: chat-panel, decision-cockpit, sidebar, skill-editor,
│   │       │                    #          marketplace, mcp-dashboard, compliance-center,
│   │       │                    #          proactive-panel, persona-switcher, org-memory-browser,
│   │       │                    #          strategy-board, insight-timeline, browser-viewer
│   │       └── hooks/           # use-chat, use-agent, use-marketplace, use-mcp,
│   │                            # use-persona, use-compliance, use-proactive, use-decision
│   │
│   └── knowledge/               # 知识库引擎
│       └── src/                 # indexer, search, embeddings, storage
│
├── skills/                      # 本地技能目录 (Anthropic SKILL.md 格式)
│   ├── built-in/                # 内置技能（不可删除）
│   │   ├── code-review/SKILL.md
│   │   ├── web-search/SKILL.md
│   │   ├── file-management/SKILL.md
│   │   └── browser-automation/SKILL.md
│   ├── installed/               # 从市场安装的技能
│   └── custom/                  # 用户自创的技能
│
├── config/
│   ├── mcp-servers/             # MCP Server 配置（同前）
│   ├── personas/                # 角色画像配置
│   │   ├── _template.yaml       # 角色模板
│   │   ├── ceo.yaml             # CEO / 高管
│   │   ├── hr-manager.yaml      # 人事经理
│   │   ├── finance-controller.yaml # 财务总监
│   │   ├── legal-counsel.yaml   # 法务
│   │   ├── sales-rep.yaml       # 销售代表
│   │   ├── ops-manager.yaml     # 运营经理
│   │   └── engineer.yaml        # 工程师
│   ├── compliance/              # 合规规则配置
│   │   ├── rules/               # 规则文件（YAML DSL）
│   │   │   ├── finance.yaml     # 财务规则：报销限额、审批层级
│   │   │   ├── legal.yaml       # 法务规则：合同必须法务审核
│   │   │   ├── hr.yaml          # 人事规则：薪酬信息访问控制
│   │   │   └── general.yaml     # 通用规则：敏感操作二次确认
│   │   └── approval-flows.yaml  # 审批流定义
│   ├── proactive/               # 主动任务配置
│   │   ├── schedules.yaml       # 定时任务（日报、周报、月度检查）
│   │   ├── triggers.yaml        # 事件触发器（合同到期、库存预警）
│   │   └── monitors.yaml        # 阈值监控（预算超支、应收逾期）
│   └── decision/                # 决策智能配置
│       ├── metrics.yaml         # 经营指标体系定义（KPI/OKR 树）
│       ├── collection.yaml      # 数据采集计划（频率、数据源、聚合方式）
│       ├── insight-rules.yaml   # 洞察规则（异常检测阈值、趋势判定条件）
│       └── strategy.yaml        # 战略目标定义 + 关键结果 + 对齐关系
│
└── data/                        # 运行时数据
    ├── memory/                  # 个人记忆: conversations/, facts/, tasks/
    ├── org-memory/              # 组织记忆
    │   ├── knowledge/           # 组织知识库（制度、流程、最佳实践）
    │   ├── decisions/           # 决策记录
    │   ├── lessons/             # 经验教训
    │   └── policies/            # 制度规章（合规引擎读取）
    ├── knowledge/               # 个人知识库文档 + 嵌入索引
    ├── marketplace/             # 市场缓存: index.json, downloads/
    ├── mcp/                     # MCP 运行时数据
    │   ├── credentials/         # 加密存储的企业系统凭证
    │   ├── cache/               # MCP 响应缓存
    │   └── audit/               # 审计日志
    ├── compliance/              # 合规运行时数据
    │   ├── audit-trail/         # 合规审计轨迹
    │   └── pending-approvals/   # 待审批队列
    ├── proactive/               # 主动任务运行时
    │   ├── task-history/        # 执行历史
    │   └── alert-log/           # 预警日志
    ├── decision/                # 决策智能运行时数据
    │   ├── metrics/             # 经营指标时序数据（采集快照）
    │   ├── insights/            # 洞察记录（趋势/异常/归因）
    │   ├── journal/             # 决策日志（背景→选项→决策→结果）
    │   ├── strategy/            # 战略目标 + OKR/KPI 定义 + 进度追踪
    │   └── reports/             # 自动生成的分析报告
    └── logs/                    # 执行日志
```

## 核心架构设计

### 1. Model Router（模型路由）

- 统一使用 `openai` npm 包连接 MiniMax 2.5 和 Claude API
- 支持三种路由策略：`default`（指定模型）、`cost-optimized`（优先便宜模型）、`quality-first`（复杂任务用 Claude）
- 每个 Provider 实现 `complete()` 和 `completeStream()` 接口
- MiniMax 的 `<think>` 标签单独解析为 thinking 内容

### 2. Agent 引擎

- **Planner**: 将复杂任务分解为多个步骤
- **Executor**: 逐步执行，每步可调用工具，支持循环和条件判断
- **Tool Loop**: Agent → 模型调用 → tool_calls → 执行工具 → 结果回传 → 继续循环

### 3. Skill 系统 (Anthropic Agent Skills 规范)

- SKILL.md 格式：YAML frontmatter（name, description, allowed-tools）+ Markdown 指令
- 三级渐进加载：Level 1 元数据 → Level 2 指令 → Level 3 引用文件
- 技能注册表：启动时扫描 `skills/` 三个子目录（built-in / installed / custom）
- 技能执行：将 SKILL.md 指令注入 system prompt，执行 scripts/ 中的脚本
- 技能来源分层：built-in（内置不可删）→ installed（市场安装）→ custom（用户自创）

#### 3.1 Skill Manager（个人技能管理器）

管理本地所有技能的生命周期：

- **CRUD**: 创建、查看、编辑、删除自定义技能
- **创建向导**: 交互式生成 SKILL.md（输入名称描述 → 选择工具权限 → 生成模板 → 编辑完善）
- **启用/禁用**: 按需开关技能，不删除文件
- **版本管理**: 每个技能支持 semver 版本号，升级时保留旧版本
- **格式校验**: 验证 SKILL.md 是否符合 Anthropic 规范（name 格式、必填字段、目录结构）
- **安全审查**: 检查 scripts/ 中是否有危险命令（rm -rf, curl | sh 等）
- **导入/导出**: 打包技能为 `.skill.tar.gz` 用于分享，或从文件导入
- **依赖管理**: 技能可声明依赖其他技能，安装时自动解析

技能状态流转：`draft` → `active` → `disabled` / `published`

#### 3.2 Skill Marketplace（技能市场）

社区级技能共享平台，实现优胜劣汰：

**市场架构（两层）：**

- **本地客户端** (`packages/skill-marketplace/`): 搜索、下载、安装、评价
- **远程服务端**: 独立的市场 API 服务（后续部署，初期用 JSON 文件模拟）

**核心功能：**

- **发布**: 用户将 custom 技能打包上传至市场，需通过自动审核
- **搜索发现**: 按分类、标签、关键词、排名浏览技能
- **安装**: 一键下载到 `skills/installed/`，自动解析依赖
- **更新**: 检测已安装技能的新版本，支持一键升级
- **评分评价**: 用户对已安装技能打分（1-5星）+ 文字评价
- **使用统计**: 记录每个技能的调用次数、成功率、平均耗时

**排名算法（优胜劣汰）：**

```
score = (downloads × 0.3) + (avg_rating × 0.3) + (success_rate × 0.2) + (recency × 0.2)
```

- downloads: 30天内下载量（归一化）
- avg_rating: 平均评分
- success_rate: 技能执行成功率（来自匿名上报）
- recency: 最近更新时间衰减因子

**技能分类体系：**

| 分类 | 说明 | 示例 |
|------|------|------|
| development | 开发相关 | code-review, git-helper, test-writer |
| automation | 自动化 | browser-fill-form, batch-rename, cron-setup |
| data | 数据处理 | csv-analyzer, json-transformer, log-parser |
| writing | 写作翻译 | blog-writer, translator, summarizer |
| system | 系统管理 | disk-cleaner, process-monitor, backup |
| web | 网络相关 | web-scraper, api-tester, seo-checker |
| custom | 其他 | 用户自定义分类 |

**审核机制：**

1. **自动审核（发布时）**: 格式校验 + 安全扫描 + 依赖检查
2. **社区审核（运行中）**: 低评分（<2星）+ 高失败率（>50%）自动下架预警
3. **举报机制**: 用户可举报恶意/低质技能，累计举报触发下架

**市场数据模型：**

```typescript
interface MarketplaceSkill {
  id: string;                    // 唯一标识
  name: string;                  // 技能名称
  version: string;               // semver
  author: { id: string; name: string };
  description: string;
  category: SkillCategory;
  tags: string[];
  downloads: number;
  rating: { average: number; count: number };
  successRate: number;           // 执行成功率
  publishedAt: string;
  updatedAt: string;
  size: number;                  // 包大小(bytes)
  dependencies: string[];        // 依赖的其他技能
  compatibility: string;         // 兼容性要求
  status: 'active' | 'deprecated' | 'suspended';
  checksum: string;              // SHA256 完整性校验
}
```

### 4. MCP Hub（企业系统集成中心）

Agent 连接企业数字化系统的统一网关。**Skill 定义"怎么做"，MCP 定义"连什么"**。

#### 4.1 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                      Agent Engine                        │
│                  (Planner + Executor)                     │
└──────────────────────┬──────────────────────────────────┘
                       │ tool_calls (mcp_*)
                       ▼
┌─────────────────────────────────────────────────────────┐
│                       MCP Hub                            │
│  ┌──────────┐ ┌───────────┐ ┌────────────┐ ┌─────────┐ │
│  │ Registry │ │ Aggregator│ │   Router   │ │  Auth   │ │
│  │  发现注册  │ │  工具聚合  │ │  请求路由   │ │ 鉴权网关 │ │
│  └──────────┘ └───────────┘ └────────────┘ └─────────┘ │
│  ┌──────────┐ ┌───────────┐ ┌────────────┐ ┌─────────┐ │
│  │ Health   │ │Rate Limit │ │   Audit    │ │Lifecycle│ │
│  │ 健康监控  │ │   限流     │ │  审计日志   │ │ 生命周期 │ │
│  └──────────┘ └───────────┘ └────────────┘ └─────────┘ │
└──────┬──────────┬──────────┬──────────┬────────────────┘
       │          │          │          │
       ▼          ▼          ▼          ▼
  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
  │Database│ │ Feishu │ │DingTalk│ │HTTP API│  ... (MCP Servers)
  │ Server │ │ Server │ │ Server │ │ Server │
  └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘
      ▼          ▼          ▼          ▼
   MySQL/PG    飞书API    钉钉API    任意REST
```

#### 4.2 MCP 协议实现

遵循 Anthropic MCP 规范（JSON-RPC 2.0），支持两种传输方式：

| 传输方式 | 适用场景 | 说明 |
|----------|----------|------|
| **stdio** | 本地 MCP Server（子进程） | Hub 启动子进程，通过 stdin/stdout 通信 |
| **SSE (HTTP)** | 远程 MCP Server（独立服务） | 适合企业内网部署的独立 MCP 服务 |

**MCP 三大能力：**

| 能力 | 方向 | 说明 | 企业场景示例 |
|------|------|------|-------------|
| **Tools** | Server → Agent | 企业系统提供可调用的操作 | `feishu_send_message`, `db_query`, `approval_submit` |
| **Resources** | Server → Agent | 企业系统提供可读取的数据 | `feishu://doc/{id}`, `db://table/users`, `jira://issue/PROJ-123` |
| **Prompts** | Server → Agent | 企业系统提供的提示词模板 | "审批通知模板", "周报汇总模板" |

#### 4.3 Server 注册表 & 配置

每个 MCP Server 通过 JSON 配置文件声明：

```json
// config/mcp-servers/feishu.json
{
  "id": "feishu",
  "name": "飞书",
  "description": "飞书开放平台集成 - 消息/文档/审批/日历",
  "transport": "stdio",
  "command": "bun",
  "args": ["run", "packages/mcp-servers/src/feishu/index.ts"],
  "env": {
    "FEISHU_APP_ID": "${env:FEISHU_APP_ID}",
    "FEISHU_APP_SECRET": "${env:FEISHU_APP_SECRET}"
  },
  "enabled": true,
  "autoStart": true,
  "healthCheck": {
    "interval": 30000,
    "timeout": 5000,
    "retries": 3
  },
  "rateLimit": {
    "maxRequests": 100,
    "windowMs": 60000
  },
  "permissions": {
    "tools": ["feishu_*"],
    "resources": ["feishu://*"],
    "requireApproval": ["feishu_send_message", "feishu_create_approval"]
  },
  "tags": ["communication", "document", "approval"],
  "category": "communication"
}
```

**配置支持环境变量引用**（`${env:VAR_NAME}`），敏感凭证从 `.env.local` 或加密存储读取，永远不硬编码。

#### 4.4 MCP Server 体系

采用**三层架构**：基础设施层提供通用连接能力，业务系统层按领域标准化接口，具体对接哪家产品通过配置驱动。

##### 基础设施层（通用连接器）

| MCP Server | 连接系统 | 提供的 Tools | 提供的 Resources |
|------------|----------|-------------|-----------------|
| **database** | MySQL / PostgreSQL / SQLite | `db_query`, `db_execute`, `db_describe`, `db_list_tables` | `db://schema`, `db://table/*` |
| **http-api** | 任意 REST/GraphQL API | `api_get`, `api_post`, `api_put`, `api_delete`, `api_graphql` | `api://endpoint/*` |
| **git** | GitHub / GitLab / Gitea | `git_clone`, `git_pr_create`, `git_issue_list`, `git_diff` | `git://repo/*/file/*` |
| **email** | IMAP/SMTP/Exchange | `email_send`, `email_search`, `email_read`, `email_reply` | `email://inbox/*`, `email://folder/*` |

> `http-api` 是万能适配器 — 任何有 REST API 的系统都能通过它快速接入，无需开发专用 Server。

##### 协作通讯层

| MCP Server | 连接系统 | 提供的 Tools | 提供的 Resources |
|------------|----------|-------------|-----------------|
| **feishu** | 飞书开放平台 | `feishu_send_msg`, `feishu_read_doc`, `feishu_create_approval`, `feishu_list_calendar` | `feishu://doc/*`, `feishu://sheet/*` |
| **wechat-work** | 企业微信 | `wxwork_send_msg`, `wxwork_get_user`, `wxwork_create_approval` | `wxwork://contact/*` |

##### 业务系统层（人财法 + CRM + ERP）

每个业务 MCP Server 定义**标准化的领域接口**，底层通过适配器模式对接不同厂商产品：

| MCP Server | 业务领域 | 可对接产品 | 标准化 Tools |
|------------|----------|-----------|-------------|
| **hrm** | 人事管理 | 用友HCM、北森、SAP SuccessFactors、自建 | `hrm_get_employee`, `hrm_list_org`, `hrm_query_attendance`, `hrm_get_payroll`, `hrm_list_candidates` |
| **finance** | 财务管理 | 金蝶云星空、用友U8/NC、SAP FI、自建 | `fin_query_ledger`, `fin_list_invoices`, `fin_get_expense`, `fin_query_budget`, `fin_ap_ar_summary` |
| **legal** | 法务管理 | 法大大、e签宝、合同管理系统、自建 | `legal_list_contracts`, `legal_get_contract`, `legal_create_sign`, `legal_compliance_check`, `legal_list_cases` |
| **crm** | 客户关系 | 纷享销客、销售易、Salesforce、自建 | `crm_list_customers`, `crm_get_opportunity`, `crm_update_lead`, `crm_sales_pipeline`, `crm_service_tickets` |
| **erp** | 企业资源 | 用友U8/NC、金蝶K3/Cloud、SAP、自建 | `erp_query_inventory`, `erp_list_orders`, `erp_get_bom`, `erp_procurement_status`, `erp_production_plan` |

##### 数据与文档层

| MCP Server | 连接系统 | 提供的 Tools | 提供的 Resources |
|------------|----------|-------------|-----------------|
| **bi** | 帆软/Power BI/Metabase/自建 | `bi_query_report`, `bi_list_dashboards`, `bi_get_metrics`, `bi_export_data` | `bi://report/*`, `bi://dashboard/*` |
| **dms** | 企业网盘/知识库 | `dms_search`, `dms_read_doc`, `dms_upload`, `dms_list_folder` | `dms://doc/*`, `dms://folder/*` |

##### 适配器模式（Adapter Pattern）

业务 MCP Server 内部采用适配器模式，一套标准接口对接多个厂商：

```
┌──────────────────────────────────────────┐
│          HRM MCP Server                  │
│                                          │
│  标准接口: hrm_get_employee(id)          │
│           hrm_query_attendance(date)     │
│                                          │
│  ┌─────────────────────────────────────┐ │
│  │         Adapter Layer               │ │
│  │  ┌─────────┐ ┌──────┐ ┌─────────┐  │ │
│  │  │ 用友HCM │ │ 北森  │ │ SAP HCM │  │ │
│  │  │ Adapter │ │Adapter│ │ Adapter │  │ │
│  │  └────┬────┘ └───┬──┘ └────┬────┘  │ │
│  └───────┼──────────┼─────────┼───────┘ │
└──────────┼──────────┼─────────┼─────────┘
           ▼          ▼         ▼
       用友 API    北森 API   SAP API
```

配置文件中通过 `adapter` 字段指定对接哪个产品：

```json
// config/mcp-servers/hrm.json
{
  "id": "hrm",
  "name": "人事管理系统",
  "description": "员工信息、组织架构、考勤、薪酬、招聘",
  "transport": "stdio",
  "command": "bun",
  "args": ["run", "packages/mcp-servers/src/hrm/index.ts"],
  "adapter": "beisen",
  "adapterConfig": {
    "baseUrl": "https://api.beisen.com/v1",
    "tenantId": "${env:BEISEN_TENANT_ID}"
  },
  "env": {
    "BEISEN_APP_KEY": "${env:BEISEN_APP_KEY}",
    "BEISEN_APP_SECRET": "${env:BEISEN_APP_SECRET}"
  },
  "enabled": true,
  "autoStart": true,
  "permissions": {
    "tools": ["hrm_*"],
    "resources": ["hrm://*"],
    "requireApproval": ["hrm_get_payroll"]
  },
  "tags": ["hr", "employee", "attendance"],
  "category": "hrm"
}
```

> 换系统只需改 `adapter` + `adapterConfig`，上层 Agent 和 Skill 零改动。

每个 Server 基于统一基类 `BaseMCPServer` 构建，只需实现 `listTools()`, `callTool()`, `listResources()`, `readResource()` 四个方法。每个 Adapter 实现统一的 `DomainAdapter` 接口。

#### 4.5 MCP Hub 核心模块

**Registry（注册表）**：
- 启动时扫描 `config/mcp-servers/*.json`，注册所有已启用的 Server
- 支持运行时动态注册/注销（Web UI 中添加新 Server 无需重启）
- 每个 Server 记录状态：`registered` → `starting` → `connected` → `error` / `disconnected`

**Aggregator（工具聚合器）**：
- 汇总所有已连接 MCP Server 暴露的 tools，合并到 Agent 的工具注册表
- 工具名自动加前缀避免冲突：`feishu_send_msg`, `db_query`, `dingtalk_attendance`
- Agent 发起 tool_call 时，Aggregator 根据前缀路由到对应 Server

**Auth Gateway（鉴权网关）**：
- 统一管理所有企业系统凭证：OAuth 2.0 tokens, API Keys, Session tokens
- 支持 Token 自动刷新（OAuth refresh_token 机制）
- 凭证加密存储在 `data/mcp/credentials/`（AES-256-GCM）
- Web UI 提供凭证管理界面（添加/更新/撤销）

**Health Monitor（健康监控）**：
- 定期心跳检测每个 MCP Server 的连通性
- 自动重连：Server 断开后按指数退避策略重试
- 降级策略：Server 不可用时返回友好错误，不阻塞其他 Server
- 状态指标上报到 Web UI Dashboard

**Audit Logger（审计日志）**：
- 记录所有 MCP tool 调用：who（用户）、what（操作）、when（时间）、where（目标系统）、result（结果）
- 企业合规要求：操作可追溯，敏感操作需审批
- 日志存储在 `data/mcp/audit/`，支持按时间范围查询

**Rate Limiter（限流器）**：
- 每个 MCP Server 独立限流配置
- 滑动窗口算法，防止 Agent 过度调用企业 API
- 超限时排队等待而非直接拒绝

#### 4.6 MCP + Skill 协作模式

MCP 和 Skill 不是替代关系，而是组合使用。**Skill 编排业务流程，MCP 提供系统连接能力。**

**示例 1：月度经营分析**
```
Skill: "生成本月经营分析报告"
  ├── Step 1: 调用 `fin_query_ledger` 获取本月收入支出数据
  ├── Step 2: 调用 `crm_sales_pipeline` 获取销售漏斗数据
  ├── Step 3: 调用 `erp_query_inventory` 获取库存周转数据
  ├── Step 4: 调用 `hrm_query_attendance` 获取人效数据
  ├── Step 5: 调用 `bi_get_metrics` 获取关键经营指标
  ├── Step 6: Agent 汇总分析，生成经营报告
  └── Step 7: 调用 `feishu_send_msg` 发送到管理层群
```

**示例 2：新员工入职全流程**
```
Skill: "新员工入职自动化"
  ├── Step 1: 调用 `hrm_get_employee` 获取入职人员信息
  ├── Step 2: 调用 `erp_procurement_status` 确认设备采购到位
  ├── Step 3: 调用 `legal_create_sign` 发起劳动合同电子签
  ├── Step 4: 调用 `feishu_send_msg` 通知 IT 开通账号
  ├── Step 5: 调用 `wxwork_send_msg` 发送入职欢迎消息
  └── Step 6: 调用 `fin_get_expense` 创建社保公积金账户
```

**示例 3：合同到期预警**
```
Skill: "合同到期智能预警"
  ├── Step 1: 调用 `legal_list_contracts` 查询30天内到期合同
  ├── Step 2: 调用 `crm_list_customers` 关联客户信息
  ├── Step 3: 调用 `fin_ap_ar_summary` 查看该客户应收应付
  ├── Step 4: Agent 评估续约风险等级
  └── Step 5: 调用 `feishu_send_msg` 按风险等级分发给对应负责人
```

Skill 的 `allowed-tools` 字段声明式引用 MCP 工具：

```yaml
# skills/custom/monthly-report/SKILL.md
---
name: monthly-business-report
description: 汇总人财法CRM ERP数据，生成月度经营分析报告
allowed-tools:
  - fin_query_ledger
  - fin_ap_ar_summary
  - crm_sales_pipeline
  - erp_query_inventory
  - hrm_query_attendance
  - bi_get_metrics
  - feishu_send_msg
---
```

#### 4.7 MCP Server 配置模板

```json
// config/mcp-servers/_template.json
{
  "$schema": "./schema.json",
  "id": "server-id",
  "name": "显示名称",
  "description": "这个 MCP Server 连接什么系统，提供什么能力",
  "transport": "stdio | sse",
  "command": "启动命令 (stdio 模式)",
  "args": ["参数"],
  "url": "http://host:port/mcp (sse 模式)",
  "env": {},
  "enabled": true,
  "autoStart": true,
  "healthCheck": {
    "interval": 30000,
    "timeout": 5000,
    "retries": 3
  },
  "rateLimit": {
    "maxRequests": 100,
    "windowMs": 60000
  },
  "permissions": {
    "tools": ["*"],
    "resources": ["*"],
    "requireApproval": []
  },
  "tags": [],
  "category": "custom"
}
```

#### 4.8 MCP 数据模型

```typescript
// MCP Server 运行时状态
interface MCPServerInstance {
  id: string;
  config: MCPServerConfig;
  status: 'registered' | 'starting' | 'connected' | 'error' | 'disconnected' | 'stopped';
  pid?: number;                          // stdio 模式的子进程 PID
  connectedAt?: string;
  lastHealthCheck?: string;
  error?: string;
  tools: MCPTool[];                      // 该 Server 暴露的工具列表
  resources: MCPResource[];              // 该 Server 暴露的资源列表
  prompts: MCPPrompt[];                  // 该 Server 暴露的提示词模板
  metrics: {
    totalCalls: number;
    successCalls: number;
    avgLatencyMs: number;
    lastCallAt?: string;
  };
}

// MCP 工具定义（遵循 MCP 规范）
interface MCPTool {
  name: string;                          // 工具名（带 server 前缀）
  description: string;
  inputSchema: JSONSchema;               // JSON Schema 参数定义
  serverId: string;                      // 归属的 MCP Server
  requireApproval: boolean;              // 是否需要用户审批才能执行
}

// MCP 资源定义
interface MCPResource {
  uri: string;                           // 资源 URI (e.g. feishu://doc/abc123)
  name: string;
  description: string;
  mimeType: string;
  serverId: string;
}

// MCP 审计日志条目
interface MCPAuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  serverId: string;
  action: 'tool_call' | 'resource_read' | 'prompt_get';
  target: string;                        // tool name 或 resource URI
  input?: Record<string, unknown>;       // 请求参数（脱敏后）
  output?: { success: boolean; summary: string };
  latencyMs: number;
  approved: boolean;                     // 是否经过审批
}

// MCP Server 配置
interface MCPServerConfig {
  id: string;
  name: string;
  description: string;
  transport: 'stdio' | 'sse';
  command?: string;                      // stdio 模式
  args?: string[];
  url?: string;                          // sse 模式
  env?: Record<string, string>;
  enabled: boolean;
  autoStart: boolean;
  healthCheck: { interval: number; timeout: number; retries: number };
  rateLimit: { maxRequests: number; windowMs: number };
  permissions: {
    tools: string[];                     // glob 匹配允许的工具
    resources: string[];                 // glob 匹配允许的资源
    requireApproval: string[];           // 需要审批的工具名列表
  };
  tags: string[];
  category: MCPServerCategory;
}

type MCPServerCategory =
  | 'infrastructure' // 基础设施 (数据库/HTTP API)
  | 'communication'  // 协作通讯 (飞书/企业微信/邮件)
  | 'development'    // 开发工具 (Git/CI/CD)
  | 'hrm'            // 人事管理
  | 'finance'        // 财务管理
  | 'legal'          // 法务管理
  | 'crm'            // 客户关系
  | 'erp'            // 企业资源
  | 'analytics'      // 数据分析 (BI/报表)
  | 'document'       // 文档管理
  | 'custom';        // 自定义
```

### 5. 角色画像系统（Role Personas）

**核心理念**：不是"所有人用同一个 AI"，而是"每个角色有专属的 AI 伙伴"。

#### 角色画像定义

```yaml
# config/personas/finance-controller.yaml
id: finance-controller
name: 财务总监
description: 负责企业财务管理、预算控制、税务合规、资金管理

# Agent 人格：影响 system prompt 的生成
personality:
  tone: professional        # 专业严谨
  focus: accuracy           # 精确优先
  caution: high             # 高度谨慎（涉及资金）

# 默认加载的技能
default_skills:
  - monthly-business-report
  - budget-alert
  - invoice-management
  - tax-compliance-check

# 可访问的 MCP 系统
allowed_mcp_servers:
  - finance                  # 完整访问
  - erp                      # 只读
  - crm                      # 只读（看应收）
  - bi                       # 完整访问
  - hrm                      # 仅 hrm_get_payroll（薪酬汇总）

# 合规规则集
compliance_ruleset: finance  # 引用 config/compliance/rules/finance.yaml

# 主动任务
proactive_tasks:
  - schedule: "0 9 * * 1"   # 每周一早9点
    action: weekly-cashflow-summary
  - trigger: budget_exceed_90_percent
    action: alert-budget-warning

# 知识范围：该角色能访问的组织记忆
org_memory_access:
  - policies/finance/*
  - decisions/budget/*
  - lessons/finance/*
```

#### 角色 → Agent 的注入流程

```
用户登录 → 识别角色 → 加载角色画像
    → 注入 system prompt（职责 + 风格 + 领域知识）
    → 加载默认技能
    → 过滤 MCP 权限（只看到自己能用的工具）
    → 加载合规规则集
    → 激活主动任务
    → 加载可访问的组织记忆
```

**效果**：财务总监登录后，Agent 已经知道自己是财务助手，默认能拉报表、查预算、管发票，看不到不该看的人事薪酬明细，每周一自动推送现金流摘要。

#### 内置角色模板

| 角色 | 核心能力 | 主要连接系统 | 典型主动任务 |
|------|---------|-------------|-------------|
| CEO / 高管 | 全局经营概览、战略分析 | BI + 全系统只读 | 每日经营日报、异常指标预警 |
| 人事经理 | 员工管理、招聘、考勤 | HRM + 飞书 | 入职流程自动化、考勤异常提醒 |
| 财务总监 | 账务、预算、税务、资金 | Finance + ERP + BI | 周度现金流、预算超支预警 |
| 法务顾问 | 合同、合规、知识产权 | Legal + CRM | 合同到期提醒、合规风险扫描 |
| 销售代表 | 客户、商机、报价 | CRM + ERP(库存) | 商机跟进提醒、客户动态推送 |
| 运营经理 | 采购、库存、生产 | ERP + Finance | 库存预警、采购审批催办 |
| 工程师 | 代码、部署、文档 | Git + 知识库 | PR Review 提醒、线上告警 |

### 6. 合规引擎（Compliance Engine）

**核心理念**：合规不只是事前拦截，也是事后校验 — **Pre-Hook 管"能不能做"，Post-Run Hook 管"做得对不对"**。

#### 双阶段 Hook 架构

```
Agent 发起 tool_call
    │
    ▼
╔══════════════════════════════════════╗
║  Pre-Hook（执行前）                   ║
║                                      ║
║  "这个操作能不能做？"                  ║
║                                      ║
║  ├─ 角色权限校验   → 你有权限吗？      ║
║  ├─ 业务规则校验   → 金额/条件合规吗？  ║
║  ├─ 时间窗口校验   → 现在允许操作吗？   ║
║  ├─ 频率检查      → 短时间内重复操作？  ║
║  └─ 关联检查      → 前置条件满足吗？   ║
║                                      ║
║  结果:                                ║
║  ├─ ✅ allow     → 放行              ║
║  ├─ ⚠️ approval  → 暂停，发起审批     ║
║  ├─ 🔄 modify    → 自动修正参数后放行  ║
║  └─ ❌ deny      → 拒绝              ║
╚═══════════════╤══════════════════════╝
                │
                ▼
        ┌───────────────┐
        │  实际执行操作   │
        │  MCP / Tool    │
        └───────┬───────┘
                │
                ▼
╔══════════════════════════════════════╗
║  Post-Run Hook（执行后）              ║
║                                      ║
║  "做完的结果合不合规？"                 ║
║                                      ║
║  ├─ 结果校验      → 返回数据是否异常？  ║
║  ├─ 敏感数据脱敏   → 身份证/银行卡遮掩  ║
║  ├─ 数据分级      → 结果标记密级       ║
║  ├─ 操作记账      → 写入审计轨迹       ║
║  ├─ 副作用检查    → 写操作是否产生      ║
║  │                  预期外影响？       ║
║  └─ 联动触发      → 触发后续合规动作    ║
║                                      ║
║  结果:                                ║
║  ├─ ✅ pass      → 结果正常返回       ║
║  ├─ 🔄 mask      → 脱敏后返回         ║
║  ├─ ⚠️ flag      → 返回 + 标记异常    ║
║  ├─ 🔔 notify    → 返回 + 通知相关人  ║
║  └─ ❌ revoke    → 触发回滚/补偿操作   ║
╚══════════════════════════════════════╝
```

#### Pre-Hook：执行前校验

**职责**：在 tool_call 到达 MCP Server / 内置工具之前拦截，决定能不能执行。

| 校验类型 | 说明 | 示例 |
|---------|------|------|
| **角色权限** | 当前角色有没有权限调用这个工具 | 销售不能看薪酬 |
| **业务规则** | 参数是否符合业务规则 | 报销超 5 万需要 CFO 审批 |
| **时间窗口** | 是否在允许操作的时间范围内 | 财务结算期间禁止修改账目 |
| **频率限制** | 短时间内是否异常重复操作 | 1 分钟内发起 10 次付款请求 |
| **前置条件** | 是否满足必要的前置步骤 | 合同签署前必须法务审核 |
| **参数修正** | 自动修正不合规参数（而非直接拒绝） | 查询范围超出权限时自动收窄到允许范围 |

Pre-Hook 的四种结果：

```typescript
type PreHookResult =
  | { action: 'allow' }                                        // 放行
  | { action: 'deny'; reason: string }                         // 拒绝
  | { action: 'require_approval'; approver: string; reason: string }  // 需审批
  | { action: 'modify'; modifiedInput: Record<string, unknown>; reason: string }  // 修正参数
```

#### Post-Run Hook：执行后校验

**职责**：工具执行完毕后，对结果进行合规处理。这是传统合规系统经常忽略的环节。

| 校验类型 | 说明 | 示例 |
|---------|------|------|
| **敏感数据脱敏** | 自动遮掩结果中的敏感字段 | 身份证号 → 110***1234，银行卡 → ****5678 |
| **数据分级标记** | 标记返回数据的密级 | 薪酬数据标记为"机密"，提醒用户注意 |
| **结果合理性** | 检测结果是否异常 | 查询到的库存为负数 → 标记异常 + 通知运维 |
| **写操作确认** | 写操作完成后确认影响范围 | 批量更新了 500 条记录 → 通知管理员 |
| **审计记账** | 完整记录操作的输入输出 | 谁在什么时间查了什么数据，结果是什么 |
| **联动触发** | 执行结果满足条件时触发后续动作 | 大额付款完成 → 自动通知财务总监 |
| **回滚补偿** | 发现严重异常时触发逆向操作 | 发现重复付款 → 自动发起冲销 |

Post-Run Hook 的五种结果：

```typescript
type PostRunResult =
  | { action: 'pass'; output: unknown }                        // 原样返回
  | { action: 'mask'; output: unknown; maskedFields: string[] } // 脱敏后返回
  | { action: 'flag'; output: unknown; alerts: ComplianceAlert[] }  // 返回 + 标记异常
  | { action: 'notify'; output: unknown; notifications: Notification[] }  // 返回 + 通知相关人
  | { action: 'revoke'; compensation: CompensationAction; reason: string }  // 触发回滚
```

#### 规则 DSL（支持 pre/post 两阶段）

```yaml
# config/compliance/rules/finance.yaml
rules:
  # ── Pre-Hook 规则 ──
  - id: expense-limit
    name: 报销金额分级审批
    phase: pre                    # 执行前校验
    when:
      tool: fin_submit_expense
    conditions:
      - if: "input.amount <= 5000"
        then: allow
      - if: "input.amount <= 50000"
        then: require_approval
        approver: department_manager
      - if: "input.amount > 50000"
        then: require_approval
        approver: cfo
    audit: always

  - id: payroll-access
    name: 薪酬信息访问控制
    phase: pre
    when:
      tool: hrm_get_payroll
    conditions:
      - if: "persona.id NOT IN ['hr-manager', 'finance-controller', 'ceo']"
        then: deny
        reason: "薪酬信息仅限 HR 和财务高管查看"
    audit: always

  - id: settlement-freeze
    name: 结算期冻结
    phase: pre
    when:
      tool: fin_*
      action_type: write          # 仅拦截写操作
    conditions:
      - if: "system.is_settlement_period == true"
        then: deny
        reason: "财务结算期间禁止修改账务数据"
    audit: always

  - id: contract-sign-prereq
    name: 合同签署前置条件
    phase: pre
    when:
      tool: legal_create_sign
    conditions:
      - if: "NOT exists(approval_record, type='legal_review', target=input.contract_id)"
        then: require_approval
        approver: legal_counsel
        reason: "合同签署前必须经过法务审核"
    audit: always

  # ── Post-Run Hook 规则 ──
  - id: mask-sensitive-data
    name: 敏感数据自动脱敏
    phase: post                   # 执行后校验
    when:
      tool: hrm_*|crm_*|fin_*     # 涉及个人/财务信息的工具
    actions:
      - mask_fields:
          - pattern: "id_card"    # 身份证号
            method: "middle_mask" # 110***1234
          - pattern: "bank_account"
            method: "tail_mask"   # ****5678
          - pattern: "phone"
            method: "middle_mask" # 138****5678
          - pattern: "salary|payroll"
            method: "role_based"  # 仅 hr-manager 和 cfo 看明文

  - id: large-payment-notify
    name: 大额付款通知
    phase: post
    when:
      tool: fin_submit_payment
      condition: "output.success == true AND input.amount > 100000"
    actions:
      - notify:
          targets: [finance-controller, ceo]
          channel: feishu
          message: "大额付款已执行：{input.amount}元，收款方：{input.payee}"

  - id: inventory-anomaly
    name: 库存异常检测
    phase: post
    when:
      tool: erp_query_inventory
    actions:
      - flag_if:
          condition: "ANY(output.items, item.quantity < 0)"
          severity: critical
          alert: "发现负库存异常！SKU: {anomaly_items}"
          notify: [ops-manager]

  - id: batch-write-audit
    name: 批量写操作审计
    phase: post
    when:
      tool: "*"
      action_type: write
      condition: "output.affected_rows > 100"
    actions:
      - notify:
          targets: [system-admin]
          message: "批量写操作：{tool_name} 影响了 {output.affected_rows} 条记录"
      - flag:
          severity: warning
          reason: "大批量写操作，请确认是否预期"

  - id: duplicate-payment-check
    name: 重复付款检测与回滚
    phase: post
    when:
      tool: fin_submit_payment
      condition: "output.success == true"
    actions:
      - check_duplicate:
          lookback: "24h"
          match: ["input.payee", "input.amount", "input.invoice_no"]
      - revoke_if_duplicate:
          compensation: fin_reverse_payment
          notify: [finance-controller]
          reason: "检测到24小时内重复付款，已自动发起冲销"
```

#### Pre + Post 联动示例

```
销售: "帮我查一下客户张伟的联系方式和历史订单"
  │
  ▼
Pre-Hook:
  ✅ 角色权限: 销售可访问 CRM → 放行
  │
  ▼
执行: crm_get_customer(name="张伟")
  │
  ▼
Post-Hook:
  🔄 脱敏: 手机号 138****5678, 身份证 110***1234
  📝 审计: 记录"销售A 于 2026-03-01 查看了客户张伟的信息"
  │
  ▼
返回脱敏后的客户信息给销售
```

```
财务: "把这笔 20 万的货款付给供应商 B"
  │
  ▼
Pre-Hook:
  ⚠️ 金额 > 10 万, 需 CFO 审批 → 暂停, 发起审批
  │
  ... CFO 在飞书审批通过 ...
  │
  ▼
执行: fin_submit_payment(amount=200000, payee="供应商B")
  │
  ▼
Post-Hook:
  🔔 大额付款通知 → 推送给 CFO 和 CEO
  🔍 重复付款检测 → 检查24h内无重复 → 通过
  📝 审计: 完整记录付款操作（含审批记录）
  │
  ▼
返回付款结果 + 通知已发送
```

#### 与其他模块的联动

| 模块 | Pre-Hook 联动 | Post-Hook 联动 |
|------|-------------|---------------|
| **角色画像** | 获取角色权限，判断操作权限 | 根据角色决定脱敏级别 |
| **MCP Hub** | 在请求到达 MCP Server 前拦截 | 在 MCP Server 返回后处理结果 |
| **审批流** | 不合规时自动发起审批 | 大额/高危操作完成后通知审批人 |
| **组织记忆** | 引用制度文件作为规则依据 | 异常模式写入经验教训 |
| **主动智能** | — | 异常结果可触发主动智能的预警流程 |

### 7. 主动智能引擎（Proactive Intelligence）

**核心理念**：AI 原生组织的 Agent 不等人问，而是**主动发现问题、主动推送洞察、主动执行任务**。

#### 三种主动模式

| 模式 | 触发方式 | 示例 |
|------|---------|------|
| **定时任务** | Cron 表达式 | 每天 9:00 生成经营日报，每月 1 号出财报 |
| **事件触发** | MCP 数据变化 | 合同到期前 30 天自动预警，新线索自动分配 |
| **阈值监控** | 指标超限 | 预算使用超 90% 预警，库存低于安全线告警 |

#### 定时任务配置

```yaml
# config/proactive/schedules.yaml
schedules:
  - id: daily-executive-digest
    name: 高管每日简报
    cron: "0 8 * * 1-5"       # 工作日早 8 点
    target_personas: [ceo]
    skill: daily-business-digest
    description: |
      汇总昨日：营收、签单、回款、新增客户、库存异常、人事变动
      对比同期，标注异常项

  - id: weekly-cashflow
    name: 周度现金流汇总
    cron: "0 9 * * 1"         # 每周一早 9 点
    target_personas: [finance-controller, ceo]
    skill: weekly-cashflow-summary

  - id: contract-expiry-scan
    name: 合同到期扫描
    cron: "0 10 * * 1"        # 每周一早 10 点
    target_personas: [legal-counsel]
    skill: contract-expiry-alert
```

#### 事件触发配置

```yaml
# config/proactive/triggers.yaml
triggers:
  - id: new-lead-assignment
    name: 新线索自动分配
    source: crm                # 监听 CRM MCP Server
    event: new_lead_created
    action:
      skill: lead-assignment
      description: 根据线索区域和产品类型自动分配给对应销售

  - id: approval-reminder
    name: 审批超时催办
    source: compliance         # 监听合规引擎的待审批队列
    condition: "pending_duration > 4h"
    action:
      tool: feishu_send_msg
      message: "您有一条审批已等待超过4小时，请及时处理"
```

#### 阈值监控配置

```yaml
# config/proactive/monitors.yaml
monitors:
  - id: budget-warning
    name: 预算超支预警
    check_interval: "1h"
    query:
      tool: fin_query_budget
      params: { period: current_month }
    thresholds:
      - condition: "usage_rate >= 0.9"
        severity: warning
        notify: [finance-controller]
        message: "本月预算已使用 {usage_rate}%，请关注支出控制"
      - condition: "usage_rate >= 1.0"
        severity: critical
        notify: [finance-controller, ceo]
        message: "本月预算已超支！当前使用率 {usage_rate}%"

  - id: inventory-alert
    name: 库存安全线告警
    check_interval: "4h"
    query:
      tool: erp_query_inventory
      params: { below_safety_stock: true }
    thresholds:
      - condition: "count > 0"
        severity: warning
        notify: [ops-manager]
        message: "{count} 个SKU库存低于安全线，请及时补货"
```

### 8. 决策智能引擎（Decision Intelligence）

**核心理念**：数字化和智能化的终极目的不是连系统、跑流程，而是**让数据持续运营，支撑决策者做出有效决策，推动战略落地**。

#### BI ≠ 决策智能

| | 传统 BI | Synapse 决策智能 |
|---|--------|-----------------|
| **数据获取** | 人工拉报表、等月底 | Agent 持续采集、实时聚合 |
| **分析方式** | 看图表、靠经验 | AI 自动发现趋势、异常、归因 |
| **输出形式** | 静态报表 | 自然语言洞察 + 决策建议 + 风险评估 |
| **决策支持** | 数据展示，决策全靠人 | 提供选项分析、情景推演、历史类比 |
| **战略关联** | 看数据和看战略是两件事 | 指标 ↔ 战略目标实时穿透 |
| **闭环** | 没有。决策之后数据断了 | 决策→执行→效果→复盘 全链路追踪 |

#### 五层决策智能栈

```
  战略层   ┌─────────────────────────────────────────┐
           │  战略目标 → OKR → 关键结果 → 衡量指标     │
           │  "全年营收增长 30%"                        │
           └──────────────────┬──────────────────────┘
                              │ 对齐
  指标层   ┌──────────────────┴──────────────────────┐
           │  经营指标体系（KPI 树）                    │
           │  营收、毛利率、客单价、获客成本、回款率...   │
           └──────────────────┬──────────────────────┘
                              │ 计算
  数据层   ┌──────────────────┴──────────────────────┐
           │  数据持续采集（从 MCP 各系统）             │
           │  CRM 销售额 + Finance 成本 + ERP 库存 +  │
           │  HRM 人效 + Legal 合同 + BI 报表          │
           └──────────────────┬──────────────────────┘
                              │ 分析
  洞察层   ┌──────────────────┴──────────────────────┐
           │  AI 洞察引擎                              │
           │  趋势: "本月营收环比下降 12%"               │
           │  异常: "华东区退货率突增至 8%"              │
           │  归因: "主因是产品X质量投诉增加"             │
           │  预测: "按当前趋势Q3将无法达成目标"          │
           │  关联: "获客成本上升与市场投放ROI下降相关"    │
           └──────────────────┬──────────────────────┘
                              │ 建议
  决策层   ┌──────────────────┴──────────────────────┐
           │  决策支持                                  │
           │  选项A: 加大华东区品控投入（成本+50万）     │
           │  选项B: 暂停产品X销售，启动质量整改          │
           │  选项C: 调整Q3目标，资源转投高毛利产品       │
           │                                           │
           │  风险评估: A方案见效慢，B方案影响营收...     │
           │  历史类比: 去年Q2类似情况，采取了B+C...      │
           │                                           │
           │  → 决策者选择 → 记录决策日志 → 追踪结果     │
           └───────────────────────────────────────────┘
```

#### 8.1 数据持续采集（Collector）

不是等人拉报表，而是 Agent 按计划**持续**从各系统采集经营数据：

```yaml
# config/decision/collection.yaml
collections:
  - id: daily-revenue
    name: 每日营收快照
    cron: "0 22 * * *"          # 每天 22:00
    sources:
      - tool: fin_query_ledger
        params: { period: today, type: revenue }
      - tool: crm_sales_pipeline
        params: { period: today }
    store: metrics/revenue/      # 存储为时序数据

  - id: weekly-operations
    name: 周度运营数据
    cron: "0 8 * * 1"           # 每周一 8:00
    sources:
      - tool: erp_query_inventory
        params: { summary: true }
      - tool: hrm_query_attendance
        params: { period: last_week, summary: true }
      - tool: crm_service_tickets
        params: { period: last_week, summary: true }
      - tool: legal_list_contracts
        params: { expiring_within: 30d }
    store: metrics/operations/

  - id: monthly-full
    name: 月度全量经营数据
    cron: "0 6 1 * *"           # 每月 1 号 6:00
    sources:
      - tool: fin_query_ledger
        params: { period: last_month, detail: true }
      - tool: fin_ap_ar_summary
        params: { period: last_month }
      - tool: crm_sales_pipeline
        params: { period: last_month, detail: true }
      - tool: erp_list_orders
        params: { period: last_month, summary: true }
      - tool: hrm_get_payroll
        params: { period: last_month, summary: true }
    store: metrics/monthly/
```

#### 8.2 指标体系（Metrics）

将散落在各系统的原始数据，按企业经营逻辑组织成**指标树**：

```yaml
# config/decision/metrics.yaml
metric_tree:
  - id: revenue
    name: 营收
    formula: "SUM(fin_ledger.revenue)"
    frequency: daily
    children:
      - id: revenue_by_product
        name: 按产品线营收
        dimension: product_line
      - id: revenue_by_region
        name: 按区域营收
        dimension: region

  - id: gross_margin
    name: 毛利率
    formula: "(revenue - cogs) / revenue"
    frequency: monthly
    alert:
      warning: "< 0.35"         # 低于 35% 预警
      critical: "< 0.25"        # 低于 25% 告警

  - id: customer_acquisition_cost
    name: 获客成本 (CAC)
    formula: "marketing_spend / new_customers"
    frequency: monthly
    compare: [mom, yoy]          # 自动计算环比和同比

  - id: cash_flow
    name: 现金流
    formula: "cash_in - cash_out"
    frequency: weekly
    alert:
      critical: "< 0"           # 现金流为负立即告警

  - id: employee_efficiency
    name: 人效
    formula: "revenue / headcount"
    frequency: monthly

  # 每个指标可关联到战略目标
  strategy_alignment:
    - metric: revenue
      objective: "FY2026 营收增长 30%"
      key_result: "Q1 达成 25% 的年度目标"
      current_progress: "22%"    # 实时更新
```

#### 8.3 洞察引擎（Insight Engine）

不是展示数据，而是**AI 主动发现值得关注的信息**：

| 洞察类型 | 方法 | 示例 |
|---------|------|------|
| **趋势发现** | 时序数据回归分析 | "连续3周营收环比下降，趋势显著" |
| **异常检测** | 基于历史基线的偏差检测 | "华东区本月退货率 8%，高于历史均值 3% 的 2.6 倍" |
| **归因分析** | 多维度下钻 + 关联分析 | "营收下降主因：产品X销量减少 40%，关联发现质量投诉增加" |
| **预测推演** | 趋势外推 + 情景模拟 | "按当前增速，Q3 末累计营收将差目标 15%" |
| **关联发现** | 跨系统数据关联 | "获客成本上升与市场部人员流失时间高度相关" |
| **对标比较** | 指标同环比 + 历史同期 | "本月毛利率 32%，低于去年同期 38%，低于近12月均值 36%" |

```typescript
// 洞察引擎输出
interface Insight {
  id: string;
  timestamp: string;
  type: 'trend' | 'anomaly' | 'attribution' | 'prediction' | 'correlation' | 'benchmark';
  severity: 'info' | 'warning' | 'critical';
  title: string;                    // "华东区退货率突增至 8%"
  summary: string;                  // 自然语言描述
  evidence: {                       // 数据依据
    metrics: MetricSnapshot[];
    comparisons: Comparison[];
    sources: string[];              // 数据来源的 MCP Server
  };
  relatedInsights: string[];        // 关联的其他洞察
  suggestedActions: string[];       // 建议的下一步动作
  strategyImpact?: {                // 对战略目标的影响
    objective: string;
    impact: 'positive' | 'negative' | 'neutral';
    description: string;
  };
}
```

#### 8.4 决策支持（Decision Advisor）

当决策者面对复杂选择时，Agent 提供结构化的决策辅助：

```
CEO: "华东区退货率飙升怎么办？"
  │
  ▼
Agent 决策支持流程:

1. 现状分析（自动从洞察引擎获取）
   ├── 退货率: 8%（历史均值 3%）
   ├── 主要产品: 产品X 占退货的 72%
   ├── 主要原因: 质量投诉（来自 CRM 工单分析）
   └── 财务影响: 本月已损失约 120 万

2. 选项生成 + 风险评估
   ┌─────────────────────────────────────────────────────┐
   │ 选项A: 加强品控 + 售后补偿                            │
   │   预计成本: 50万    见效周期: 2-3月                    │
   │   风险: 期间退货可能持续，短期损失继续扩大               │
   │   历史参考: 2024Q2 类似情况，采取此方案后3个月恢复正常   │
   ├─────────────────────────────────────────────────────┤
   │ 选项B: 暂停产品X销售 + 紧急整改                       │
   │   预计成本: 营收损失约 200万/月    见效周期: 1-2月      │
   │   风险: 短期营收缺口，但阻止了持续损失                   │
   │   影响: 可能影响Q2营收目标达成（当前进度 22%）           │
   ├─────────────────────────────────────────────────────┤
   │ 选项C: A+B组合 — 问题批次暂停，其余加强品控             │
   │   预计成本: 100万    见效周期: 1-2月                   │
   │   风险: 执行复杂度高，需要精确识别问题批次               │
   └─────────────────────────────────────────────────────┘

3. 战略对齐检查
   目标: "FY2026 营收增长 30%"
   当前进度: 22%（目标 25%）
   影响评估: 选项B将使Q2缺口扩大到 8%，需要其他产品线补位

4. → CEO 做出决策 → 记录决策日志 → 跟踪执行效果
```

#### 8.5 战略追踪（Strategy Tracker）

**从战略到数据的穿透**，让每个人的日常工作都能看到和战略的关系：

```yaml
# config/decision/strategy.yaml
strategy:
  vision: "成为行业领先的智能化企业"
  fiscal_year: FY2026

  objectives:
    - id: obj-revenue
      name: 营收增长
      target: "同比增长 30%"
      key_results:
        - id: kr-1
          name: Q1 达成年度目标 25%
          metric: revenue
          target_value: 25000000
          current_value: 22000000   # 由数据采集自动更新
          status: at_risk           # 自动判定：on_track / at_risk / off_track
        - id: kr-2
          name: 新客户获取 200 家
          metric: new_customers
          target_value: 200
          current_value: 156
          status: on_track

    - id: obj-efficiency
      name: 运营效率提升
      target: "人效提升 20%"
      key_results:
        - id: kr-3
          name: 人均产出提升至 50 万/年
          metric: employee_efficiency
          target_value: 500000
          current_value: 420000
          status: at_risk
```

**战略穿透闭环**：
```
战略目标: "营收增长 30%"
    │
    ├── KR: Q1 达成 25% ← 指标: revenue ← 数据: Finance+CRM 自动采集
    │     │
    │     └── 当前 22% → 状态: at_risk → 洞察: "华东区拖后腿"
    │                                      → 决策: CEO 选择方案C
    │                                      → 执行: Agent 跟踪整改进度
    │                                      → 复盘: 2周后退货率降至 4%
    │
    └── KR: 新客 200 家 ← 指标: new_customers ← 数据: CRM 自动采集
          │
          └── 当前 156 → 状态: on_track → 预测: 按趋势可达 210
```

#### 8.6 决策日志（Decision Journal）

每个重要决策留下完整记录，支持未来复盘和组织学习：

```typescript
interface DecisionRecord {
  id: string;
  timestamp: string;
  deciderId: string;               // 决策者
  deciderRole: string;             // 角色
  context: {
    question: string;              // 决策问题
    background: string;            // 背景描述
    insights: Insight[];           // 相关洞察
    dataSnapshot: MetricSnapshot[];// 决策时的数据快照
  };
  options: {
    id: string;
    description: string;
    pros: string[];
    cons: string[];
    estimatedImpact: string;
  }[];
  decision: {
    selectedOption: string;
    rationale: string;             // 决策理由
    expectedOutcome: string;       // 预期结果
    reviewDate: string;            // 复盘日期
  };
  tracking: {
    status: 'pending' | 'executing' | 'reviewing' | 'closed';
    actualOutcome?: string;        // 实际结果
    lessonsLearned?: string;       // 经验教训 → 自动同步到组织记忆
  };
  strategyAlignment?: {
    objectiveId: string;
    impact: string;
  };
}
```

**决策日志 → 组织记忆闭环**：
- 决策完成复盘后，经验教训自动沉淀到 `org-memory/decisions/`
- 未来遇到类似场景时，Agent 自动引用历史决策："上次类似情况，CEO 选择了方案C，效果是..."

#### 8.7 与其他模块的联动

```
                    ┌──────────────┐
                    │  战略目标     │
                    │  OKR / KPI   │
                    └──────┬───────┘
                           │ 对齐
              ┌────────────┼────────────┐
              ▼            ▼            ▼
         ┌────────┐  ┌────────┐  ┌────────┐
         │指标体系 │  │洞察引擎 │  │决策支持 │
         └───┬────┘  └───┬────┘  └───┬────┘
             │           │           │
    ┌────────┴───┐  ┌───┴────┐  ┌──┴──────┐
    ▼            ▼  ▼        ▼  ▼         ▼
 数据采集    主动智能  角色画像  组织记忆  决策日志
 (MCP Hub)  (预警)   (推送给   (历史    (留痕
             ↑       对的人)   类比)    复盘)
             │
        合规引擎
        (数据访问
         权限控制)
```

| 联动模块 | 关系 |
|---------|------|
| **MCP Hub** | 数据采集器通过 MCP 工具从各业务系统拉取原始数据 |
| **主动智能** | 洞察引擎发现异常 → 触发主动预警推送给相关决策者 |
| **角色画像** | CEO 看全局，财务总监看财务线，销售VP看销售线 — 同一套数据按角色呈现 |
| **合规引擎** | 数据采集和指标访问受合规管控（如薪酬指标仅 HR+CFO 可见） |
| **组织记忆** | 决策复盘 → 经验教训沉淀；最佳实践 → 决策参考 |
| **Skill 系统** | "月度经营分析"等 Skill 可调用决策引擎的指标和洞察 |

### 9. 组织记忆（Org Memory）

**核心理念**：个人来来走走，组织的知识永远不丢。新人第一天就能获得老员工积累多年的经验。

#### 个人记忆 vs 组织记忆

| | 个人记忆 (memory/) | 组织记忆 (org-memory/) |
|---|---|---|
| **范围** | 一个人的对话、偏好、习惯 | 全员共享的知识和经验 |
| **写入** | Agent 自动记录 | 人工沉淀 + Agent 提炼 |
| **访问** | 仅本人 | 按角色权限 |
| **生命周期** | 随个人 | 随组织（永久） |
| **示例** | "我习惯周三交周报" | "Q4 结算流程变更说明" |

#### 四类组织记忆

**制度规章 (policies/)**：
- 公司制度、操作规范、合规要求
- 与合规引擎联动：Agent 执行操作时自动引用相关制度
- 示例：《差旅报销管理办法》《合同审批流程规范》

**决策记录 (decisions/)**：
- 重要决策的背景、备选方案、最终选择、原因
- Agent 遇到类似场景时可参考历史决策
- 示例："2025Q3 选择供应商B而非A的原因是..."

**经验教训 (lessons/)**：
- 项目复盘、事故总结、成功模式
- 新人上手时 Agent 自动推送相关经验
- 示例："上次ERP迁移的三个坑"、"大客户谈判的五个要点"

**最佳实践 (knowledge/)**：
- 各岗位的工作方法论、模板、标准流程
- Agent 在执行任务时参考最佳实践
- 示例："季度财务结算 checklist"、"客户成功标准服务流程"

#### 组织记忆的写入机制

```
人工写入 ─── 管理员/专家主动沉淀知识
     │
Agent 提炼 ── 对话中发现有价值的信息，建议沉淀
     │        "您刚才分享的项目复盘很有价值，是否保存到组织记忆？"
     │
自动整合 ─── 主动智能引擎定期汇总：
              - 高频问题 → 自动生成 FAQ
              - 反复出现的流程 → 提炼为最佳实践
              - 决策模式 → 记录决策模板
```

### 10. 个人记忆系统

- **短期记忆**: 内存中的对话上下文 + 当前任务状态
- **长期记忆**: 文件存储在 `data/memory/`
  - `conversations/` - 对话摘要 (markdown)
  - `facts/` - 用户偏好和事实 (JSON)
  - `tasks/` - 任务历史 (JSON)
- **记忆整合**: 对话结束时自动将短期记忆摘要为长期记忆
- **检索**: 基于关键词 + 嵌入向量的混合搜索

### 11. 个人知识库

- 支持 markdown、文本、代码文件的导入
- 使用 MiniMax 嵌入 API 生成向量
- 文件存储 + JSON 索引（轻量级，无需外部数据库）
- CRUD API + 语义搜索

### 12. 内置工具

| 工具 | 功能 | 权限 | 来源 |
|------|------|------|------|
| file_read | 读取文件 | 始终允许 | 内置 |
| file_write | 写入文件 | allowFileWrite | 内置 |
| file_search | Glob 搜索文件 | 始终允许 | 内置 |
| shell_exec | 执行 Shell 命令 | allowShellExec | 内置 |
| web_fetch | HTTP 请求 | allowNetwork | 内置 |
| browser_navigate | 浏览器导航 | allowBrowser | 内置 |
| browser_click | 点击元素 | allowBrowser | 内置 |
| browser_type | 输入文本 | allowBrowser | 内置 |
| browser_screenshot | 截图 | allowBrowser | 内置 |
| memory_read | 读取记忆 | 始终允许 | 内置 |
| memory_write | 写入记忆 | 始终允许 | 内置 |
| knowledge_search | 搜索知识库 | 始终允许 | 内置 |
| mcp_* | MCP Server 动态注入的工具 | 按 Server 配置 | MCP Hub |

> 注：MCP 工具由各 MCP Server 动态注册，工具名以 Server ID 为前缀（如 `feishu_send_msg`、`db_query`），权限按 Server 配置的 `permissions` 和 `requireApproval` 控制。

## 实现阶段

> 阶段划分逻辑：先让 Agent 能跑（Phase 1-2），再连上企业系统（Phase 3），然后让它懂角色和规矩（Phase 4-5），接着让它主动干活（Phase 6），最后覆盖全部业务系统和 UI（Phase 7-10）。

### Phase 1: 基础框架 ← 首先实现
**目标**：Agent 能对话

1. 安装 bun + node
2. 初始化 monorepo（package.json, turbo.json, tsconfig）
3. 创建 `packages/shared` 类型定义
4. 创建 `packages/agent-core` Model Router（MiniMax + Claude provider）
5. 实现基础 Chat Completion（能对话）
6. 创建 `packages/server` Hono 服务，提供 `/api/chat` 端点 + SSE 流式响应

### Phase 2: 工具系统
**目标**：Agent 能动手

1. 实现 Tool Registry + Tool Executor + 权限系统
2. 实现内置工具：filesystem, shell, web-fetch
3. Agent tool loop（模型调用工具 → 执行 → 回传结果）

### Phase 3: MCP Hub + 基础连接器
**目标**：Agent 能连通企业系统

1. MCP Hub 核心：Client (JSON-RPC)、Registry、Lifecycle Manager
2. 配置系统：加载 `config/mcp-servers/*.json`，支持环境变量引用
3. Aggregator + Router：汇总所有 MCP Server 的工具，路由 tool_call
4. Auth Gateway：凭证加密存储 + OAuth Token 自动刷新
5. Health Monitor：心跳检测 + 自动重连 + 降级策略
6. Rate Limiter + Audit Logger：限流保护 + 合规审计
7. 实现 2 个基础 MCP Server：`database`（MySQL/PostgreSQL）+ `http-api`（通用 REST 代理）
8. 将 MCP 工具注入 Agent 工具注册表
9. Server API 路由 `/api/mcp/*`

### Phase 4: 角色画像 + 合规引擎
**目标**：Agent 知道"为谁服务"和"什么不能做"— 这是企业级的门槛

1. 角色画像系统：角色定义 (YAML)、注册表、上下文注入
2. 角色权限矩阵：角色 ↔ MCP Server/工具/技能 的映射
3. 创建 7 个内置角色模板（CEO、HR、财务、法务、销售、运营、工程师）
4. 合规引擎 Pre-Hook：规则 DSL 解析器、评估器、执行前拦截（allow/deny/approval/modify）
5. 合规引擎 Post-Run Hook：脱敏器、异常检测、通知联动、回滚补偿
6. 合规规则配置：财务/法务/人事/通用 四套规则（均支持 pre + post 两阶段）
7. 审批流集成：Pre-Hook 发起审批 → 通过后恢复执行 → Post-Hook 记录结果
8. 全链路审计轨迹：Pre 判定 → 执行过程 → Post 处理，完整记录

### Phase 5: 组织记忆 + 个人记忆
**目标**：知识不丢失，新人秒变老兵

1. 组织记忆：制度规章、决策记录、经验教训、最佳实践（CRUD + 语义搜索）
2. 角色 ↔ 组织记忆访问控制（角色画像中声明可访问范围）
3. 个人短期记忆（内存对话上下文）
4. 个人长期记忆（文件读写 + 摘要整合）
5. 个人知识库文档导入 + 索引 + 语义搜索
6. Agent 自动提炼机制："这个信息有组织价值，建议沉淀到组织记忆"

### Phase 6: 主动智能
**目标**：Agent 不等人问，主动发现问题和机会

1. 定时任务调度器（cron 表达式，YAML 配置）
2. 事件触发器（监听 MCP 数据变化，条件匹配后执行 Skill）
3. 阈值监控器（定期查询指标，超限自动预警）
4. 智能摘要（每日/每周自动为各角色生成工作摘要）
5. 主动任务 ↔ 角色画像联动（不同角色收到不同的主动推送）
6. 主动任务 ↔ 合规引擎联动（主动执行的操作同样受合规管控）

### Phase 6.5: 决策智能
**目标**：数据持续运营，支撑管理决策，追踪战略落地

1. 数据采集器：按 cron 定期通过 MCP 从各系统拉取经营数据
2. 指标体系：KPI 树定义、指标计算、同环比、基线管理
3. 洞察引擎：趋势分析、异常检测、归因分析、关联发现
4. 决策支持：方案生成、风险评估、历史类比、情景推演
5. 战略追踪：OKR/KPI 定义 → 指标 → 数据自动穿透对齐
6. 决策日志：背景→选项→决策→执行→复盘→沉淀到组织记忆
7. 智能报告生成：日报/周报/月度经营分析/专题报告

### Phase 7: Skill 系统 + 管理器
**目标**：可复用的业务流程模板

1. SKILL.md 解析器（gray-matter 解析 YAML frontmatter）
2. Skill 加载器 + 注册表（扫描 built-in / installed / custom 三目录）
3. 创建 4 个内置技能 + 一批企业级技能（入职流程、合同管理、经营分析等）
4. Skill 执行引擎（注入 system prompt + 执行脚本）
5. Skill Manager：创建向导、CRUD、启用/禁用、格式校验、安全审查
6. 打包/导入功能（.skill.tar.gz 格式）
7. Skill 可声明 MCP 工具依赖 + 角色可见性 + 合规规则引用

### Phase 7.5: Skill Marketplace
**目标**：技能共享与优胜劣汰

1. 市场数据模型 + 本地缓存（初期用 JSON 文件模拟远程 registry）
2. 搜索、浏览、分类过滤
3. 下载安装到 `skills/installed/` + 依赖解析
4. 发布流程：校验 → 打包 → 上传 → 自动审核
5. 评分评价系统 + 使用统计上报
6. 排名算法 + 自动下架机制

### Phase 8: 企业业务系统 MCP Servers
**目标**：打通人财法 CRM ERP 全部数字化系统

1. **HRM Server** + 首个 Adapter（对接实际人事系统）
2. **Finance Server** + 首个 Adapter（对接实际财务系统）
3. **Legal Server** + 首个 Adapter（对接实际法务/合同系统）
4. **CRM Server** + 首个 Adapter（对接实际 CRM）
5. **ERP Server** + 首个 Adapter（对接实际 ERP）
6. **BI Server**（对接报表/仪表盘系统）
7. 飞书 / 企业微信 MCP Server（对接实际协作平台）
8. **MCP Server 开发 SDK** + 文档（让 IT 团队快速开发自定义 Adapter）

### Phase 9: 浏览器自动化
**目标**：覆盖无 API 的遗留系统

1. Playwright 集成
2. browser 工具族实现
3. 页面分析 + 截图
4. 用浏览器自动化操作无 API 的老旧企业系统（兜底方案）

### Phase 10: Web UI
**目标**：全员可用的 AI 工作台

1. Next.js 应用 + shadcn/ui
2. **聊天界面**（SSE 流式）— 每个角色登录后看到自己的专属 Agent
3. **决策驾驶舱**：经营指标仪表盘、OKR/战略进度看板、洞察时间线、决策日志
4. **MCP Dashboard**：Server 连接状态、工具列表、凭证管理、健康监控
5. **合规中心**：规则管理、待审批队列、审计轨迹查看
6. **主动任务面板**：定时任务列表、触发器状态、预警历史
7. **组织记忆管理**：知识库、决策记录、经验教训的 CRUD 和搜索
8. **技能管理页面**：列表、创建/编辑向导、启用/禁用
9. **技能市场页面**：搜索 + 分类 + 排行榜 + 安装/评价
10. **角色管理页面**：角色列表、权限矩阵、画像编辑
11. **系统设置**：模型配置、个人记忆、通知偏好
12. 侧边栏导航 + 角色切换

## 验证方式

每个 Phase 的验证标准对齐愿景目标：

| Phase | 验证场景 | 对应愿景 |
|-------|---------|---------|
| **1** | `curl /api/chat` 流式对话 | 基础能力 |
| **2** | Agent 通过对话自动读写文件、执行命令 | 基础能力 |
| **3** | Agent 调用 `db_query` 查询数据库并返回结果 | 连通系统 |
| **4** | Pre-Hook：财务角色看不到薪酬明细、报销超 5 万自动审批；Post-Hook：查询结果身份证自动脱敏、大额付款自动通知 CEO | **高合规** |
| **5** | 新人登录，Agent 自动推送该角色相关的制度和最佳实践 | **知识不丢** |
| **6** | 每周一 9:00 自动生成高管经营日报；预算超 90% 主动预警 | **主动智能** |
| **6.5** | 定期采集经营数据 → 自动计算 KPI → 发现"华东退货率异常" → 生成 3 个方案 + 风险评估 → CEO 决策 → 追踪结果 → 复盘沉淀 | **数据驱动决策** |
| **7** | 创建"入职全流程"技能 → 一句话触发 → 自动跑完 HRM+Legal+IT 全部环节 | **消灭流程** |
| **7.5** | 浏览市场 → 安装技能 → 评分 | 生态 |
| **8** | "这个客户的合同、应收款和最近工单" → Agent 跨 CRM+Legal+Finance 一次查齐 | **解放人** |
| **9** | Agent 通过浏览器操作无 API 的老旧系统 | 全覆盖 |
| **10** | CEO 登录 → 决策驾驶舱实时显示经营指标 + OKR 进度 + 洞察预警 → 点击洞察展开分析 → 做出决策并留痕 | **完整体验** |

## 关键依赖

```json
{
  "openai": "^4.80.0",
  "hono": "^4.7.0",
  "gray-matter": "^4.0.3",
  "zod": "^3.24.0",
  "playwright": "^1.50.0",
  "nanoid": "^5.0.0",
  "next": "^15.0.0",
  "tailwindcss": "^4.0.0",
  "turbo": "^2.4.0",
  "@modelcontextprotocol/sdk": "^1.0.0"
}
```

> `@modelcontextprotocol/sdk` 是 Anthropic 官方 MCP TypeScript SDK，提供 Client/Server 基础类、JSON-RPC 传输层（stdio/SSE）、类型定义。我们的 MCP Hub 基于此 SDK 构建，避免重复造轮子。

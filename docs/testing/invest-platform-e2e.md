# invest-platform MCP 化 — 端到端测试用例

> 前置条件：
> 1. invest-platform 运行中 (`localhost:3000`)
> 2. `.env` 已配置：
>    ```
>    INVEST_API_URL=http://localhost:3000/api
>    INVEST_USER_EMAIL=admin@invest.com
>    INVEST_USER_PASSWORD=admin123
>    ```
> 3. Synapse 后端启动：`bun run dev --filter @synapse/server`
> 4. Synapse 前端启动：`bun run dev --filter @synapse/web`
> 5. 浏览器打开 `http://localhost:19300`

---

## TC-1: MCP 服务器列表展示

**步骤**：
1. 打开 http://localhost:19300/mcp
2. 查看"服务器"标签页

**预期**：
- [ ] 表格中出现"投资管理平台"行
- [ ] 状态列显示绿色"已连接"徽章
- [ ] 工具数列显示 `17`
- [ ] 操作列有"重启"和"删除"按钮
- [ ] 右上角有"添加服务器"按钮

---

## TC-2: MCP 工具列表展示

**步骤**：
1. 在 /mcp 页面点击"工具"标签页

**预期**：
- [ ] 列表中出现 17 个 `invest-platform_invest_*` 工具
- [ ] 每个工具的"所属服务器"列显示 `invest-platform`
- [ ] 以下 4 个写工具权限列显示"拒绝"（需审批）：
  - `invest-platform_invest_create_deal`
  - `invest-platform_invest_advance_deal`
  - `invest-platform_invest_add_valuation`
  - `invest-platform_invest_create_capital_call`
- [ ] 其余 13 个只读工具权限列显示"允许"

---

## TC-3: 动态添加服务器

**步骤**：
1. 在 /mcp 页面点击"添加服务器"
2. 填写表单：
   - ID: `test-echo`
   - 名称: `测试Echo`
   - 命令: `echo`
   - 参数: `hello`
   - 启用: 开
   - 自动启动: 关
3. 点击"确认"

**预期**：
- [ ] 弹窗关闭
- [ ] 服务器列表刷新，出现"测试Echo"行
- [ ] 状态显示 `registered`（因 autoStart=false）
- [ ] 验证完毕后点击该行"删除"按钮，确认删除
- [ ] 列表刷新，"测试Echo"消失

---

## TC-4: 服务器重启

**步骤**：
1. 在 /mcp 服务器列表找到"投资管理平台"
2. 点击"重启"按钮

**预期**：
- [ ] 按钮显示"重启中..."并转圈
- [ ] 几秒后状态恢复为"已连接"
- [ ] 工具数仍为 `17`

---

## TC-5: API 直接验证

**步骤**：
```bash
# 5a: 服务器列表
curl -s --noproxy localhost http://localhost:19301/api/mcp/servers | python3 -m json.tool

# 5b: 工具列表
curl -s --noproxy localhost http://localhost:19301/api/mcp/tools | python3 -m json.tool

# 5c: 角色列表
curl -s --noproxy localhost http://localhost:19301/api/personas | python3 -m json.tool
```

**预期**：
- [ ] 5a: `servers` 数组包含 `id: "invest-platform"`, `status: "connected"`, `tools` 数组长度 17
- [ ] 5b: `tools` 数组包含 17 个 `invest-platform_invest_*` 条目，每条有 `server: "invest-platform"`
- [ ] 5c: 返回的角色列表包含 `id: "investment-manager"` 和 `id: "ceo"`
- [ ] `ceo` 角色的 `allowed_tools` 包含 `invest-platform_invest_dashboard` 等 13 个只读工具
- [ ] `investment-manager` 角色的 `allowed_tools` 包含全部 17 个投资工具

---

## TC-6: CEO 角色对话 — 投资概览

**步骤**：
1. 打开 http://localhost:19300
2. 选择角色"CEO 助理"
3. 输入: `帮我看看目前的投资管线情况`

**预期**：
- [ ] Agent 调用 `invest-platform_invest_deal_kanban` 工具（可在审计日志中确认）
- [ ] 回复包含真实数据：
  - INVESTMENT_COMMITTEE 阶段有"AI科技公司"（估值 5 亿）
  - 其他阶段暂无项目
- [ ] 回复格式清晰，包含阶段分组

---

## TC-7: CEO 角色对话 — 仪表盘

**步骤**：
1. 继续上一对话，输入: `给我看投资仪表盘的关键数据`

**预期**：
- [ ] Agent 调用 `invest-platform_invest_dashboard`
- [ ] 回复包含：
  - 基金数: 1
  - 项目数: 1
  - 基金总规模: 1 亿
  - 总市值: 19 万
  - 总成本: 18 万
  - 盈亏: 1 万

---

## TC-8: 投资总监角色对话 — 基金详情

**步骤**：
1. 新建对话，选择角色"投资总监助理"
2. 输入: `查看测试一号基金的详情和催缴情况`

**预期**：
- [ ] Agent 调用 `invest-platform_invest_get_fund`（或先 list_funds 再 get_fund）
- [ ] 回复包含：
  - 基金名: 测试一号基金
  - 规模: 1 亿 CNY
  - 状态: INVESTING
  - 催缴记录: 华夏资本 2 笔（1000 万 + 2000 万），均已缴付
  - 在管项目: AI科技公司

---

## TC-9: 投资总监角色对话 — LP 信息

**步骤**：
1. 继续上一对话，输入: `查看所有 LP 的出资情况`

**预期**：
- [ ] Agent 调用 `invest-platform_invest_list_lps`
- [ ] 回复包含 LP 列表（至少华夏资本）
- [ ] 包含承诺金额、已缴金额等

---

## TC-10: Skill 执行 — 投资分析

**步骤**：
1. 投资总监角色对话中输入: `执行投资分析，重点看全景概览`
   （或通过 Skill 页面手动执行 investment-analysis，参数 focus=overview）

**预期**：
- [ ] Agent 识别并执行 investment-analysis Skill
- [ ] 依次调用多个工具：invest_dashboard, invest_deal_kanban, invest_list_portfolios, invest_todo_items
- [ ] 生成结构化报告，包含：
  - 关键指标仪表盘
  - 管线分布
  - 组合快照
  - 待办事项

---

## TC-11: Skill 执行 — 项目尽调

**步骤**：
1. 输入: `对 AI 科技公司做一个综合尽调分析`（或指定 deal-id=1）

**预期**：
- [ ] Agent 执行 deal-review Skill
- [ ] 调用 invest_get_deal(dealId=1)
- [ ] 生成项目评估报告，包含项目概要、估值分析、阶段评估

---

## TC-12: Skill 执行 — LP 报告

**步骤**：
1. 输入: `生成 LP 出资汇总报告`

**预期**：
- [ ] Agent 执行 lp-report Skill
- [ ] 调用 invest_list_lps + invest_list_funds + invest_todo_items
- [ ] 生成 LP 汇总报告

---

## TC-13: 主动智能 — 投资日报

**步骤**：
```bash
curl -s --noproxy localhost -X POST http://localhost:19301/api/proactive/actions/daily_investment_summary/execute | python3 -m json.tool
```

**预期**：
- [ ] 返回成功状态
- [ ] 生成的内容包含投资概况、管线动态、待办事项、组合快照四个板块
- [ ] 数据来自真实 API（非 mock）

---

## TC-14: 主动智能 — 催缴提醒

**步骤**：
```bash
curl -s --noproxy localhost -X POST http://localhost:19301/api/proactive/actions/capital_call_reminder/execute | python3 -m json.tool
```

**预期**：
- [ ] 返回成功状态
- [ ] 生成催缴相关报告

---

## TC-15: 审计日志

**步骤**：
1. 在 /mcp 页面点击"审计日志"标签
2. 或执行：
   ```bash
   curl -s --noproxy localhost 'http://localhost:19301/api/mcp/audit?serverId=invest-platform' | python3 -m json.tool
   ```

**预期**：
- [ ] 显示之前对话中所有 invest_* 工具调用记录
- [ ] 每条记录包含：时间、服务器(invest-platform)、操作(tool_call)、结果(成功)

---

## TC-16: 合规规则验证（写操作审批）

**步骤**：
1. 投资总监角色对话中输入: `帮我在测试一号基金下创建一个新项目，名称叫"新能源公司"，行业是新能源`

**预期**：
- [ ] Agent 尝试调用 `invest-platform_invest_create_deal`
- [ ] 合规引擎拦截，触发审批流程（因为该工具在 requireApproval 列表中）
- [ ] 用户需要确认后才能执行

---

## TC-17: 组织记忆验证

**步骤**：
1. 投资总监角色对话中输入: `我们的投资决策制度是怎样的？`

**预期**：
- [ ] Agent 调用 knowledge_search 或 memory_read
- [ ] 回复内容引用组织记忆中的"投资决策制度"：
  - 六阶段流程
  - 审批权限（投委会/CEO 阶段需 CEO 审批）
  - 金额分级（500 万/2000 万分界线）

---

## TC-18: 决策指标验证

**步骤**：
```bash
curl -s --noproxy localhost http://localhost:19301/api/decision/metrics | python3 -m json.tool
```

**预期**：
- [ ] 返回的 metrics 数组包含 4 个新增投资指标：
  - `deal_pipeline_value`（投资管线总值）
  - `fund_deployment_rate`（基金部署率）
  - `portfolio_irr`（组合 IRR）
  - `capital_call_completion`（催缴完成率）

---

## TC-19: 战略目标验证

**步骤**：
```bash
curl -s --noproxy localhost http://localhost:19301/api/decision/strategy | python3 -m json.tool
```

**预期**：
- [ ] objectives 数组包含 `id: "obj-investment"`
- [ ] 该目标包含 3 个 key_results：
  - 管线总值 5 亿
  - 组合 IRR 15%
  - 催缴完成率 90%

---

## 汇总

| 类别 | 用例 | 数量 |
|------|------|------|
| MCP 服务器管理 | TC-1 ~ TC-4 | 4 |
| API 直接验证 | TC-5 | 1 |
| CEO 对话 | TC-6 ~ TC-7 | 2 |
| 投资总监对话 | TC-8 ~ TC-9 | 2 |
| Skill 执行 | TC-10 ~ TC-12 | 3 |
| 主动智能 | TC-13 ~ TC-14 | 2 |
| 审计日志 | TC-15 | 1 |
| 合规审批 | TC-16 | 1 |
| 组织记忆 | TC-17 | 1 |
| 决策智能 | TC-18 ~ TC-19 | 2 |
| **总计** | | **19** |

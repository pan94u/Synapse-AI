---
name: investment-analysis
description: 综合投资分析助手，支持管线、组合、LP、风险等多维度投资分析。当用户提到投资分析、投资报告、管线分析、组合分析时使用。
allowed-tools:
  - invest-platform_invest_dashboard
  - invest-platform_invest_list_funds
  - invest-platform_invest_deal_kanban
  - invest-platform_invest_list_portfolios
  - invest-platform_invest_portfolio_metrics
  - invest-platform_invest_revenue_curve
  - invest-platform_invest_todo_items
  - memory_read
  - knowledge_search
metadata:
  author: synapse
  version: "1.0"
category: investment
status: active
parameters:
  - name: focus
    type: select
    description: 分析重点
    required: false
    default: overview
    options: [overview, pipeline, portfolio, lp, risk]
---

# 综合投资分析

## 任务说明

对投资管理平台的数据进行综合分析，生成结构化投资分析报告。根据 focus 参数选择分析维度。

## 执行步骤

1. 调用 invest_dashboard 获取全局概览数据（AUM、项目数、收益率等）
2. 根据 focus 参数，调用相应的数据接口：
   - **overview**: 调用所有关键接口，生成全景报告
   - **pipeline**: 调用 invest_deal_kanban，分析各阶段项目分布和推进情况
   - **portfolio**: 调用 invest_list_portfolios + invest_portfolio_metrics，分析组合表现
   - **lp**: 调用 invest_list_funds + invest_todo_items，分析 LP 出资和催缴情况
   - **risk**: 调用 invest_todo_items + invest_deal_kanban，识别逾期催缴和停滞项目
3. 从组织记忆中检索投资策略和政策文件
4. 综合分析并生成报告

## 输出格式

### 全景概览
- 关键指标仪表盘（AUM、活跃基金数、在管项目数、综合 IRR）
- 管线健康度（各阶段项目分布、转化率）
- 组合快照（总市值、盈亏、Top5 持仓）
- 催缴与出资（逾期催缴、未来 30 天到期）
- 待办事项与风险提示

### 管线分析
- 各阶段项目数量和金额分布
- 项目推进速度分析
- 瓶颈阶段识别
- 转化率计算

### 组合分析
- 各组合 IRR/MOIC 对比
- 盈亏分布
- 行业/地域集中度
- 退出回顾

### LP 分析
- LP 类型分布和承诺总额
- 催缴完成率
- 分配情况汇总

### 风险分析
- 逾期催缴清单
- 停滞项目（>30 天无推进）
- 集中度风险
- 估值偏离预警

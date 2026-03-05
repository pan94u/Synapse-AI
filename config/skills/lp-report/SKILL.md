---
name: lp-report
description: LP 关系与出资报告助手，生成 LP 出资情况和关系管理报告。当用户提到 LP 报告、出资报告、LP 分析、催缴报告时使用。
allowed-tools:
  - invest-platform_invest_list_lps
  - invest-platform_invest_get_lp
  - invest-platform_invest_list_funds
  - invest-platform_invest_get_fund
  - invest-platform_invest_todo_items
  - memory_read
  - knowledge_search
metadata:
  author: synapse
  version: "1.0"
category: investment
status: active
parameters:
  - name: lp-id
    type: number
    description: LP ID（不填则生成全部 LP 汇总）
    required: false
  - name: report-type
    type: select
    description: 报告类型
    required: false
    default: summary
    options: [summary, capital-calls, distributions]
---

# LP 关系与出资报告

## 任务说明

生成 LP（有限合伙人）相关的出资、催缴和分配报告。支持单个 LP 详情和全部 LP 汇总两种模式。

## 执行步骤

1. 如指定 lp-id，调用 invest_get_lp 获取单个 LP 详情及分配记录
2. 如未指定 lp-id，调用 invest_list_lps 获取全部 LP 概览
3. 调用 invest_list_funds 获取基金列表，关联 LP 参投信息
4. 调用 invest_todo_items 获取催缴相关待办
5. 从组织记忆中检索 LP 管理政策
6. 根据 report-type 生成对应报告

## 报告类型

### 汇总报告 (summary)
- LP 总览（数量、总承诺、总已缴、总分配）
- LP 类型分布（机构/个人/母基金/政府引导基金）
- Top LP 排名（按承诺金额）
- 关系健康度评估

### 催缴报告 (capital-calls)
- 逾期催缴清单（LP 名称、基金、金额、逾期天数）
- 本周到期催缴
- 未来 30 天催缴预告
- 催缴完成率趋势
- 跟进建议

### 分配报告 (distributions)
- 各基金分配汇总
- LP 分配明细
- DPI（Distributions to Paid-In）计算
- 分配时间线

## 输出格式

- 报告摘要
- 关键数据表格
- 趋势分析
- 行动建议

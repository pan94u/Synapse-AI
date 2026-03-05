---
name: deal-review
description: 项目尽调分析助手，对指定投资项目进行全面评估。当用户提到项目审查、尽职调查、项目评估、deal review 时使用。
allowed-tools:
  - invest-platform_invest_get_deal
  - invest-platform_invest_get_fund
  - invest-platform_invest_list_deals
  - invest-platform_invest_deal_kanban
  - memory_read
  - knowledge_search
metadata:
  author: synapse
  version: "1.0"
category: investment
status: active
parameters:
  - name: deal-id
    type: number
    description: 项目 ID
    required: true
  - name: review-type
    type: select
    description: 审查类型
    required: false
    default: comprehensive
    options: [comprehensive, financial, strategic, risk]
---

# 项目尽调分析

## 任务说明

对指定的投资项目进行深入的尽职调查分析，生成结构化评估报告。

## 执行步骤

1. 调用 invest_get_deal 获取项目详情（时间线、估值历史、文档、当前阶段）
2. 调用 invest_get_fund 获取所属基金信息
3. 调用 invest_deal_kanban 了解同阶段其他项目的对比情况
4. 从组织记忆中检索项目评估标准和投资策略
5. 根据 review-type 生成对应维度的分析报告

## 审查维度

### 综合审查 (comprehensive)
- 项目基本信息与历史
- 财务指标分析
- 战略匹配度评估
- 风险识别与建议

### 财务审查 (financial)
- 估值历史与趋势
- 估值合理性分析
- 投资回报预测
- 与同行业可比公司对比

### 战略审查 (strategic)
- 行业趋势与竞争格局
- 与基金投资策略的匹配度
- 协同效应分析
- 退出路径评估

### 风险审查 (risk)
- 关键风险因素识别
- 尽调发现问题汇总
- 阶段推进风险
- 缓释措施建议

## 输出格式

- 项目概要卡片
- 审查发现（按维度分类）
- 关键指标表格
- 建议与行动项
- 综合评级（推荐/谨慎/不推荐）

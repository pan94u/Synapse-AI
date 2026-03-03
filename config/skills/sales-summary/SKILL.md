---
name: sales-summary
description: 生成销售分析报告，包含业绩、趋势、客户分布等。当用户提到销售分析、销售报告、业绩汇总时使用。
allowed-tools:
  - database_db_query
  - database_db_list_tables
  - memory_read
metadata:
  author: synapse
  version: "1.0"
category: data
status: active
parameters:
  - name: period
    type: string
    description: 分析周期 (如 2026-Q1, 2026-02)
    required: false
  - name: region
    type: string
    description: 区域范围
    required: false
---

# 销售分析报告

## 任务说明

生成指定周期和区域的销售分析报告。

## 执行步骤

1. 查询销售数据（订单、金额、客户数）
2. 计算关键销售指标（成交率、客单价、增长率）
3. 按产品/区域/客户维度分析
4. 生成趋势分析和预测

## 输出格式

- 销售指标汇总表
- 趋势图描述
- 产品/区域/客户分析
- 重点关注事项

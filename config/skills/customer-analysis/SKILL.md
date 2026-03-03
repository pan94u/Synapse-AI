---
name: customer-analysis
description: 客户画像与行为分析，支持客户分群和价值评估。当用户提到客户分析、客户画像、用户行为时使用。
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
  - name: customer-id
    type: string
    description: 客户 ID（可选，不填则做整体分析）
    required: false
  - name: analysis-type
    type: select
    description: 分析类型
    required: false
    default: overview
    options: [overview, segmentation, lifetime-value, churn-risk]
---

# 客户分析

## 任务说明

对客户数据进行深入分析，生成客户画像、分群结果或价值评估。

## 执行步骤

1. 查询客户基础数据和交易记录
2. 根据分析类型执行相应算法
3. 生成客户画像或分群报告
4. 提出运营建议

## 输出格式

- 客户概览/画像
- 分群结果或价值评估
- 行为趋势
- 运营建议

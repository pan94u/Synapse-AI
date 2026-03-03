---
name: data-analysis
description: 通用数据分析助手，支持自由查询和多维分析。当用户提到数据分析、数据查询、统计分析时使用。
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
  - name: query
    type: string
    description: 分析需求描述
    required: true
  - name: data-source
    type: select
    description: 数据来源
    required: false
    default: database
    options: [database, memory, all]
---

# 数据分析助手

## 任务说明

根据用户描述的分析需求，查询数据源并进行多维分析。

## 执行步骤

1. 理解用户分析需求
2. 确定数据来源和查询策略
3. 执行数据查询
4. 进行统计分析和可视化描述
5. 输出分析报告

## 输出格式

- 数据摘要
- 分析结论
- 关键发现
- 建议措施

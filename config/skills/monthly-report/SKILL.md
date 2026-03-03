---
name: monthly-report
description: 基于数据库自动生成月度经营报告。当用户提到月报、经营分析、月度汇总时使用。
allowed-tools:
  - database_db_query
  - database_db_list_tables
  - memory_read
  - knowledge_search
metadata:
  author: synapse
  version: "1.0"
category: data
status: active
parameters:
  - name: report-month
    type: string
    description: 报告月份 (YYYY-MM)
    required: false
  - name: department
    type: select
    description: 部门范围
    required: false
    default: all
    options: [all, finance, sales, operations, hr]
---

# 月度经营报告

## 任务说明

生成指定月份的月度经营分析报告。

## 执行步骤

1. 查询数据库获取该月核心经营数据
2. 从组织记忆中检索相关决策和历史数据
3. 多维度分析（财务、销售、运营、人力）
4. 生成结构化 Markdown 报告

## 输出格式

报告应包含：
- 关键指标汇总表
- 各维度分析（含同比/环比）
- 风险预警
- 下月重点工作建议

## 示例

### 输入

```
report-month: 2026-02
department: all
```

### 输出

结构化 Markdown 报告，含各维度分析数据和建议。

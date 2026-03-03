---
name: contract-review
description: 合同审查助手，分析合同条款并提供法律建议。当用户提到合同审查、合同分析、法律审核时使用。
allowed-tools:
  - database_db_query
  - memory_read
  - knowledge_search
metadata:
  author: synapse
  version: "1.0"
category: writing
status: active
parameters:
  - name: contract-type
    type: select
    description: 合同类型
    required: false
    default: general
    options: [general, procurement, sales, employment, nda, service]
  - name: review-focus
    type: string
    description: 审查重点（可选）
    required: false
---

# 合同审查助手

## 任务说明

对合同文本进行系统化审查，识别风险条款并提供修改建议。

## 执行步骤

1. 检索知识库中的相关合同模板和审查标准
2. 分析合同核心条款（主体、标的、价格、期限、违约责任）
3. 识别风险条款和不利条款
4. 参照行业惯例和公司政策提供修改建议

## 审查要点

- 合同主体资质
- 权利义务对等性
- 违约责任合理性
- 争议解决机制
- 知识产权归属
- 保密条款范围
- 竞业限制条款

## 输出格式

- 合同概要
- 风险条款清单（含风险等级）
- 修改建议
- 总体评估意见

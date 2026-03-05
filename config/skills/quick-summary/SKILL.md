---
name: quick-summary
description: 快速生成内容摘要
allowed-tools:
  - memory_read
  - knowledge_search
metadata:
  author: synapse
  version: "0.1"
category: writing
status: active
parameters:
  - name: content
    type: string
    description: 需要摘要的内容
    required: true
---

# 快速摘要

帮用户快速总结一段内容的要点，生成简洁摘要。

1. 读取用户提供的内容
2. 提取关键信息
3. 输出摘要

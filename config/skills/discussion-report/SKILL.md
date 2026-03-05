---
name: discussion-report
description: 将讨论内容整理为结构化报告并生成文件。当用户提到讨论总结、会议纪要、对话报告、形成文件时使用。
allowed-tools:
  - memory_read
  - knowledge_search
  - file_write
metadata:
  author: synapse
  version: "1.0"
category: writing
status: active
parameters:
  - name: topic
    type: string
    description: 讨论主题或关键词
    required: true
  - name: format
    type: select
    description: 输出报告格式
    required: false
    default: markdown
    options: [markdown, structured, executive]
  - name: output-path
    type: string
    description: 报告输出文件路径（默认 data/reports/）
    required: false
---

# 讨论报告生成器

## 任务说明

根据用户指定的讨论主题，从记忆系统和知识库中检索相关讨论内容，整理为结构化报告，并将报告写入指定路径的 Markdown 文件。适用于会议纪要、项目讨论总结、决策复盘等场景。

## 执行步骤

1. **检索讨论内容** — 使用 `memory_read` 从个人记忆和组织记忆中检索与主题相关的讨论记录、决策和经验
2. **补充知识背景** — 使用 `knowledge_search` 从知识库中搜索相关文档，补充上下文
3. **分析与整理** — 按时间线梳理讨论脉络，提取关键观点、分歧点和共识
4. **生成报告** — 按选定格式生成结构化 Markdown 报告
5. **写入文件** — 使用 `file_write` 将报告保存到指定路径，默认为 `data/reports/{topic}-{date}.md`

## 输出格式

### Markdown 格式（默认）

```markdown
# {topic} 讨论报告

> 生成时间: {datetime}

## 背景概述
简述讨论的背景和目的。

## 讨论要点
### 要点 1: {标题}
- 观点摘要
- 支持依据

### 要点 2: {标题}
- 观点摘要
- 支持依据

## 关键决策
| 序号 | 决策内容 | 决策依据 | 负责人 |
|------|---------|---------|-------|
| 1    | ...     | ...     | ...   |

## 待办事项
- [ ] 事项 1 — 负责人 / 截止日期
- [ ] 事项 2 — 负责人 / 截止日期

## 附录
相关参考资料链接。
```

### Structured 格式

JSON 结构化输出，包含 summary、keyPoints、decisions、actionItems 四个字段。

### Executive 格式

精简的高管摘要，控制在 500 字以内，仅包含背景、结论和下一步行动。

## 异常处理

- 若未检索到相关讨论记录，提示用户补充主题关键词或手动输入讨论内容
- 若 `output-path` 目录不存在，自动创建
- 若文件已存在，追加时间戳后缀避免覆盖

## 示例

### 输入

```
topic: Skill 市场上下架规则
format: markdown
output-path: data/reports/
```

### 输出

生成文件 `data/reports/skill-marketplace-rules-2026-03-05.md`，包含完整的讨论报告。

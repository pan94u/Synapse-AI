---
name: code-review
description: 代码审查助手，分析代码质量、安全性和最佳实践。当用户提到代码审查、code review、代码检查时使用。
allowed-tools:
  - file_read
  - file_search
  - shell_exec
metadata:
  author: synapse
  version: "1.0"
category: development
status: active
parameters:
  - name: file-path
    type: string
    description: 要审查的文件或目录路径
    required: true
  - name: focus
    type: select
    description: 审查重点
    required: false
    default: general
    options: [general, security, performance, style]
---

# 代码审查

## 任务说明

对指定代码文件进行系统化审查，提供改进建议。

## 执行步骤

1. 读取目标文件内容
2. 分析代码结构和逻辑
3. 检查安全隐患（注入、XSS、敏感信息泄露等）
4. 评估代码质量（可读性、可维护性、测试覆盖）
5. 提出改进建议

## 审查维度

### 安全性
- SQL 注入
- XSS 攻击
- 敏感信息硬编码
- 权限检查

### 性能
- N+1 查询
- 不必要的循环
- 内存泄漏风险

### 代码质量
- 命名规范
- 函数复杂度
- 错误处理
- 类型安全

## 输出格式

- 文件概要
- 发现问题列表（含严重等级）
- 改进建议
- 总体评分

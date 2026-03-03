---
name: employee-onboarding
description: 入职流程检查和管理，确保新员工入职流程完整。当用户提到入职、新员工、onboarding 时使用。
allowed-tools:
  - database_db_query
  - memory_read
  - memory_write
metadata:
  author: synapse
  version: "1.0"
category: automation
status: active
parameters:
  - name: employee-name
    type: string
    description: 新员工姓名
    required: true
  - name: department
    type: string
    description: 入职部门
    required: true
  - name: start-date
    type: string
    description: 入职日期 (YYYY-MM-DD)
    required: false
---

# 入职流程检查

## 任务说明

检查新员工入职流程的完成状态，生成待办清单。

## 执行步骤

1. 查询该员工的入职记录
2. 检查必需流程完成状态（合同签署、系统开通、培训安排等）
3. 生成未完成项目清单
4. 记录检查结果到组织记忆

## 检查项

- [ ] 劳动合同签署
- [ ] 社保公积金办理
- [ ] 工位/设备分配
- [ ] 系统账号开通
- [ ] 入职培训安排
- [ ] 导师/Buddy 指定
- [ ] 部门介绍会

## 输出格式

- 入职进度概览
- 已完成项目
- 待办项目（含负责人和截止日期）
- 风险提示

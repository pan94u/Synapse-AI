---
name: system-diagnostics
description: 系统诊断工具，检查系统状态、性能和健康度。当用户提到系统诊断、系统检查、性能分析时使用。
allowed-tools:
  - shell_exec
  - database_db_query
  - web_fetch
metadata:
  author: synapse
  version: "1.0"
category: system
status: active
parameters:
  - name: check-type
    type: select
    description: 检查类型
    required: false
    default: full
    options: [full, database, api, disk, memory]
---

# 系统诊断

## 任务说明

执行系统健康检查，生成诊断报告。

## 执行步骤

1. 根据检查类型确定检查项
2. 执行系统命令获取状态信息
3. 查询数据库连接和性能指标
4. 检查 API 服务可用性
5. 汇总诊断结果

## 检查项

### 系统资源
- CPU 使用率
- 内存使用率
- 磁盘空间

### 数据库
- 连接状态
- 慢查询统计
- 表空间使用

### API 服务
- 响应时间
- 错误率
- 可用性

## 输出格式

- 系统状态概览（健康/警告/异常）
- 各检查项详细结果
- 异常项目说明
- 优化建议

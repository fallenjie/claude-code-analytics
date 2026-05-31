# Claude Code Analytics 产品需求文档（PRD）

## 1. 产品概述

### 产品名称

Claude Code Analytics

### 产品定位

帮助 Claude Code 用户了解：

* Token 消耗情况
* 成本使用情况
* Session 行为分析
* Agent 工作效率
* 项目维度统计

不仅仅是成本统计工具，而是 Claude Code 的可视化分析平台。

---

## 2. 产品目标

### 核心问题

Claude Code 用户经常面临以下问题：

* 不知道花了多少钱
* 不知道 Token 消耗在哪
* 不知道哪些任务最耗资源
* 不知道 Agent 是否在高效工作
* 无法评估长期使用成本

### 产品目标

通过数据分析帮助用户：

1. 了解 Claude Code 的真实使用情况
2. 控制 AI 使用成本
3. 优化 Agent 工作流程
4. 提高开发效率
5. 评估 AI Coding ROI

---

# 3. 用户画像

## 核心用户

### 独立开发者

特点：

* 高频使用 Claude Code
* 关注成本控制
* 关注开发效率

### AI Coding 重度用户

特点：

* 每天运行多个 Session
* 长时间任务较多
* 希望优化工作流

### OpenClaw / Hermes 用户

特点：

* 使用 Agent 编排
* 长任务执行频繁
* 关注 Agent 行为分析

### 小型开发团队

特点：

* 多项目管理
* 关注团队 AI 成本
* 需要可视化报表

---

# 4. MVP V1 功能需求

## 功能一：Usage Dashboard

### 功能描述

首页展示整体使用情况。

### 数据项

#### 今日数据

* Input Tokens
* Output Tokens
* Cost
* Session 数量

#### 最近7天

* 总 Token
* 总 Cost
* Session 数量

#### 最近30天

* Cost Trend
* Token Trend

### 示例

```text
Today

Input Token: 2.3M
Output Token: 1.7M
Cost: $8.13
Sessions: 27
```

---

## 功能二：Session 分析

### 功能描述

展示每个 Claude Code Session 的详细情况。

### Session 列表字段

* Session 名称
* 开始时间
* 持续时间
* Cost
* Token
* 修改文件数量
* Tool 调用数量

### 示例

```text
Session A

Duration: 2h13m
Cost: $1.24
Token: 320k
Files Modified: 24
Commands: 17
```

### Session 详情页

展示 Timeline：

```text
开始任务
↓
读取PRD
↓
创建文件
↓
修改代码
↓
测试
↓
完成
```

---

## 功能三：成本排行

### 功能描述

帮助用户快速找到最烧钱的任务。

### 展示内容

Top Cost Sessions

```text
1. Auth Refactor
$3.21

2. Payment Module
$2.11

3. Bug Fix
$1.88
```

### 价值

回答用户最关心的问题：

> 钱花在哪里了？

---

## 功能四：模型分析

### 功能描述

统计不同模型使用情况。

### 数据项

* Cost
* Token
* Session 数量

### 示例

```text
Claude Sonnet

Cost: $23
Token: 8.3M
Sessions: 32
```

### 后续扩展

支持：

* Claude
* GPT
* Gemini
* Qwen

统一分析。

---

## 功能五：Agent 行为统计

### 功能描述

分析 Claude Code 的工具使用行为。

### Tool Usage

```text
Read File: 1248
Write File: 582
Bash: 421
Search: 319
```

### 行为占比

```text
读取文件：45%
写代码：22%
搜索资料：18%
执行命令：15%
```

### 用户价值

帮助判断：

* Agent 是否在有效工作
* 是否出现无效循环
* Token 是否被浪费

---

## 功能六：项目分析

### 功能描述

统计项目维度的使用情况。

### 示例

```text
Project A

Cost: $12
Sessions: 22
```

```text
Project B

Cost: $31
Sessions: 58
```

### 用户价值

帮助用户了解：

* 哪个项目最耗 Token
* 哪个项目成本最高
* 项目 ROI 分析

---

# 5. MVP 不做的功能

以下功能暂不进入 V1：

## 不做

* 多 Agent 协同管理
* 自动恢复任务
* Prompt 优化
* Team 协作
* 云端同步
* 自动优化建议
* Agent 自动调度

目标：

聚焦数据分析能力。

---

# 6. 数据采集方案

## 方案一（推荐）

### 本地日志解析

解析 Claude Code 本地 Session 数据：

* Session
* Transcript
* Tool Calls
* Usage 信息

优点：

* 无侵入
* 易实现
* 用户接受度高

---

## 方案二

### CLI Hook

用户执行：

```bash
claude analytics enable
```

自动采集数据。

优点：

* 数据更完整

缺点：

* 实现复杂

---

## 方案三

### 手动上传

用户上传：

* Session JSON
* Transcript 文件

系统分析后生成报告。

优点：

* MVP 最快上线

缺点：

* 用户体验一般

---

# 7. 最小可行产品（3天版本）

## 功能范围

上传 Session 文件

↓

解析 JSON

↓

展示：

* Token
* Cost
* Duration
* Tool Usage

↓

生成图表

### 不做

* 登录
* 多项目
* 团队
* 云同步

### 目标

验证用户是否愿意使用。

---

# 8. V2 规划

## 成本趋势分析

展示：

* Daily Cost Trend
* Weekly Cost Trend
* Monthly Cost Trend

---

## Session 排行榜

统计：

* 最贵 Session
* 最长 Session
* 最大 Token Session

---

## 项目排行榜

统计：

* Cost Top Projects
* Token Top Projects

---

## AI 分析总结

示例：

```text
过去7天：

总成本增长 32%

主要消耗来自：

- Payment Refactor
- User Service

建议：

拆分大型任务以降低上下文成本。
```

---

# 9. V3 规划

## AI Coding 效率分析

统计：

* 平均任务时长
* 平均 Token 消耗
* 平均文件修改数量
* 平均工具调用数量

---

## 异常分析

例如：

```text
发现异常 Session：

原因：

反复读取同一文件
重复执行相同命令
Token 消耗异常高
```

---

## Session Replay

可视化展示：

```text
任务启动
↓
读取文件
↓
搜索资料
↓
生成代码
↓
测试
↓
完成
```

帮助用户理解 Agent 工作过程。

---

# 10. 商业模式

## Free

功能：

* 最近7天数据
* 基础 Dashboard
* 基础 Session 分析

---

## Pro

价格：

$9/月

功能：

* 最近90天数据
* 趋势分析
* 项目分析
* 导出报表
* AI 总结

---

## Team

价格：

$29/月

功能：

* 多项目管理
* 团队统计
* 成本分摊
* 高级报表

---

# 11. 核心竞争优势

大多数产品关注：

> 花了多少钱

Claude Code Analytics 更关注：

> Claude Code 到底有没有高效完成工作

核心差异化：

1. Session Replay
2. Agent 行为分析
3. AI Coding 效率分析
4. 项目级成本分析
5. 多模型统一分析

最终目标：

成为 Claude Code、OpenClaw、Hermes 用户的标准分析平台。

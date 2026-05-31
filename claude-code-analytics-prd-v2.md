# Claude Code Analytics 产品需求文档 v2

## 文档信息
- 版本：v2.0
- 更新日期：2026年5月31日
- 状态：初稿，待评审
- 负责人：PM Agent

---

## 1. 产品概述

### 1.1 产品背景
Claude Code 是 Anthropic 提供的命令行工具，帮助开发者使用 Claude 进行编程辅助。随着使用深入，用户面临以下痛点：
- 不知道每次会话消耗了多少 Token，产生多少成本
- 不清楚 Claude 接受了哪些工具调用，拒绝了什么
- 无法评估不同项目的效率差异
- 缺乏对 Agent 行为模式的可视化分析

### 1.2 核心价值主张
Claude Code Analytics 通过监听本地 ~/.claude 目录，实时解析使用数据，提供：
- **实时成本追踪**：每次会话、每个模型、每日/每周/每月的成本可视化
- **工具级效率分析**：精确到每个工具的接受率、拒绝原因、效率对比
- **轻量 DORA 关联**：结合项目目录结构，分析不同模块的 AI 使用效率
- **数据完全本地**：所有数据存储在本地，不上传任何信息

### 1.3 目标用户
- 深度使用 Claude Code 的开发者
- 需要控制 AI 使用成本的团队
- 需要分析 AI 工具使用效率的工程师

---

## 2. 产品功能详细设计

### 2.1 Usage Dashboard（使用仪表盘）

#### 2.1.1 功能概述
Usage Dashboard 是用户打开应用后的首页，展示整体使用情况的概览仪表盘。

#### 2.1.2 用户场景
- 用户首次打开应用，看到今日/本周/本月的使用概览
- 用户想快速了解 Claude Code 的整体使用情况，不需要深入分析
- 用户想对比不同时间段的用量变化

#### 2.1.3 页面布局
整体采用侧边栏固定 + 内容区自适应布局：
```
┌──────────┬───────────────────────────────────────────────┐
│  侧边栏   │              主内容区                          │
│  240px   │              flex-grow                        │
│          │                                               │
│ [Logo]   │  ┌─────────────────────────────────────────┐  │
│          │  │ 页面标题 + 操作按钮                       │  │
│ 导航菜单  │  ├─────────────────────────────────────────┤  │
│          │  │                                         │  │
│          │  │ 内容区域                                 │  │
│          │  │                                         │  │
│ [设置]   │  └─────────────────────────────────────────┘  │
└──────────┴───────────────────────────────────────────────┘
```

侧边栏包含：
- Logo/应用名称 Claude Code Analytics
- 导航菜单（带图标）：Dashboard / Sessions / Cost Analysis / Model Analysis / Agent Behavior / Projects
- 当前页面菜单项高亮显示
- 底部设置入口

主内容区：
- 顶部：页面标题 + 操作按钮
- 统计卡片区（4个卡片横排）：总成本 / 总Token / 会话数 / 工具使用率
- 成本趋势折线图（支持时间范围选择）
- 双图：模型使用分布饼图 + 工具使用TOP10条形图
- 最近会话列表（最近10条）

#### 2.1.4 统计卡片设计
每张卡片包含：
- **主指标值**：大字显示当前数值
- **对比增长率**：相比上一周期的百分比，带箭头指示
- **趋势迷你图**：最近7天的趋势小图

| 卡片 | 指标 | 计算方式 |
|------|------|---------|
| 总成本 | 美元金额（保留4位小数） | sum(input_tokens * input_price + output_tokens * output_price) |
| 总Token | 数量（自动单位换算） | sum(input_tokens + output_tokens)，自动换算K/M |
| 会话数 | 整数 | count(distinct session_id) |
| 工具使用 | 百分比 | sum(tools_accepted) / sum(tools_proposed) * 100% |

#### 2.1.5 成本趋势图详细设计
- **图表类型**：双轴折线图（左侧Y轴：成本，右侧Y轴：Token数量）
- **数据粒度**：按小时/日/周/月聚合，取决于时间范围选择
- **交互细节**：
  - 鼠标悬停显示 tooltip：具体时间点、成本、Token数量
  - 点击某个数据点，跳转到该时间点的详细会话列表
  - 支持拖拽选择时间范围（zoom in/out）
  - 支持图例点击隐藏/显示对应曲线
- **默认视图**：显示最近7天的数据
- **时间范围选择器**：今日/本周/本月/本年/自定义

#### 2.1.6 模型使用分布图
- **图表类型**：环形饼图（doughnut）
- **展示内容**：各模型的使用成本占比
- **交互细节**：
  - 鼠标悬停显示该模型的详细数据（成本、Token、占比）
  - 点击某个模型，跳转到 Model Analysis 页面并筛选该模型
  - 图例显示在图表右侧，带颜色标识

#### 2.1.7 工具使用TOP10
- **图表类型**：水平条形图
- **排序逻辑**：按调用次数降序
- **颜色编码**：接受率大于80%绿色，50-80%黄色，小于50%红色
- **交互细节**：点击某个工具，跳转到 Agent Behavior 页面并筛选该工具

#### 2.1.8 最近会话列表
- **列表字段**：时间、持续时长、模型、成本、Token数量、工具接受率
- **排序**：按时间倒序
- **分页**：每页20条，支持上滑加载更多
- **行交互**：点击某行，进入该会话的详情页
- **空状态**：显示引导文字"开始使用 Claude Code，即可在此看到您的使用数据"

#### 2.1.9 数据刷新策略
- **实时监听**：chokidar 监听 ~/.claude 目录变化，文件变更时自动解析并更新界面
- **轮询兜底**：每30秒全量扫描一次 ~/.claude 目录，防止遗漏
- **刷新提示**：数据更新时，卡片数值带淡入动画更新，不闪烁
- **手动刷新**：页面右上角提供刷新按钮，点击强制全量重新解析

---

### 2.2 Session 分析

#### 2.2.1 功能概述
Session 分析页面提供会话列表和会话详情两个层级的功能。

#### 2.2.2 Session 列表页

**用户场景**：
- 用户想回顾某天/某个时间段的会话记录
- 用户想按特定条件筛选会话（成本大于某个值、使用了特定模型等）

**筛选字段**：
| 字段 | 筛选项 |
|------|--------|
| 模型 | 全部 / claude-opus-4 / claude-sonnet-4 / claude-haiku |
| 成本范围 | 全部 / 小于0.5美元 / 0.5-2美元 / 2-5美元 / 大于5美元 / 自定义 |
| 工具接受率 | 全部 / 大于80% / 50-80% / 小于50% |
| 项目 | 全部 / 自动列出检测到的项目目录 |
| 搜索 | 按会话中的关键词搜索 |

**导出功能**：
- 导出格式：CSV / JSON
- 导出范围：当前筛选结果 / 全量
- 导出字段：用户可选需要导出的列

#### 2.2.3 Session 详情页

页面分为左右两栏布局：

**左侧会话概览面板（300px固定宽度）**：
- **成本概览**：显示该会话的总成本、input/output 分项成本
- **Token 统计**：input token、output token、总计
- **工具使用**：提出次数、接受次数、拒绝次数、接受率
- **效率评分**：基于接受率、响应速度等计算的综合评分
- 底部两个按钮：查看时间线、导出会话记录

**右侧时间线视图（flex-grow）**：
- 按时间顺序展示会话中的所有事件
- **事件类型**：
  - 会话开始/结束
  - 工具调用（Tool Use）：包含工具名称、参数摘要、接受/拒绝状态、耗时
  - 模型响应：包含 output token 数量
  - 错误事件
- **交互细节**：
  - 点击某个工具调用，展开显示完整的工具输入输出
  - 支持按类型筛选（只看工具/只看响应/全部）
  - 支持关键词搜索

**会话回放功能**：
- 在时间线视图中，支持重放功能
- 重放时按时间顺序逐步展示每一步操作
- 播放速度可调：0.5x / 1x / 2x / 4x
- 重放过程中可暂停、跳转

#### 2.2.4 边界条件处理
- **会话中断**：如果会话文件在写入过程中被读取，显示"数据加载中"，等待文件写入完成
- **超大文件**：如果单个会话文件超过10MB，提供大文件警告，允许用户选择只加载头部/尾部/全量
- **文件损坏**：如果 JSON 解析失败，记录错误日志，显示"会话数据不完整"
- **并发写入**：chokidar 检测到文件变化时，等待100ms的稳定窗口再解析，避免读取到部分写入的数据

---

### 2.3 成本分析

#### 2.3.1 功能概述
成本分析页面提供多维度的成本分析、预算设置与预警功能。

#### 2.3.2 成本概览

**顶部卡片**：
- 本月总成本（带环比增长率）
- 日均成本（带环比增长率）
- 预估月末成本

**Tab切换**：
- Tab1 - 成本趋势：按日聚合的成本柱状图，叠加成本趋势线，支持按周/按月切换
- Tab2 - 按模型：分组柱状图，每个模型一组柱子
- Tab3 - 按项目：水平条形图，按成本降序，点击进入项目详情
- Tab4 - 按工具类型：堆叠柱状图，展示哪些工具消耗最多成本

**成本明细表**：
- 支持按模型、项目、时间范围组合筛选
- 显示字段：日期、模型、项目、Input Token、Output Token、成本
- 支持排序：按日期/成本/Token
- 分页：每页50条

#### 2.3.3 预算预警功能

**用户场景**：
- 用户设置月度预算为100美元，当消费达到80美元时收到预警
- 用户设置周预算为20美元，接近时收到提醒

**预算设置字段**：
| 字段 | 默认值 | 说明 |
|------|--------|------|
| 预算周期 | 月度 | 可选：每日/每周/每月/每年 |
| 预算金额 | 无限制 | 用户自定义 |
| 预警阈值 | 80% | 当消费达到预算的80%时触发首次预警 |
| 二次预警阈值 | 95% | 当消费达到预算的95%时触发二次预警 |
| 通知形式 | 系统通知+应用内提示 | 可选：仅系统通知/仅邮件/全部 |

**预警触发逻辑**：
1. 每次新增成本数据时，检查是否触发预警条件
2. 预警阈值80%触发首次预警：系统通知提醒用户成本已达预算的80%
3. 95%阈值触发二次预警：系统通知警告用户成本已达预算的95%
4. 超出预算时：系统通知提醒用户已超出预算
5. 每个预警级别只触发一次，避免重复通知
6. 新周期开始时重置计数器

**预警通知形式**：
- **应用内通知**：页面顶部弹出横幅，显示预警内容和当前消费情况
- **系统通知**：调用操作系统通知 API（Windows Toast / macOS Notification）
- **记录**：预警历史记录可在设置页面查看

#### 2.3.4 成本对比功能
- 支持选择两个时间段进行成本对比
- 自动计算增长率、下降率
- 以对比柱状图形式展示

---

### 2.4 模型分析

#### 2.4.1 功能概述
模型分析页面帮助用户了解不同模型的使用情况、成本效率和使用场景。

#### 2.4.2 模型总览

**模型对比卡片**：
每个模型一张卡片，包含：成本、Token、会话数、接受率

**Tab切换**：
- Tab1 - 成本对比：分组柱状图，可切换总成本/每会话平均成本/每Token平均成本
- Tab2 - Token对比：堆叠柱状图，展示Input/Output Token比例，支持切换总量/平均每会话
- Tab3 - 效率对比：雷达图展示多维度对比
  - 工具接受率
  - 平均响应速度
  - 每美元获得的Token数（成本效率）
  - 会话持续时长
  - 输出Token占比
  - 每个维度0-100分标准化
- Tab4 - 使用场景分析：根据操作类型自动判断模型擅长场景

#### 2.4.3 模型定价信息（内置）
内置各模型的定价信息：
| 模型 | Input价格（美元/1M Tokens） | Output价格（美元/1M Tokens） |
|------|---------------------------|--------------------------|
| claude-opus-4 | 15 | 75 |
| claude-sonnet-4 | 3 | 15 |
| claude-haiku | 0.25 | 1.25 |

**成本计算公式**：
```
会话成本 = (input_tokens / 1000000) * input_price + (output_tokens / 1000000) * output_price
```

---

### 2.5 Agent 行为分析

#### 2.5.1 功能概述
Agent 行为分析页面深入分析 Claude 在工具调用方面的行为模式。

#### 2.5.2 工具接受率分析

**核心指标定义**：
- **工具提出数（Tools Proposed）**：Claude 在会话中提议调用的工具总数
- **工具接受数（Tools Accepted）**：用户/系统实际执行了的工具调用数
- **工具接受率（Acceptance Rate）**：接受数 / 提出数 * 100%
- **工具拒绝数（Tools Rejected）**：明确被拒绝的工具调用数
- **工具拒绝率（Rejection Rate）**：拒绝数 / 提出数 * 100%
- **静默跳过数（Silent Skips）**：Claude 提出但最终未执行

**接受率计算逻辑**：
```
接受率 = tools_accepted / tools_proposed * 100%
```

一个工具调用被提议后，可能处于以下状态之一：
1. accepted：已接受并执行
2. rejected：明确拒绝
3. modified：接受但修改了参数（仍算接受）
4. skipped：未明确表态

#### 2.5.3 效率指标体系

| 指标 | 定义 | 计算方式 | 优秀值 | 警告值 |
|------|------|---------|--------|--------|
| 工具响应速度 | 从提出到执行的时间 | avg(execution_time - proposal_time) | 小于500ms | 大于2000ms |
| 一次通过率 | 工具一次执行成功的比例 | tools_succeeded_first_try / tools_executed * 100% | 大于90% | 小于70% |
| 错误重试率 | 需要重试的工具调用比例 | tools_retried / tools_executed * 100% | 小于5% | 大于15% |
| 上下文利用率 | 平均每次工具调用的Token消耗 | total_tokens / tool_calls | 越高越好 | 越低说明冗余多 |
| 拒绝原因分布 | 各类拒绝原因的占比 | count(reason) / total_rejected * 100% | - | - |

#### 2.5.4 页面布局
- 顶部4个指标卡片：总体接受率、平均响应速度、一次通过率、效率评分
- Tab切换：接受率趋势 / 拒绝原因分析 / 工具效率排名 / 按模型对比
- 拒绝原因分布环形图
- 工具效率排名表格：排名、工具名、调用次数、接受率、平均耗时、效率评分

#### 2.5.5 拒绝原因分析
自动分类拒绝原因，通过关键词匹配推断：
- security 相关关键词 → 安全考虑（Security concern）
- already done / already exists → 重复操作（Redundant operation）
- invalid / wrong format → 参数错误（Invalid parameters）
- not related / outside → 超出范围（Out of scope）
- 其他 → Unknown

#### 2.5.6 工具效率排名
综合评分公式：
```
效率评分 = 权重1 * 接受率 + 权重2 * (1/归一化耗时) + 权重3 * 一次通过率

其中：
- 权重1 = 0.4
- 权重2 = 0.3
- 权重3 = 0.3
- 归一化耗时 = 该工具耗时 / 所有工具平均耗时
```

---

### 2.6 项目分析

#### 2.6.1 功能概述
项目分析功能帮助用户了解 Claude Code 在不同项目中的使用情况和效率差异。

#### 2.6.2 项目检测逻辑

**检测原理**：
1. 读取 ~/.claude 目录中的会话记录
2. 从会话记录中提取工作目录（working directory）信息
3. 将工作目录映射到项目名称（取目录名作为项目名）
4. 支持用户手动关联目录与项目别名

**目录到项目的映射表字段**：
- project_id：项目唯一标识符
- project_name：项目名称
- root_path：项目根目录路径
- description：项目描述
- created_at：创建时间
- updated_at：更新时间

#### 2.6.3 页面布局
- 顶部项目概览卡片：项目总数、本月活跃项目、人均成本
- Tab切换：项目成本排行 / 项目效率对比 / 目录结构分析
- 项目效率对比表：项目名、成本、Token、会话数、接受率、效率评分

#### 2.6.4 目录结构分析
- 如果项目有 .claude 配置文件，解析其中的目录结构和配置
- 以树形图展示项目的目录结构
- 每个目录节点显示：该目录相关的 Token 消耗、成本、工具使用情况
- 帮助用户理解在哪些子目录中使用 AI 最多

#### 2.6.5 项目效率对比
**效率指标**：
- 每美元获得的 Token 数（越高越好）
- 工具接受率
- 会话平均时长
- 每会话平均成本

**雷达图**：展示各项目的多维度效率对比

---

## 3. 数据模型设计

### 3.1 数据采集

#### 3.1.1 数据源目录结构
Claude Code 的数据存储在 ~/.claude 目录下，典型结构：
```
~/.claude/
├── projects/
│   └── [project-id]/
│       └── .claude.json
├── settings.json
├── conversations/
│   └── [session-id]/
│       ├── conversation.jsonl
│       └── metadata.json
└── logs/
    └── claw-*.log
```

#### 3.1.2 需要采集的文件和字段

**文件1：conversations/[session-id]/metadata.json**

| 字段 | 类型 | 说明 |
|------|------|------|
| session_id | TEXT | 会话唯一标识符 |
| project_id | TEXT | 项目标识符 |
| model | TEXT | 使用的模型名称 |
| started_at | INTEGER | 会话开始时间（Unix时间戳，毫秒） |
| ended_at | INTEGER | 会话结束时间（Unix时间戳，毫秒） |
| total_cost | REAL | 会话总成本（美元） |
| input_tokens | INTEGER | 输入Token总数 |
| output_tokens | INTEGER | 输出Token总数 |
| status | TEXT | 会话状态：active/completed/interrupted |

**文件2：conversations/[session-id]/conversation.jsonl**

每行是一个有效的 JSON 对象，表示一条消息：

| 字段 | 类型 | 说明 |
|------|------|------|
| type | TEXT | 消息类型：user/assistant/system |
| timestamp | INTEGER | 消息时间戳（毫秒） |
| content | TEXT | 消息内容 |
| tool_calls | JSON | 工具调用数组（assistant消息可能有） |
| tool_call_id | TEXT | 工具调用ID（tool类型消息有） |
| tool_name | TEXT | 工具名称（tool类型消息有） |
| tool_result | TEXT | 工具执行结果（tool类型消息有） |
| tokens | INTEGER | 该消息的Token数（如果可用） |

**tool_calls 数组中的字段**：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 工具调用ID |
| name | TEXT | 工具名称（如 Read、Edit、Bash） |
| arguments | TEXT | 工具参数（JSON字符串） |
| status | TEXT | 状态：proposed/accepted/rejected/modified |
| rejected_reason | TEXT | 如果被拒绝，原因是什么 |
| accepted_at | INTEGER | 被接受的时间戳（毫秒） |
| rejected_at | INTEGER | 被拒绝的时间戳（毫秒） |
| execution_time_ms | INTEGER | 执行耗时（毫秒） |

**文件3：settings.json**

| 字段 | 类型 | 说明 |
|------|------|------|
| user_preferences | JSON | 用户偏好设置 |
| api_key_last_used | TEXT | 最近使用的API Key（不存储完整key） |
| version | TEXT | Claude Code 版本号 |

### 3.2 SQLite 表设计

#### 3.2.1 表清单

**表1：sessions（会话表，核心表）**

```sql
CREATE TABLE sessions (
    session_id TEXT PRIMARY KEY,
    project_id TEXT,
    project_name TEXT,
    root_path TEXT,
    model TEXT NOT NULL,
    started_at INTEGER NOT NULL,
    ended_at INTEGER,
    duration_ms INTEGER,
    status TEXT DEFAULT 'active',
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,
    total_cost REAL DEFAULT 0.0,
    tools_proposed INTEGER DEFAULT 0,
    tools_accepted INTEGER DEFAULT 0,
    tools_rejected INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
);
```

**表2：projects（项目表）**

```sql
CREATE TABLE projects (
    project_id TEXT PRIMARY KEY,
    project_name TEXT NOT NULL,
    root_path TEXT,
    description TEXT,
    last_session_at INTEGER,
    total_cost REAL DEFAULT 0.0,
    total_sessions INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
);
```

**表3：tool_calls（工具调用表）**

```sql
CREATE TABLE tool_calls (
    call_id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    tool_name TEXT NOT NULL,
    arguments TEXT,
    status TEXT NOT NULL,
    rejected_reason TEXT,
    proposed_at INTEGER NOT NULL,
    accepted_at INTEGER,
    rejected_at INTEGER,
    execution_time_ms INTEGER,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);
```

**表4：daily_costs（每日成本聚合表，用于Dashboard加速查询）**

```sql
CREATE TABLE daily_costs (
    date TEXT NOT NULL,
    model TEXT NOT NULL,
    total_cost REAL DEFAULT 0.0,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    session_count INTEGER DEFAULT 0,
    tools_proposed INTEGER DEFAULT 0,
    tools_accepted INTEGER DEFAULT 0,
    PRIMARY KEY (date, model)
);
```

**表5：model_pricing（模型定价表，内置，不可修改）**

```sql
CREATE TABLE model_pricing (
    model TEXT PRIMARY KEY,
    input_price REAL NOT NULL,
    output_price REAL NOT NULL,
    description TEXT
);
```

**表6：budgets（预算表）**

```sql
CREATE TABLE budgets (
    budget_id TEXT PRIMARY KEY,
    cycle_type TEXT NOT NULL,
    amount REAL NOT NULL,
    warning_threshold REAL DEFAULT 0.8,
    critical_threshold REAL DEFAULT 0.95,
    notification_enabled INTEGER DEFAULT 1,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
);
```

**表7：alerts（预警记录表）**

```sql
CREATE TABLE alerts (
    alert_id TEXT PRIMARY KEY,
    budget_id TEXT NOT NULL,
    alert_level TEXT NOT NULL,
    triggered_at INTEGER NOT NULL,
    cost_at_alert REAL NOT NULL,
    threshold_value REAL NOT NULL,
    acknowledged INTEGER DEFAULT 0,
    acknowledged_at INTEGER,
    FOREIGN KEY (budget_id) REFERENCES budgets(budget_id)
);
```

**表8：messages（原始消息表，可选，用于会话回放）**

```sql
CREATE TABLE messages (
    message_id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    type TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    content TEXT,
    tokens INTEGER,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);
```

**表9：file_watch_state（文件监控状态表，用于chokidar断点续传）**

```sql
CREATE TABLE file_watch_state (
    file_path TEXT PRIMARY KEY,
    last_modified INTEGER NOT NULL,
    last_position INTEGER DEFAULT 0,
    file_size INTEGER DEFAULT 0,
    checksum TEXT,
    updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
);
```

**表10：app_settings（应用设置表）**

```sql
CREATE TABLE app_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
);
```

#### 3.2.2 索引设计

```sql
CREATE INDEX idx_sessions_started_at ON sessions(started_at);
CREATE INDEX idx_sessions_model ON sessions(model);
CREATE INDEX idx_sessions_project_id ON sessions(project_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_total_cost ON sessions(total_cost);

CREATE INDEX idx_tool_calls_session_id ON tool_calls(session_id);
CREATE INDEX idx_tool_calls_tool_name ON tool_calls(tool_name);
CREATE INDEX idx_tool_calls_status ON tool_calls(status);

CREATE INDEX idx_daily_costs_date ON daily_costs(date);
CREATE INDEX idx_daily_costs_model ON daily_costs(model);

CREATE INDEX idx_alerts_budget_id ON alerts(budget_id);
CREATE INDEX idx_alerts_triggered_at ON alerts(triggered_at);
```

### 3.3 数据更新策略

#### 3.3.1 更新模式
- **增量更新**：优先使用增量更新，仅处理新增或变化的数据
- **触发时机**：
  - chokidar 检测到文件变化时，解析该文件并更新数据库
  - 每30秒轮询检查文件变化，作为兜底机制
  - 应用启动时执行一次全量检查

#### 3.3.2 增量更新逻辑
1. 记录每个文件的 last_modified 和 last_position（用于 JSONL 文件）
2. 文件变化时，对比 last_modified 时间戳
3. 如果文件是 JSONL 格式，从 last_position 继续读取新行
4. 如果文件是 JSON 格式，重新解析整个文件并更新对应记录

#### 3.3.3 成本重算逻辑
- 如果 metadata.json 中的 total_cost 存在，直接使用
- 如果不存在，按公式计算：
```
total_cost = (input_tokens / 1000000) * model_input_price + (output_tokens / 1000000) * model_output_price
```

---

## 4. UI 原型描述

### 4.1 页面结构总览

整体采用侧边栏固定 + 内容区自适应布局，桌面端优先设计。

```
┌──────────┬───────────────────────────────────────────────┐
│          │                                               │
│  侧边栏   │              主内容区                          │
│  240px   │              flex-grow                        │
│  fixed   │              overflow-y: auto                 │
│          │                                               │
└──────────┴───────────────────────────────────────────────┘
```

### 4.2 侧边栏设计
- 固定在左侧，不随页面滚动
- 顶部：Logo + 应用名称"Claude Code Analytics"
- 中部：导航菜单（6个菜单项，每项带图标）
  - Dashboard（仪表盘图标）
  - Sessions（会话图标）
  - Cost Analysis（成本图表图标）
  - Model Analysis（模型图标）
  - Agent Behavior（行为图标）
  - Projects（文件夹图标）
- 当前页面菜单项高亮（左侧边框 + 背景色变化）
- 底部：设置入口（齿轮图标）

### 4.3 各页面详细布局

#### 4.3.1 Dashboard 页面布局
```
┌─────────────────────────────────────────────────────────┐
│ Dashboard                           [刷新按钮] [时间范围▼]│
├─────────────────────────────────────────────────────────┤
│ 统计卡片区（4个卡片等宽横排）                             │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐           │
│ │ 总成本  │ │ 总Token│ │ 会话数 │ │工具使用 │           │
│ │ $128.45│ │ 1.2M   │ │ 89     │ │ 81.5%  │           │
│ │ ↑12.3% │ │ ↑8.1%  │ │ ↑5.2%  │ │ ↓2.1%  │           │
│ └────────┘ └────────┘ └────────┘ └────────┘           │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │           成本趋势折线图                              │ │
│ │  [今日] [本周] [本月] [本年] [自定义]                │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌───────────────────────┐ ┌───────────────────────────┐ │
│ │  模型使用分布饼图      │ │  工具使用TOP10条形图       │ │
│ │  （50%宽度）           │ │  （50%宽度）               │ │
│ └───────────────────────┘ └───────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │  最近会话列表（最多10条）                            │ │
│ │  点击行进入会话详情                                 │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**图表选型建议**：
- 成本趋势：ECharts 折线图，支持缩放和 Tooltip
- 模型分布：ECharts 饼图（doughnut类型），悬停显示详情
- 工具TOP10：ECharts 水平条形图，带数值标签

#### 4.3.2 Sessions 列表页面布局
```
┌─────────────────────────────────────────────────────────┐
│ Sessions                    [导出按钮▼]                  │
├─────────────────────────────────────────────────────────┤
│ 筛选条件栏（横排排列）                                   │
│ [模型▼] [成本范围▼] [接受率▼] [项目▼] [搜索输入框...]    │
├─────────────────────────────────────────────────────────┤
│ 数据表格                                                 │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 时间 | 会话ID | 模型 | 成本 | Token | 工具率 | 操作 │ │
│ │ ───────────────────────────────────────────────────│ │
│ │ 05/31 | sess_abc | Opus | $2.34 | 125K | 85% |查看 │ │
│ │ 05/30 | sess_def | Sonne| $1.87 | 98K | 72% |查看 │ │
│ │ ...                                                 │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ 分页器                                                   │
│ [< 1 2 3 ... 10 >]  每页20条，共89条                   │
└─────────────────────────────────────────────────────────┘
```

**表格字段**：
| 字段 | 宽度 | 说明 |
|------|------|------|
| 时间 | 120px | 格式：MM/DD HH:mm |
| 会话ID | 120px | 显示前8位，点击复制完整ID |
| 模型 | 100px | 模型名称 |
| 成本 | 80px | 美元金额 |
| Token | 80px | 自动换算单位 |
| 工具率 | 80px | 百分比 |
| 操作 | 60px | "查看"按钮 |

#### 4.3.3 Session 详情页面布局
```
┌─────────────────────────────────────────────────────────┐
│ [←返回] Session详情              会话时长:45min 模型:Opus│
├─────────────────────────┬───────────────────────────────┤
│ 会话概览（300px）         │ 详细时间线（flex-grow）       │
│                          │                                │
│ 【成本概览】              │ 14:30 会话开始                 │
│ 总成本: $2.34            │   └─ 模型: claude-opus-4     │
│ Input: $0.89             │   └─ 项目: ~/projects/webapp  │
│ Output: $1.45            │                                │
│                          │ 14:31 Tool: Read file          │
│ 【Token统计】             │   └─ 状态: 接受                │
│ Input: 45,230            │   └─ 耗时: 120ms              │
│ Output: 79,890            │   └─ 参数: path=src/main.rs   │
│ Total: 125,120            │                                │
│                          │ 14:32 Tool: Edit file          │
│ 【工具使用】              │   └─ 状态: 接受                │
│ 提出: 23次               │   └─ 耗时: 89ms               │
│ 接受: 19次(82.6%)        │                                │
│ 拒绝: 4次(17.4%)         │ 14:33 Tool: Bash ls -la        │
│                          │   └─ 状态: 拒绝                │
│ 【效率评分】              │   └─ 原因: Security concern   │
│ 85/100                   │                                │
│                          │ 14:45 会话结束                 │
│ [查看时间线]              │                                │
│ [导出会话记录]            │                                │
└─────────────────────────┴───────────────────────────────┘
```

**组件状态**：
- 工具调用展开状态：点击工具调用行，下方展开显示完整的请求/响应内容
- 时间线筛选：工具调用/模型响应/全部 三档切换
- 导出按钮：点击弹出导出选项（CSV/JSON）

#### 4.3.4 Cost Analysis 页面布局
```
┌─────────────────────────────────────────────────────────┐
│ 成本分析                            时间范围：[本月▼]   │
├─────────────────────────────────────────────────────────┤
│ 概览卡片（3个）                                          │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐            │
│ │ 本月总成本  │ │ 日均成本   │ │ 预估月末成本│            │
│ │ $128.45   │ │ $4.28     │ │ $132.68   │            │
│ │ ↑12.3%   │ │ ↑8.1%     │ │           │            │
│ └────────────┘ └────────────┘ └────────────┘            │
│                                                         │
│ [成本趋势] [按模型] [按项目] [按工具类型] ← Tab切换      │
│ ┌─────────────────────────────────────────────────────┐ │
│ │              对应图表                                │ │
│ │              （柱状图/折线图/条形图）                 │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ 成本明细表                                               │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 日期 | 模型 | 项目 | Input | Output | 成本          │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ 预算设置区域                                             │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 预算周期：[月度▼]  预算金额：[___]                   │ │
│ │ 预警阈值：80%   二次预警：95%   [保存设置]           │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

#### 4.3.5 Model Analysis 页面布局
```
┌─────────────────────────────────────────────────────────┐
│ 模型分析                                                  │
├─────────────────────────────────────────────────────────┤
│ 模型选择：[全部▼] 或 多选 ☑ Opus ☑ Sonnet ☑ Haiku      │
├─────────────────────────────────────────────────────────┤
│ 模型对比卡片（3个等宽卡片）                               │
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐    │
│ │ Opus          │ │ Sonnet        │ │ Haiku         │    │
│ │ 成本: $89.23 │ │ 成本: $34.12 │ │ 成本: $5.10  │    │
│ │ Token: 450K  │ │ Token: 280K  │ │ Token: 89K   │    │
│ │ 会话: 45     │ │ 会话: 67     │ │ 会话: 23     │    │
│ │ 接受率: 84%  │ │ 接受率: 79%  │ │ 接受率: 81%  │    │
│ └───────────────┘ └───────────────┘ └───────────────┘    │
│                                                         │
│ [成本对比] [Token对比] [效率对比] [使用场景] ← Tab切换   │
│
┌─────────────────────────────────────────────────────────┐
│              雷达图/柱状图（取决于Tab）                 │
└─────────────────────────────────────────────────────────┘
```

#### 4.3.6 Agent Behavior 页面布局
```
┌─────────────────────────────────────────────────────────┐
│ Agent行为分析                      筛选：[工具▼] [模型▼]│
├─────────────────────────────────────────────────────────┤
│ 指标卡片（4个）                                          │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│ │总体接受率│ │响应速度 │ │一次通过率│ │效率评分  │          │
│ │ 81.5%  │ │ 1.2s   │ │ 87%    │ │ 85/100  │          │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│                                                         │
│ [接受率趋势] [拒绝原因分析] [工具效率排名] [按模型对比]   │
│ ┌─────────────────────────────────────────────────────┐ │
│ │              图表区                                  │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 拒绝原因分布（环形图）                               │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 工具效率排名表                                      │ │
│ │ 排名 | 工具名 | 调用次数 | 接受率 | 平均耗时 | 评分   │ │
│ │ 1   | Read   | 1,234    | 95%    | 150ms    | 98   │ │
│ │ 2   | Edit   | 987      | 88%    | 200ms    | 92   │ │
│ │ 3   | Bash   | 654      | 72%    | 500ms    | 78   │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

#### 4.3.7 Projects 页面布局
```
┌─────────────────────────────────────────────────────────┐
│ 项目分析                                                  │
├─────────────────────────────────────────────────────────┤
│ 项目选择：[全部▼]                                         │
├─────────────────────────────────────────────────────────┤
│ 项目概览卡片（3个）                                        │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐             │
│ │ 项目总数    │ │ 本月活跃项目 │ │ 人均成本    │             │
│ │ 12         │ │ 8          │ │ $10.70     │             │
│ └────────────┘ └────────────┘ └────────────┘             │
│                                                         │
│ [项目成本排行] [项目效率对比] [目录结构分析]              │
│ ┌─────────────────────────────────────────────────────┐ │
│ │              图表区                                  │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 项目效率对比表                                      │ │
│ │ 项目名 | 成本 | Token | 会话数 | 接受率 | 效率评分    │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 4.4 通用组件状态

#### 4.4.1 卡片组件
- **正常状态**：白色背景，轻微阴影
- **加载状态**：骨架屏（Skeleton），灰色占位块动画
- **空状态**：显示占位图标 + 引导文字
- **错误状态**：显示错误提示 + 重试按钮

#### 4.4.2 表格组件
- **正常状态**：斑马纹行，悬停高亮
- **加载状态**：骨架行
- **空状态**：显示空状态插图
- **行操作**：悬停显示操作按钮

#### 4.4.3 图表组件
- **加载状态**：中心显示加载动画
- **空状态**：显示空状态文字"暂无数据"
- **错误状态**：显示错误提示

#### 4.4.4 Tab切换组件
- 当前Tab：下划线高亮，文字加粗
- 非当前Tab：灰色文字
- 悬停：文字颜色加深

---

## 5. 技术架构

### 5.1 Tauri 架构概述

Tauri 是一个用 Rust 编写的轻量级桌面应用框架，前端可以用任意框架（React/Vue/Svelte 等）。

整体架构：
```
┌─────────────────────────────────────────────┐
│              React + TypeScript 前端          │
│         （WebView / WebView2）               │
│                                             │
│   ┌──────────────────────────────────────┐  │
│   │  UI 组件层（React Components）         │  │
│   │  状态管理层（Zustand / Redux）          │  │
│   │  图表层（ECharts / Recharts）           │  │
│   └──────────────────────────────────────┘  │
│                                             │
│   ┌──────────────────────────────────────┐  │
│   │  Tauri IPC 通信层                     │  │
│   │  invoke() 调用 Rust 命令               │  │
│   │  events 监听 Rust 事件                │  │
│   └──────────────────────────────────────┘  │
└──────────────────┬──────────────────────────┘
                   │ IPC（JSON格式）
┌──────────────────┴──────────────────────────┐
│              Rust 后端（Tauri Core）           │
│                                             │
│   ┌──────────────────────────────────────┐  │
│   │  命令处理层（Commands）               │  │
│   │  - get_sessions()                    │  │
│   │  - get_session_detail(id)            │  │
│   │  - get_cost_analysis()               │  │
│   │  - get_tool_calls()                  │  │
│   │  - save_budget()                     │  │
│   └──────────────────────────────────────┘  │
│                                             │
│   ┌──────────────────────────────────────┐  │
│   │  文件监听层（chokidar WASM / notify） │  │
│   │  - watch_directory()                 │  │
│   │  - parse_conversation_file()          │  │
│   │  - update_database()                 │  │
│   └──────────────────────────────────────┘  │
│                                             │
│   ┌──────────────────────────────────────┐  │
│   │  数据存储层（SQLite / rusqlite）       │  │
│   │  - sessions 表                       │  │
│   │  - tool_calls 表                     │  │
│   │  - daily_costs 表                    │  │
│   └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### 5.2 前端与 Rust 通信方式

#### 5.2.1 命令调用（invoke）
前端调用 Rust 函数的示例：

```typescript
// 前端调用
import { invoke } from "@tauri-apps/api/tauri";

// 获取会话列表
const sessions = await invoke("get_sessions", {
  filter: { model: "opus", startDate: "2026-05-01" },
  page: 1,
  pageSize: 20
});

// 获取会话详情
const detail = await invoke("get_session_detail", {
  sessionId: "sess_abc123"
});

// 获取成本分析
const costAnalysis = await invoke("get_cost_analysis", {
  startDate: "2026-05-01",
  endDate: "2026-05-31",
  groupBy: "model"
});

// 保存预算设置
await invoke("save_budget", {
  budget: {
    cycleType: "monthly",
    amount: 100.0,
    warningThreshold: 0.8
  }
});
```

#### 5.2.2 事件监听（events）
Rust 主动推送事件给前端：

```typescript
// 前端监听
import { listen } from "@tauri-apps/api/event";

// 监听数据更新事件
await listen("data_updated", (event) => {
  const { sessionId, updateType } = event.payload;
  console.log(`Session ${sessionId} was ${updateType}`);
});

// 监听预警事件
await listen("budget_alert", (event) => {
  const { level, cost, threshold } = event.payload;
  showNotification(`Budget alert: ${level}`);
});
```

#### 5.2.3 Rust 命令定义示例

```rust
// src-tauri/src/commands.rs

#[tauri::command]
async fn get_sessions(
    filter: SessionFilter,
    page: u32,
    page_size: u32,
) -> Result<PageResult<Session>, String> {
    let db = get_db().await?;
    db.get_sessions(filter, page, page_size).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_session_detail(session_id: String) -> Result<SessionDetail, String> {
    let db = get_db().await?;
    db.get_session_detail(&session_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_cost_analysis(
    start_date: String,
    end_date: String,
    group_by: String,
) -> Result<CostAnalysis, String> {
    let db = get_db().await?;
    db.get_cost_analysis(&start_date, &end_date, &group_by)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn save_budget(budget: Budget) -> Result<(), String> {
    let db = get_db().await?;
    db.save_budget(budget).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_budget() -> Result<Option<Budget>, String> {
    let db = get_db().await?;
    db.get_budget().await.map_err(|e| e.to_string())
}
```

### 5.3 数据采集层

#### 5.3.1 chokidar 使用方式
由于 Tauri 的 Rust 后端不能直接使用 Node.js 的 chokidar，有两种方案：

**方案1：使用 Rust 原生的文件监听库（推荐）**
- 使用 `notify` 或 `watchexec` crate
- 优点：纯 Rust，无需 Node.js 依赖
- 缺点：需要用 Rust 实现文件解析逻辑

**方案2：chokidar 运行在 Node.js helper 进程中**
- Tauri 支持在后台运行 Node.js 脚本
- 通过 IPC 与主进程通信
- 优点：可以复用现有的 chokidar 逻辑
- 缺点：增加复杂度

推荐方案1，使用 Rust 原生的 `notify` crate：

```rust
// src-tauri/src/watcher.rs

use notify::{Config, RecommendedWatcher, RecursiveMode, Watcher};
use std::sync::mpsc::channel;
use std::path::Path;

pub fn start_watching(claude_dir: &Path) -> Result<(), Box<dyn std::error::Error>> {
    let (tx, rx) = channel();

    let mut watcher = RecommendedWatcher::new(
        move |res| {
            tx.send(res).unwrap();
        },
        Config::default(),
    )?;

    watcher.watch(claude_dir, RecursiveMode::Recursive)?;

    std::thread::spawn(move || {
        loop {
            match rx.recv() {
                Ok(Ok(event)) => {
                    handle_file_change(event);
                }
                Ok(Err(e)) => {
                    eprintln!("Watch error: {:?}", e);
                }
                Err(_) => break,
            }
        }
    });

    Ok(())
}

fn handle_file_change(event: notify::Event) {
    for path in event.paths {
        if let Some(ext) = path.extension() {
            if ext == "jsonl" || ext == "json" {
                // 触发增量解析
                parse_file(&path);
            }
        }
    }
}
```

#### 5.3.2 文件变化检测逻辑

```
文件变化事件触发
     │
     ▼
等待100ms稳定窗口（避免部分写入）
     │
     ▼
判断文件类型：
├── JSON文件（metadata.json）
│   └── 重新解析整个文件，更新sessions表
│
├── JSONL文件（conversation.jsonl）
│   ├── 读取last_position之后的行
│   ├── 逐行解析JSON
│   └── 更新messages和tool_calls表
│
└── 新建目录/会话
    └── 初始化file_watch_state记录
```

#### 5.3.3 增量解析实现

```rust
async fn parse_jsonl_file(path: &Path) -> Result<(), Box<dyn std::error::Error>> {
    let db = get_db().await?;

    // 获取上次读取位置
    let last_pos = db.get_file_position(path)?;

    // 打开文件，跳过已读取部分
    let file = File::open(path)?;
    let reader = BufReader::new(file);
    let mut lines = reader.lines();

    // 跳过 last_pos 行
    for _ in 0..last_pos {
        lines.next();
    }

    // 解析新行
    let mut new_pos = last_pos;
    for line in lines {
        if let Ok(content) = line {
            if let Ok(msg) = serde_json::from_str::<Message>(&content) {
                db.insert_message(&msg).await?;
                new_pos += 1;
            }
        }
    }

    // 更新读取位置
    db.update_file_position(path, new_pos)?;

    // 更新会话的工具统计
    db.update_session_tool_stats(session_id).await?;

    Ok(())
}
```

### 5.4 存储层

#### 5.4.1 SQLite 在 Tauri 中的使用

使用 `rusqlite` crate，配合 `tokio` 异步运行时：

```rust
// src-tauri/src/db.rs

use rusqlite::{Connection, params};
use std::sync::Mutex;
use tokio::runtime::Runtime;

pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    pub fn new(path: &Path) -> Result<Self, rusqlite::Error> {
        let conn = Connection::open(path)?;

        // 启用 WAL 模式，提升并发读写性能
        conn.execute_batch("PRAGMA journal_mode=WAL;")?;

        // 初始化表结构
        conn.execute_batch(include_str!("schema.sql"))?;

        Ok(Self {
            conn: Mutex::new(conn),
        })
    }

    pub async fn get_sessions(&self, filter: SessionFilter) -> Result<Vec<Session>, Error> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT * FROM sessions WHERE started_at >= ? AND started_at <= ? ORDER BY started_at DESC LIMIT ? OFFSET ?"
        )?;

        let sessions = stmt.query_map(params![
            filter.start_date,
            filter.end_date,
            filter.limit,
            filter.offset
        ], |row| {
            Ok(Session {
                session_id: row.get(0)?,
                // ...
            })
        })?.collect::<Result<Vec<_>, _>>()?;

        Ok(sessions)
    }
}
```

#### 5.4.2 schema.sql 文件内容

```sql
-- sessions 表
CREATE TABLE IF NOT EXISTS sessions (
    session_id TEXT PRIMARY KEY,
    project_id TEXT,
    project_name TEXT,
    root_path TEXT,
    model TEXT NOT NULL,
    started_at INTEGER NOT NULL,
    ended_at INTEGER,
    duration_ms INTEGER,
    status TEXT DEFAULT 'active',
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER,
    total_cost REAL DEFAULT 0.0,
    tools_proposed INTEGER DEFAULT 0,
    tools_accepted INTEGER DEFAULT 0,
    tools_rejected INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
);

-- projects 表
CREATE TABLE IF NOT EXISTS projects (
    project_id TEXT PRIMARY KEY,
    project_name TEXT NOT NULL,
    root_path TEXT,
    description TEXT,
    last_session_at INTEGER,
    total_cost REAL DEFAULT 0.0,
    total_sessions INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
);

-- tool_calls 表
CREATE TABLE IF NOT EXISTS tool_calls (
    call_id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    tool_name TEXT NOT NULL,
    arguments TEXT,
    status TEXT NOT NULL,
    rejected_reason TEXT,
    proposed_at INTEGER NOT NULL,
    accepted_at INTEGER,
    rejected_at INTEGER,
    execution_time_ms INTEGER,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);

-- daily_costs 表
CREATE TABLE IF NOT EXISTS daily_costs (
    date TEXT NOT NULL,
    model TEXT NOT NULL,
    total_cost REAL DEFAULT 0.0,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    session_count INTEGER DEFAULT 0,
    tools_proposed INTEGER DEFAULT 0,
    tools_accepted INTEGER DEFAULT 0,
    PRIMARY KEY (date, model)
);

-- budgets 表
CREATE TABLE IF NOT EXISTS budgets (
    budget_id TEXT PRIMARY KEY,
    cycle_type TEXT NOT NULL,
    amount REAL NOT NULL,
    warning_threshold REAL DEFAULT 0.8,
    critical_threshold REAL DEFAULT 0.95,
    notification_enabled INTEGER DEFAULT 1,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
);

-- alerts 表
CREATE TABLE IF NOT EXISTS alerts (
    alert_id TEXT PRIMARY KEY,
    budget_id TEXT NOT NULL,
    alert_level TEXT NOT NULL,
    triggered_at INTEGER NOT NULL,
    cost_at_alert REAL NOT NULL,
    threshold_value REAL NOT NULL,
    acknowledged INTEGER DEFAULT 0,
    acknowledged_at INTEGER,
    FOREIGN KEY (budget_id) REFERENCES budgets(budget_id)
);

-- file_watch_state 表
CREATE TABLE IF NOT EXISTS file_watch_state (
    file_path TEXT PRIMARY KEY,
    last_modified INTEGER NOT NULL,
    last_position INTEGER DEFAULT 0,
    file_size INTEGER DEFAULT 0,
    checksum TEXT,
    updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_sessions_model ON sessions(model);
CREATE INDEX IF NOT EXISTS idx_sessions_project_id ON sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_tool_calls_session_id ON tool_calls(session_id);
CREATE INDEX IF NOT EXISTS idx_tool_calls_tool_name ON tool_calls(tool_name);
CREATE INDEX IF NOT EXISTS idx_daily_costs_date ON daily_costs(date);
```

### 5.5 安全考虑

#### 5.5.1 Tauri 权限控制

Tauri 2.0 使用 CSP（Content Security Policy）和权限系统限制前端能力：

**tauri.conf.json 配置**：
```json
{
  "app": {
    "security": {
      "csp": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
    }
  },
  "bundle": {
    "identifier": "com.claude-code-analytics.app"
  }
}
```

#### 5.5.2 文件访问范围限制

使用 Tauri 的路径限制功能，只允许访问 ~/.claude 目录：

```json
{
  "permissions": [
    {
      "identifier": "fs:allow-read",
      "allow": [
        { "path": "$HOME/.claude/**" }
      ]
    },
    {
      "identifier": "fs:default",
      "deny": [
        { "path": "$HOME/.claude/**/*.jsonl" }
      ]
    }
  ]
}
```

#### 5.5.3 IPC 命令白名单

只暴露必要的命令给前端，敏感操作在 Rust 后端完成：

```rust
// 只暴露这些命令给前端
#[tauri::command]
async fn get_sessions(...) -> ... { }

#[tauri::command]
async fn get_session_detail(...) -> ... { }

#[tauri::command]
async fn get_cost_analysis(...) -> ... { }

#[tauri::command]
async fn get_tool_analysis(...) -> ... { }

#[tauri::command]
async fn save_budget(...) -> ... { }

#[tauri::command]
async fn get_budget(...) -> ... { }

// 以下是内部命令，不暴露给前端
async fn parse_file(...) -> ... { }
async fn update_database(...) -> ... { }
async fn check_budget_alert(...) -> ... { }
```

#### 5.5.4 数据安全
- 所有数据存储在本地 SQLite 数据库，不会上传到任何服务器
- 数据库文件存储在 Tauri 的应用数据目录（受操作系统保护）
- 不存储用户的 API Key 等敏感信息

---

## 6. MVP 分阶段开发计划

### 6.1 Phase 1：核心数据收集与展示（2-3周）

**目标**：能够运行应用，基本数据可见

**功能范围**：
1. 项目初始化
   - Tauri 项目脚手架搭建
   - React + TypeScript 前端框架搭建
   - SQLite 数据库初始化
   - 基础导航和页面结构

2. 数据采集
   - 监听 ~/.claude/conversations 目录
   - 解析 metadata.json 文件
   - 解析 conversation.jsonl 文件（仅基础字段）
   - 存储到 SQLite

3. Dashboard 页面
   - 统计卡片：总成本、总Token、会话数
   - 成本趋势图（简易版）
   - 最近会话列表（仅列表，不含详情）
   - 手动刷新功能

4. Sessions 列表
   - 会话列表展示
   - 按时间筛选
   - 分页展示

**验收标准**：
- 应用可以启动并显示 Dashboard
- 解析 ~/.claude 目录下的会话数据
- 成本计算正确
- 数据可以持久化存储

**技术关注点**：
- Tauri 项目结构和 IPC 通信
- Rust 文件监听和 JSON 解析
- SQLite 基础 CRUD 操作

---

### 6.2 Phase 2：完整功能实现（3-4周）

**目标**：所有核心功能完整可用

**功能范围**：
1. Session 详情页
   - 会话概览面板
   - 时间线视图
   - 工具调用详情展开
   - 会话回放功能（可选）

2. Cost Analysis 完整功能
   - 多 Tab 切换（趋势/模型/项目/工具）
   - 成本明细表
   - 预算设置
   - 预警通知（系统通知 + 应用内横幅）

3. Model Analysis
   - 多模型对比卡片
   - 雷达图效率对比
   - Token 对比图表

4. Agent Behavior
   - 工具接受率统计
   - 拒绝原因分析
   - 工具效率排名

5. 数据优化
   - 增量更新逻辑完善
   - 性能优化（索引、聚合表）
   - 边界条件处理（大文件、空数据等）

**验收标准**：
- 所有页面可正常访问
- 预算预警功能可用
- 数据实时更新
- 性能流畅

**技术关注点**：
- 复杂图表实现（ECharts）
- 状态管理（Zustand）
- 预警逻辑和通知系统

---

### 6.3 Phase 3：高级分析与体验优化（2-3周）

**目标**：差异化功能，优秀用户体验

**功能范围**：
1. Projects 完整功能
   - 项目自动检测
   - 目录结构分析
   - 项目效率对比
   - 雷达图多维对比

2. 数据导出
   - CSV/JSON 导出
   - 自定义字段选择
   - 批量导出

3. 高级分析
   - DORA 指标关联（可选）
   - 自定义时间范围对比
   - 效率趋势预测

4. 用户体验优化
   - 加载动画和骨架屏
   - 空状态引导
   - 深色模式
   - 响应式布局（适配窗口大小）

5. 国际化准备
   - i18n 框架集成
   - 语言包准备（中文/英文）

6. 错误处理与日志
   - 完善的错误提示
   - 日志记录
   - 崩溃报告

**验收标准**：
- 所有高级功能可用
- 体验流畅，界面美观
- 错误处理完善
- 具备发布条件

---

### 6.4 开发优先级矩阵

| 功能 | Phase 1 | Phase 2 | Phase 3 |
|------|---------|---------|---------|
| Dashboard 基础版 | P0 | - | - |
| Sessions 列表 | P0 | - | - |
| 数据采集 | P0 | - | - |
| Session 详情 | P1 | P0 | - |
| Cost Analysis | P1 | P0 | - |
| 预算预警 | P1 | P0 | - |
| Model Analysis | P1 | P0 | - |
| Agent Behavior | P2 | P1 | P0 |
| Projects | P2 | P1 | P0 |
| 数据导出 | P2 | P1 | P0 |
| 深色模式 | - | P2 | P0 |
| 国际化 | - | P2 | P1 |

注：P0 = 必须有，P1 = 重要，P2 = 锦上添花

---

## 7. 附录

### 7.1 术语表

| 术语 | 说明 |
|------|------|
| Token | 模型处理的最小文本单位 |
| Session | 一次 Claude Code 使用会话 |
| Tool Call | Claude 提出的工具调用请求 |
| DORA | DevOps Research and Assessment，研发效能评估框架 |
| IPC | Inter-Process Communication，进程间通信 |

### 7.2 技术栈选型理由

| 技术 | 选择理由 |
|------|---------|
| Tauri | 比 Electron 更轻量（打包体积小），Rust 后端性能强 |
| React | 生态丰富，组件库完善 |
| TypeScript | 类型安全，减少运行时错误 |
| SQLite | 轻量级，无需单独安装数据库服务 |
| ECharts | 图表功能强大，支持定制 |

### 7.3 外部依赖列表

**Rust 端**：
- tauri：桌面应用框架
- rusqlite：SQLite 数据库
- serde / serde_json：序列化/反序列化
- notify：文件监听
- tokio：异步运行时
- chrono：时间处理
- uuid：唯一ID生成

**前端**：
- react：UI框架
- zustand：状态管理
- echarts-for-react：图表
- react-router：路由
- @tauri-apps/api：Tauri 通信

### 7.4 参考资料

- Tauri 官方文档：https://tauri.app/
- Tauri 2.0 IPC 通信：https://tauri.app/develop/calling-to-rust/
- ECharts 文档：https://echarts.apache.org/
- rusqlite 文档：https://docs.rs/rusqlite/

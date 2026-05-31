# Claude Code Analytics

本地 AI 编程辅助使用分析工具 - 基于 TDD 开发的 TypeScript/Node.js 核心库。

## 项目状态

### ✅ 已完成的功能模块

| 模块 | 功能 | 状态 |
|------|------|------|
| **pricing** | 模型定价计算、成本估算 | ✅ |
| **path** | 跨平台路径解析、session 路径解析 | ✅ |
| **parser** | Session metadata 解析、JSONL 解析、工具调用解析 | ✅ |
| **aggregation** | 成本聚合、趋势计算、Token 统计 | ✅ |
| **budget** | 预算管理、预警触发、周期重置 | ✅ |
| **rejection** | 拒绝原因分类（安全/重复/参数/范围） | ✅ |
| **efficiency** | 效率评分、工具评分、等级计算 | ✅ |
| **export** | CSV/JSON 导出、解析 | ✅ |
| **filter** | 会话过滤、排序、分页、搜索 | ✅ |

## 测试覆盖率

```
Test Files  - 9 passed
Tests       - 123 passed
```

## 模块说明

### pricing - 定价计算
- 支持 Opus/Sonnet/Haiku 模型定价
- `calculateTokenCost()`: Token 到美元转换
- `calculateSessionCost()`: 会话成本计算

### path - 路径工具
- 跨平台 `~/.claude` 路径解析
- Session 文件路径解析
- `isValidSessionId()`: 安全验证

### parser - 数据解析
- `parseMetadata()`: 会话元数据解析
- `parseConversationLine()`: JSONL 行解析
- `extractToolStats()`: 工具使用统计

### aggregation - 数据聚合
- `aggregateDailyCosts()`: 按日聚合
- `aggregateByModel()`: 按模型聚合
- `calculateTrend()`: 增长趋势计算

### budget - 预算管理
- `createBudget()`: 创建预算
- `checkBudgetAlert()`: 预警检测
- `resetBudgetForNewCycle()`: 周期重置

### rejection - 拒绝分类
- 基于关键词的启发式分类
- 安全考虑/重复操作/参数错误/超出范围

### efficiency - 效率评分
- 接受率评分 (40%权重)
- 响应速度评分 (30%权重)
- 一次通过率评分 (30%权重)
- A/B/C/D/F 等级评定

### export - 数据导出
- `exportToCSV()`: CSV 导出
- `exportToJSON()`: JSON 导出（含版本元数据）
- `parseCSV()`: CSV 解析

### filter - 过滤排序
- 多条件过滤
- 按时间/成本/接受率排序
- 分页支持

## 开发

```bash
# 安装依赖
npm install

# 运行测试
npm test

# 监听模式
npm run test:watch

# 覆盖率报告
npm run test:coverage
```

## PRD 功能对照

本文档基于 `claude-code-analytics-prd-v2.md` 规格开发。

### Phase 1 核心功能
- ✅ 成本计算 (pricing)
- ✅ 数据解析 (parser)
- ✅ 数据聚合 (aggregation)
- ✅ 会话过滤 (filter)

### Phase 2 扩展功能
- ✅ 预算预警 (budget)
- ✅ 效率评分 (efficiency)
- ✅ 数据导出 (export)

### Phase 3 高级功能
- ✅ 拒绝原因分析 (rejection)
- ✅ 跨平台路径 (path)

## 技术栈

- **TypeScript** - 类型安全
- **Vitest** - 单元测试
- **Node.js** - 运行时

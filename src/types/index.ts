// ============== 核心数据类型定义 ==============

/** 会话状态 */
export type SessionStatus = 'active' | 'completed' | 'interrupted';

/** 工具调用状态 */
export type ToolCallStatus = 'proposed' | 'accepted' | 'rejected' | 'modified' | 'skipped';

/** 预算周期类型 */
export type BudgetCycleType = 'daily' | 'weekly' | 'monthly' | 'yearly';

/** 预警级别 */
export type AlertLevel = 'warning' | 'critical' | 'exceeded';

/** 会话元数据 (来自 Claude Code 的 metadata.json) */
export interface SessionMetadata {
  session_id: string;
  project_id?: string;
  model: string;
  started_at: number;  // Unix timestamp in milliseconds
  ended_at?: number;   // Unix timestamp in milliseconds
  total_cost?: number; // in USD
  input_tokens?: number;
  output_tokens?: number;
  status: SessionStatus;
}

/** 会话完整信息 */
export interface Session extends SessionMetadata {
  project_name?: string;
  root_path?: string;
  duration_ms?: number;
  tools_proposed: number;
  tools_accepted: number;
  tools_rejected: number;
  tools_modified: number;
  tools_skipped: number;
}

/** 工具调用记录 */
export interface ToolCall {
  id: string;
  session_id: string;
  tool_name: string;
  arguments?: string;  // JSON string
  status: ToolCallStatus;
  rejected_reason?: string;
  proposed_at: number;
  accepted_at?: number;
  rejected_at?: number;
  execution_time_ms?: number;
}

/** 消息记录 */
export interface Message {
  message_id: string;
  session_id: string;
  type: 'user' | 'assistant' | 'system' | 'tool';
  timestamp: number;
  content?: string;
  tokens?: number;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  tool_name?: string;
  tool_result?: string;
}

/** 项目信息 */
export interface Project {
  project_id: string;
  project_name: string;
  root_path?: string;
  description?: string;
  last_session_at?: number;
  total_cost: number;
  total_sessions: number;
}

/** 模型定价信息 */
export interface ModelPricing {
  model: string;
  input_price: number;  // USD per 1M tokens
  output_price: number; // USD per 1M tokens
  description?: string;
}

/** 每日成本聚合 */
export interface DailyCost {
  date: string;  // YYYY-MM-DD format
  model: string;
  total_cost: number;
  input_tokens: number;
  output_tokens: number;
  session_count: number;
  tools_proposed: number;
  tools_accepted: number;
}

/** 预算设置 */
export interface Budget {
  budget_id: string;
  cycle_type: BudgetCycleType;
  amount: number;
  warning_threshold: number;  // 0.8 = 80%
  critical_threshold: number; // 0.95 = 95%
  notification_enabled: boolean;
}

/** 预警记录 */
export interface Alert {
  alert_id: string;
  budget_id: string;
  alert_level: AlertLevel;
  triggered_at: number;
  cost_at_alert: number;
  threshold_value: number;
  acknowledged: boolean;
  acknowledged_at?: number;
}

/** 会话过滤器 */
export interface SessionFilter {
  model?: string;
  minCost?: number;
  maxCost?: number;
  minAcceptanceRate?: number;
  maxAcceptanceRate?: number;
  projectId?: string;
  startDate?: number;
  endDate?: number;
  keyword?: string;
}

/** 分页结果 */
export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/** 成本分析数据 */
export interface CostAnalysis {
  totalCost: number;
  totalTokens: number;
  averageCostPerSession: number;
  costByModel: Map<string, number>;
  costByDay: Map<string, number>;
  costByProject: Map<string, number>;
}

/** 工具接受率统计 */
export interface ToolAcceptanceStats {
  toolName: string;
  proposed: number;
  accepted: number;
  rejected: number;
  modified: number;
  skipped: number;
  acceptanceRate: number;
  averageExecutionTime?: number;
}

/** 效率评分 */
export interface EfficiencyScore {
  overall: number;        // 0-100
  acceptanceRate: number;
  responseSpeed: number;  // ms
  firstTrySuccess: number; // percentage
}

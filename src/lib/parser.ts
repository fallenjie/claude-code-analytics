import type {
  SessionMetadata,
  ToolCall,
  ToolCallStatus,
  Message
} from '../types';

// 支持的模型名称前缀
const VALID_MODEL_PREFIXES = [
  'claude-opus',
  'claude-sonnet',
  'claude-haiku',
];

/**
 * 解析 session metadata
 */
export function parseMetadata(data: Partial<SessionMetadata>): SessionMetadata {
  // 必填字段验证
  if (!data.session_id) {
    throw new Error('session_id is required');
  }
  if (!data.model) {
    throw new Error('model is required');
  }
  if (data.started_at === undefined) {
    throw new Error('started_at is required');
  }

  return {
    session_id: data.session_id,
    project_id: data.project_id,
    model: data.model,
    started_at: data.started_at,
    ended_at: data.ended_at,
    total_cost: data.total_cost,
    input_tokens: data.input_tokens,
    output_tokens: data.output_tokens,
    status: data.status || 'active',
  };
}

/**
 * 解析一行 conversation.jsonl
 */
export function parseConversationLine(line: string): Message | null {
  if (!line || line.trim() === '') {
    return null;
  }

  try {
    const data = JSON.parse(line);
    return data as Message;
  } catch {
    // 无效 JSON 返回 null
    return null;
  }
}

/**
 * 解析 tool_call 对象
 */
export function parseToolCall(
  data: Record<string, unknown>,
  sessionId: string
): ToolCall {
  return {
    id: data.id as string || `tool_${Date.now()}`,
    session_id: sessionId,
    tool_name: data.name as string || 'unknown',
    arguments: data.arguments as string | undefined,
    status: (data.status as ToolCallStatus) || 'proposed',
    rejected_reason: data.rejected_reason as string | undefined,
    proposed_at: data.proposed_at as number | undefined,
    accepted_at: data.accepted_at as number | undefined,
    rejected_at: data.rejected_at as number | undefined,
    execution_time_ms: data.execution_time_ms as number | undefined,
  };
}

/**
 * 从 tool_calls 数组提取统计数据
 */
export function extractToolStats(toolCalls: ToolCall[]): {
  total: number;
  proposed: number;
  accepted: number;
  rejected: number;
  modified: number;
  skipped: number;
  acceptanceRate: number;
} {
  const total = toolCalls.length;
  // proposed = 所有提出过的工具调用（无论最终状态）
  const proposed = total;
  const accepted = toolCalls.filter(t => t.status === 'accepted').length;
  const rejected = toolCalls.filter(t => t.status === 'rejected').length;
  const modified = toolCalls.filter(t => t.status === 'modified').length;
  const skipped = toolCalls.filter(t => t.status === 'skipped').length;

  // 接受率 = accepted / total（不含 modified）
  const acceptanceRate = total > 0 ? (accepted / total) * 100 : 0;

  return {
    total,
    proposed,
    accepted,
    rejected,
    modified,
    skipped,
    acceptanceRate: Math.round(acceptanceRate * 10) / 10,
  };
}

/**
 * 验证模型名称是否有效
 */
export function isValidModelName(modelName: string): boolean {
  if (!modelName || modelName.trim() === '') {
    return false;
  }

  return VALID_MODEL_PREFIXES.some(prefix =>
    modelName.toLowerCase().startsWith(prefix)
  );
}

/**
 * 从会话元数据计算持续时间
 */
export function calculateDuration(metadata: SessionMetadata): number | undefined {
  if (!metadata.ended_at) {
    return undefined;
  }
  return metadata.ended_at - metadata.started_at;
}

/**
 * 判断会话是否活跃
 */
export function isActiveSession(metadata: SessionMetadata): boolean {
  return metadata.status === 'active';
}

import type { Session } from '../types';

/**
 * 格式化日期为 YYYY-MM-DD
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 按日期聚合成本
 */
export function aggregateDailyCosts(sessions: Session[]): Map<string, number> {
  const costs = new Map<string, number>();

  for (const session of sessions) {
    const date = formatDate(session.started_at);
    const currentCost = costs.get(date) || 0;
    costs.set(date, currentCost + (session.total_cost || 0));
  }

  return costs;
}

/**
 * 按模型聚合成本
 */
export function aggregateByModel(sessions: Session[]): Map<string, number> {
  const costs = new Map<string, number>();

  for (const session of sessions) {
    const currentCost = costs.get(session.model) || 0;
    costs.set(session.model, currentCost + (session.total_cost || 0));
  }

  return costs;
}

/**
 * 按项目聚合成本
 */
export function aggregateByProject(sessions: Session[]): Map<string, number> {
  const costs = new Map<string, number>();

  for (const session of sessions) {
    const projectId = session.project_id || 'unknown';
    const currentCost = costs.get(projectId) || 0;
    costs.set(projectId, currentCost + (session.total_cost || 0));
  }

  return costs;
}

/**
 * 获取总会话成本
 */
export function getTotalCost(sessions: Session[]): number {
  return sessions.reduce((sum, session) => sum + (session.total_cost || 0), 0);
}

/**
 * 获取总 token 数量
 */
export function getTotalTokens(
  sessions: Session[],
  type: 'input' | 'output' | 'total' = 'total'
): number {
  if (type === 'input') {
    return sessions.reduce((sum, s) => sum + (s.input_tokens || 0), 0);
  }
  if (type === 'output') {
    return sessions.reduce((sum, s) => sum + (s.output_tokens || 0), 0);
  }
  // total
  return sessions.reduce(
    (sum, s) => sum + (s.input_tokens || 0) + (s.output_tokens || 0),
    0
  );
}

/**
 * 计算趋势
 */
export function calculateTrend(
  current: number,
  previous: number
): {
  percentage: number | null;
  direction: 'up' | 'down' | 'neutral';
} {
  if (previous === 0) {
    return {
      percentage: null,
      direction: current > 0 ? 'up' : 'neutral',
    };
  }

  const percentage = ((current - previous) / previous) * 100;
  const direction = percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'neutral';

  return {
    percentage: Math.round(percentage * 10) / 10,
    direction,
  };
}

/**
 * 计算工具接受率
 */
export function calculateAcceptanceRate(sessions: Session[]): number {
  const totalProposed = sessions.reduce((sum, s) => sum + s.tools_proposed, 0);
  const totalAccepted = sessions.reduce((sum, s) => sum + s.tools_accepted, 0);

  if (totalProposed === 0) return 0;
  return Math.round((totalAccepted / totalProposed) * 100 * 10) / 10;
}

/**
 * 格式化 token 数量（自动单位换算）
 */
export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}K`;
  }
  return String(tokens);
}

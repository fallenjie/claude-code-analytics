import type { Session, SessionFilter, PageResult } from '../types';

/**
 * 根据过滤器条件筛选会话
 */
export function filterSessions(
  sessions: Session[],
  filter: SessionFilter
): Session[] {
  return sessions.filter(session => {
    // 按模型过滤
    if (filter.model) {
      if (!session.model.toLowerCase().includes(filter.model.toLowerCase())) {
        return false;
      }
    }

    // 按成本范围过滤
    if (filter.minCost !== undefined && (session.total_cost || 0) < filter.minCost) {
      return false;
    }
    if (filter.maxCost !== undefined && (session.total_cost || 0) > filter.maxCost) {
      return false;
    }

    // 按接受率过滤
    if (filter.minAcceptanceRate !== undefined || filter.maxAcceptanceRate !== undefined) {
      const acceptanceRate = calculateAcceptanceRate(session);
      if (filter.minAcceptanceRate !== undefined && acceptanceRate < filter.minAcceptanceRate) {
        return false;
      }
      if (filter.maxAcceptanceRate !== undefined && acceptanceRate > filter.maxAcceptanceRate) {
        return false;
      }
    }

    // 按项目过滤
    if (filter.projectId && session.project_id !== filter.projectId) {
      return false;
    }

    // 按日期范围过滤
    if (filter.startDate && session.started_at < filter.startDate) {
      return false;
    }
    if (filter.endDate && session.started_at > filter.endDate) {
      return false;
    }

    // 按关键词搜索
    if (filter.keyword) {
      const keyword = filter.keyword.toLowerCase();
      const searchable = [
        session.session_id,
        session.model,
        session.project_name,
      ].filter(Boolean).join(' ').toLowerCase();

      if (!searchable.includes(keyword)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * 计算会话的接受率
 */
function calculateAcceptanceRate(session: Session): number {
  const total = session.tools_proposed;
  if (total === 0) return 0;
  return ((session.tools_accepted + session.tools_modified) / total) * 100;
}

/**
 * 对会话进行排序
 */
export function sortSessions(
  sessions: Session[],
  sortBy: 'started_at' | 'total_cost' | 'acceptanceRate' = 'started_at',
  order: 'asc' | 'desc' = 'desc'
): Session[] {
  return [...sessions].sort((a, b) => {
    let valueA: number;
    let valueB: number;

    switch (sortBy) {
      case 'total_cost':
        valueA = a.total_cost || 0;
        valueB = b.total_cost || 0;
        break;
      case 'acceptanceRate':
        valueA = calculateAcceptanceRate(a);
        valueB = calculateAcceptanceRate(b);
        break;
      case 'started_at':
      default:
        valueA = a.started_at;
        valueB = b.started_at;
        break;
    }

    if (order === 'asc') {
      return valueA - valueB;
    }
    return valueB - valueA;
  });
}

/**
 * 对会话进行分页
 */
export function paginateSessions(
  sessions: Session[],
  page: number,
  pageSize: number
): PageResult<Session> {
  const total = sessions.length;
  const totalPages = Math.ceil(total / pageSize);
  const offset = (page - 1) * pageSize;

  const items = sessions.slice(offset, offset + pageSize);

  return {
    items,
    total,
    page,
    pageSize,
    hasMore: page < totalPages,
  };
}

/**
 * 按成本范围过滤
 */
export function filterByCostRange(
  sessions: Session[],
  minCost: number,
  maxCost: number
): Session[] {
  return sessions.filter(
    s => (s.total_cost || 0) >= minCost && (s.total_cost || 0) <= maxCost
  );
}

/**
 * 按接受率范围过滤
 */
export function filterByAcceptanceRate(
  sessions: Session[],
  minRate: number,
  maxRate: number
): Session[] {
  return sessions.filter(s => {
    const rate = calculateAcceptanceRate(s);
    return rate >= minRate && rate <= maxRate;
  });
}

/**
 * 搜索会话
 */
export function searchSessions(sessions: Session[], keyword: string): Session[] {
  if (!keyword.trim()) {
    return sessions;
  }

  const lowerKeyword = keyword.toLowerCase();

  return sessions.filter(session => {
    const searchableText = [
      session.session_id,
      session.model,
      session.project_name,
      session.project_id,
    ].filter(Boolean).join(' ').toLowerCase();

    return searchableText.includes(lowerKeyword);
  });
}

/**
 * 获取会话的接受率（带格式）
 */
export function getAcceptanceRateDisplay(session: Session): string {
  const rate = calculateAcceptanceRate(session);
  return `${rate.toFixed(1)}%`;
}

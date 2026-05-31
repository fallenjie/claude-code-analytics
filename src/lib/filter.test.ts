import { describe, it, expect } from 'vitest';
import {
  filterSessions,
  sortSessions,
  paginateSessions,
  filterByCostRange,
  filterByAcceptanceRate,
  searchSessions
} from './filter';
import type { Session, SessionFilter } from '../types';

describe('会话过滤与排序', () => {
  const mockSessions: Session[] = [
    {
      session_id: 'sess_1',
      model: 'claude-opus-4-5',
      started_at: new Date('2026-05-29T10:00:00Z').getTime(),
      status: 'completed',
      input_tokens: 1000000,
      output_tokens: 500000,
      total_cost: 0.5,
      tools_proposed: 10,
      tools_accepted: 8,
      tools_rejected: 2,
      tools_modified: 0,
      tools_skipped: 0,
    },
    {
      session_id: 'sess_2',
      model: 'claude-sonnet-4-5',
      started_at: new Date('2026-05-30T10:00:00Z').getTime(),
      status: 'completed',
      input_tokens: 500000,
      output_tokens: 250000,
      total_cost: 3.0,
      tools_proposed: 5,
      tools_accepted: 4,
      tools_rejected: 1,
      tools_modified: 0,
      tools_skipped: 0,
    },
    {
      session_id: 'sess_3',
      model: 'claude-opus-4-5',
      started_at: new Date('2026-05-30T14:00:00Z').getTime(),
      status: 'active',
      input_tokens: 200000,
      output_tokens: 100000,
      total_cost: 6.0,
      tools_proposed: 3,
      tools_accepted: 1,
      tools_rejected: 2,
      tools_modified: 0,
      tools_skipped: 0,
    },
  ];

  describe('filterSessions', () => {
    it('按模型过滤', () => {
      const filter: SessionFilter = { model: 'claude-opus' };
      const result = filterSessions(mockSessions, filter);
      expect(result).toHaveLength(2);
    });

    it('按成本范围过滤', () => {
      const filter: SessionFilter = { minCost: 1, maxCost: 5 };
      const result = filterSessions(mockSessions, filter);
      expect(result).toHaveLength(1);
      expect(result[0].session_id).toBe('sess_2');
    });

    it('按接受率过滤', () => {
      const filter: SessionFilter = { minAcceptanceRate: 70 };
      const result = filterSessions(mockSessions, filter);
      // sess_1: 80%, sess_2: 80%, sess_3: 33%
      expect(result).toHaveLength(2);
    });

    it('按日期范围过滤', () => {
      const filter: SessionFilter = {
        startDate: new Date('2026-05-30').getTime(),
        endDate: new Date('2026-05-30T23:59:59Z').getTime(),
      };
      const result = filterSessions(mockSessions, filter);
      expect(result).toHaveLength(2);
    });

    it('组合多个过滤器', () => {
      const filter: SessionFilter = {
        model: 'claude-opus',
        minCost: 1,
      };
      const result = filterSessions(mockSessions, filter);
      expect(result).toHaveLength(1);
      expect(result[0].session_id).toBe('sess_3');
    });

    it('空过滤器返回所有会话', () => {
      const result = filterSessions(mockSessions, {});
      expect(result).toHaveLength(3);
    });
  });

  describe('sortSessions', () => {
    it('按开始时间降序排序（默认）', () => {
      const result = sortSessions(mockSessions);
      expect(result[0].session_id).toBe('sess_3'); // 最新
      expect(result[2].session_id).toBe('sess_1'); // 最老
    });

    it('按成本升序排序', () => {
      const result = sortSessions(mockSessions, 'total_cost', 'asc');
      expect(result[0].session_id).toBe('sess_1'); // 0.5
      expect(result[2].session_id).toBe('sess_3'); // 6.0
    });

    it('按接受率降序排序', () => {
      const result = sortSessions(mockSessions, 'acceptanceRate', 'desc');
      // sess_1: 80%, sess_2: 80%, sess_3: 33%
      expect(result[0].session_id).toBe('sess_1');
    });
  });

  describe('paginateSessions', () => {
    it('返回第一页', () => {
      const result = paginateSessions(mockSessions, 1, 2);
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.hasMore).toBe(true);
    });

    it('返回最后一页', () => {
      const result = paginateSessions(mockSessions, 2, 2);
      expect(result.items).toHaveLength(1);
      expect(result.hasMore).toBe(false);
    });

    it('页码超出范围返回空', () => {
      const result = paginateSessions(mockSessions, 10, 2);
      expect(result.items).toHaveLength(0);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('filterByCostRange', () => {
    it('低成本会话', () => {
      const result = filterByCostRange(mockSessions, 0, 1);
      expect(result).toHaveLength(1);
    });

    it('中高成本会话', () => {
      const result = filterByCostRange(mockSessions, 2, 10);
      expect(result).toHaveLength(2);
    });
  });

  describe('filterByAcceptanceRate', () => {
    it('高接受率会话', () => {
      const result = filterByAcceptanceRate(mockSessions, 70, 100);
      expect(result).toHaveLength(2);
    });

    it('低接受率会话', () => {
      const result = filterByAcceptanceRate(mockSessions, 0, 50);
      expect(result).toHaveLength(1);
      expect(result[0].session_id).toBe('sess_3');
    });
  });

  describe('searchSessions', () => {
    it('按会话ID搜索', () => {
      const result = searchSessions(mockSessions, 'sess_1');
      expect(result).toHaveLength(1);
    });

    it('按模型名称搜索', () => {
      const result = searchSessions(mockSessions, 'sonnet');
      expect(result).toHaveLength(1);
    });

    it('不区分大小写', () => {
      const result = searchSessions(mockSessions, 'OPUS');
      expect(result).toHaveLength(2);
    });

    it('无匹配返回空', () => {
      const result = searchSessions(mockSessions, 'nonexistent');
      expect(result).toHaveLength(0);
    });
  });
});

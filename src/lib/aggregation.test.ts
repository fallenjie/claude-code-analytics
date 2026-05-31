import { describe, it, expect } from 'vitest';
import {
  aggregateDailyCosts,
  aggregateByModel,
  aggregateByProject,
  calculateTrend,
  getTotalCost,
  getTotalTokens
} from './aggregation';
import type { Session } from '../types';

describe('数据聚合', () => {
  const mockSessions: Session[] = [
    {
      session_id: 'sess_1',
      model: 'claude-opus-4-5',
      started_at: new Date('2026-05-29T10:00:00').getTime(),
      status: 'completed',
      input_tokens: 1000000,
      output_tokens: 500000,
      total_cost: 18.75,
      tools_proposed: 10,
      tools_accepted: 8,
      tools_rejected: 2,
      tools_modified: 0,
      tools_skipped: 0,
    },
    {
      session_id: 'sess_2',
      model: 'claude-opus-4-5',
      started_at: new Date('2026-05-30T10:00:00').getTime(),
      status: 'completed',
      input_tokens: 800000,
      output_tokens: 400000,
      total_cost: 15,
      tools_proposed: 8,
      tools_accepted: 6,
      tools_rejected: 2,
      tools_modified: 0,
      tools_skipped: 0,
    },
    {
      session_id: 'sess_3',
      model: 'claude-sonnet-4-5',
      started_at: new Date('2026-05-30T14:00:00').getTime(),
      status: 'completed',
      input_tokens: 500000,
      output_tokens: 250000,
      total_cost: 5.625,
      tools_proposed: 5,
      tools_accepted: 4,
      tools_rejected: 1,
      tools_modified: 0,
      tools_skipped: 0,
    },
  ];

  describe('aggregateDailyCosts', () => {
    it('按日期聚合成本', () => {
      const result = aggregateDailyCosts(mockSessions);

      expect(result.get('2026-05-29')).toBeCloseTo(18.75);
      expect(result.get('2026-05-30')).toBeCloseTo(20.625); // 15 + 5.625
    });

    it('处理空数组', () => {
      const result = aggregateDailyCosts([]);
      expect(result.size).toBe(0);
    });
  });

  describe('aggregateByModel', () => {
    it('按模型聚合成本', () => {
      const result = aggregateByModel(mockSessions);

      expect(result.get('claude-opus-4-5')).toBeCloseTo(33.75);
      expect(result.get('claude-sonnet-4-5')).toBeCloseTo(5.625);
    });

    it('计算各模型的工具接受率', () => {
      const acceptanceRates = new Map<string, number>();
      for (const [model, cost] of aggregateByModel(mockSessions)) {
        const sessions = mockSessions.filter(s => s.model === model);
        const total = sessions.reduce((sum, s) => sum + s.tools_proposed, 0);
        const accepted = sessions.reduce((sum, s) => sum + s.tools_accepted, 0);
        acceptanceRates.set(model, total > 0 ? (accepted / total) * 100 : 0);
      }

      expect(acceptanceRates.get('claude-opus-4-5')).toBeCloseTo(77.8, 1);
    });
  });

  describe('getTotalCost', () => {
    it('计算总会话成本', () => {
      const total = getTotalCost(mockSessions);
      expect(total).toBeCloseTo(39.375, 2);
    });

    it('处理空数组', () => {
      const total = getTotalCost([]);
      expect(total).toBe(0);
    });
  });

  describe('getTotalTokens', () => {
    it('计算总 token 数量', () => {
      const tokens = getTotalTokens(mockSessions);
      // (1000K + 500K) + (800K + 400K) + (500K + 250K) = 1500K + 1200K + 750K = 3450K
      expect(tokens).toBe(3450000);
    });

    it('分别计算 input 和 output tokens', () => {
      const tokens = getTotalTokens(mockSessions, 'input');
      // 1000K + 800K + 500K = 2300K
      expect(tokens).toBe(2300000);
    });
  });

  describe('calculateTrend', () => {
    it('计算正向增长趋势', () => {
      const current = 100;
      const previous = 80;
      const trend = calculateTrend(current, previous);

      expect(trend.percentage).toBeCloseTo(25);
      expect(trend.direction).toBe('up');
    });

    it('计算负向下降趋势', () => {
      const current = 80;
      const previous = 100;
      const trend = calculateTrend(current, previous);

      expect(trend.percentage).toBeCloseTo(-20);
      expect(trend.direction).toBe('down');
    });

    it('处理零基准值', () => {
      const trend = calculateTrend(100, 0);
      expect(trend.percentage).toBeNull();
      expect(trend.direction).toBe('up');
    });
  });
});

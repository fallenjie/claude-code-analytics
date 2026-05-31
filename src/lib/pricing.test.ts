import { describe, it, expect } from 'vitest';
import { calculateSessionCost, calculateTokenCost } from './pricing';

describe('成本计算', () => {
  describe('calculateTokenCost', () => {
    it('正确计算 input token 成本', () => {
      // Opus: $15/1M input
      const cost = calculateTokenCost(1000000, 15, 0);
      expect(cost).toBe(15);
    });

    it('正确计算 output token 成本', () => {
      // Opus: $75/1M output
      const cost = calculateTokenCost(0, 0, 1000000, 75);
      expect(cost).toBe(75);
    });

    it('正确计算混合 token 成本', () => {
      // 500K input + 500K output
      const cost = calculateTokenCost(500000, 15, 500000, 75);
      expect(cost).toBeCloseTo(45, 2); // 7.5 + 37.5 = 45
    });

    it('处理零 token', () => {
      const cost = calculateTokenCost(0, 15, 0, 75);
      expect(cost).toBe(0);
    });
  });

  describe('calculateSessionCost', () => {
    it('使用 metadata 中的 total_cost 如果存在', () => {
      const metadata = {
        session_id: 'test-123',
        model: 'claude-opus-4-5',
        started_at: Date.now(),
        status: 'completed' as const,
        total_cost: 2.5,
        input_tokens: 100000,
        output_tokens: 200000,
      };
      const cost = calculateSessionCost(metadata);
      expect(cost).toBe(2.5);
    });

    it('当 total_cost 不存在时根据 token 计算', () => {
      const metadata = {
        session_id: 'test-123',
        model: 'claude-sonnet-4-5',
        started_at: Date.now(),
        status: 'completed' as const,
        input_tokens: 1000000, // 1M
        output_tokens: 500000,  // 0.5M
      };
      // Sonnet: $3/1M input, $15/1M output
      const cost = calculateSessionCost(metadata);
      // 1M * 3 + 0.5M * 15 = 3 + 7.5 = 10.5
      expect(cost).toBe(10.5);
    });

    it('处理 Haiku 模型的低成本计算', () => {
      const metadata = {
        session_id: 'test-123',
        model: 'claude-haiku-4-5',
        started_at: Date.now(),
        status: 'completed' as const,
        input_tokens: 1000000,
        output_tokens: 1000000,
      };
      // Haiku: $0.25/1M input, $1.25/1M output
      const cost = calculateSessionCost(metadata);
      // 1M * 0.25 + 1M * 1.25 = 0.25 + 1.25 = 1.5
      expect(cost).toBe(1.5);
    });
  });
});

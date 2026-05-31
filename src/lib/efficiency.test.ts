import { describe, it, expect } from 'vitest';
import {
  calculateEfficiencyScore,
  calculateAcceptanceScore,
  calculateSpeedScore,
  calculateFirstTryScore,
  calculateOverallScore,
  getScoreGrade,
  ToolEfficiency
} from './efficiency';

describe('效率评分', () => {
  describe('calculateAcceptanceScore', () => {
    it('100% 接受率得满分 100', () => {
      expect(calculateAcceptanceScore(100)).toBe(100);
    });

    it('80% 接受率得 80 分', () => {
      expect(calculateAcceptanceScore(80)).toBe(80);
    });

    it('0% 接受率得 0 分', () => {
      expect(calculateAcceptanceScore(0)).toBe(0);
    });
  });

  describe('calculateSpeedScore', () => {
    it('小于 500ms 得满分', () => {
      expect(calculateSpeedScore(300)).toBe(100);
      expect(calculateSpeedScore(500)).toBe(100);
    });

    it('2000ms 得 0 分', () => {
      expect(calculateSpeedScore(2000)).toBe(0);
    });

    it('1000ms 线性得分约 66.7', () => {
      const score = calculateSpeedScore(1000);
      // (2000-1000)/(2000-500)*100 = 1000/1500*100 = 66.67
      expect(score).toBeCloseTo(66.7, 1);
    });
  });

  describe('calculateFirstTryScore', () => {
    it('100% 一次通过率得满分', () => {
      expect(calculateFirstTryScore(100)).toBe(100);
    });

    it('70% 得 0 分（警告阈值）', () => {
      expect(calculateFirstTryScore(70)).toBe(0);
    });

    it('90% 以上得满分 100', () => {
      const score = calculateFirstTryScore(90);
      expect(score).toBe(100);
    });

    it('80% 线性得分约 50', () => {
      const score = calculateFirstTryScore(80);
      // (80-70)/(90-70)*100 = 10/20*100 = 50
      expect(score).toBe(50);
    });
  });

  describe('calculateOverallScore', () => {
    it('三个指标各占 40/30/30 权重', () => {
      const score = calculateOverallScore(100, 100, 100);
      expect(score).toBe(100);
    });

    it('正确计算加权平均', () => {
      // 100 * 0.4 + 100 * 0.3 + 100 * 0.3 = 100
      const score1 = calculateOverallScore(100, 100, 100);
      expect(score1).toBe(100);

      // 50 * 0.4 + 100 * 0.3 + 100 * 0.3 = 80
      const score2 = calculateOverallScore(50, 100, 100);
      expect(score2).toBe(80);
    });
  });

  describe('calculateEfficiencyScore', () => {
    it('计算完整效率评分', () => {
      const score = calculateEfficiencyScore({
        acceptanceRate: 90,
        averageResponseTime: 500,
        firstTrySuccessRate: 95,
      });

      expect(score.acceptanceScore).toBe(90);
      expect(score.speedScore).toBe(100);
      expect(score.firstTryScore).toBeGreaterThan(0);
      expect(score.overallScore).toBeGreaterThan(0);
    });

    it('返回所有评分字段', () => {
      const score = calculateEfficiencyScore({
        acceptanceRate: 80,
        averageResponseTime: 1000,
        firstTrySuccessRate: 85,
      });

      expect(score).toHaveProperty('acceptanceScore');
      expect(score).toHaveProperty('speedScore');
      expect(score).toHaveProperty('firstTryScore');
      expect(score).toHaveProperty('overallScore');
      expect(score).toHaveProperty('grade');
    });
  });

  describe('getScoreGrade', () => {
    it('90+ 分为 A', () => {
      expect(getScoreGrade(95)).toBe('A');
      expect(getScoreGrade(90)).toBe('A');
    });

    it('80-89 分为 B', () => {
      expect(getScoreGrade(85)).toBe('B');
      expect(getScoreGrade(80)).toBe('B');
    });

    it('70-79 分为 C', () => {
      expect(getScoreGrade(75)).toBe('C');
      expect(getScoreGrade(70)).toBe('C');
    });

    it('60-69 分为 D', () => {
      expect(getScoreGrade(65)).toBe('D');
      expect(getScoreGrade(60)).toBe('D');
    });

    it('60 以下为 F', () => {
      expect(getScoreGrade(59)).toBe('F');
      expect(getScoreGrade(0)).toBe('F');
    });
  });
});

import { describe, it, expect } from 'vitest';
import {
  createBudget,
  checkBudgetAlert,
  getBudgetProgress,
  getRemainingBudget,
  isBudgetExceeded,
  resetBudgetForNewCycle,
  getAlertLevel
} from './budget';
import type { Budget, Alert, AlertLevel } from '../types';

describe('预算管理', () => {
  const mockBudget: Budget = {
    budget_id: 'budget_monthly',
    cycle_type: 'monthly',
    amount: 100,
    warning_threshold: 0.8,
    critical_threshold: 0.95,
    notification_enabled: true,
  };

  describe('createBudget', () => {
    it('创建月度预算', () => {
      const budget = createBudget('monthly', 100);
      expect(budget.cycle_type).toBe('monthly');
      expect(budget.amount).toBe(100);
      expect(budget.warning_threshold).toBe(0.8);
      expect(budget.critical_threshold).toBe(0.95);
    });

    it('创建年度预算', () => {
      const budget = createBudget('yearly', 1000);
      expect(budget.cycle_type).toBe('yearly');
      expect(budget.amount).toBe(1000);
    });
  });

  describe('getBudgetProgress', () => {
    it('计算预算进度百分比', () => {
      const progress = getBudgetProgress(80, mockBudget);
      expect(progress).toBe(80);
    });

    it('处理超额', () => {
      const progress = getBudgetProgress(150, mockBudget);
      expect(progress).toBe(150);
    });

    it('零预算返回0', () => {
      const zeroBudget = { ...mockBudget, amount: 0 };
      const progress = getBudgetProgress(50, zeroBudget);
      expect(progress).toBe(0);
    });
  });

  describe('getRemainingBudget', () => {
    it('计算剩余预算', () => {
      const remaining = getRemainingBudget(80, mockBudget);
      expect(remaining).toBe(20);
    });

    it('超额返回负数', () => {
      const remaining = getRemainingBudget(120, mockBudget);
      expect(remaining).toBe(-20);
    });
  });

  describe('isBudgetExceeded', () => {
    it('未超出返回 false', () => {
      expect(isBudgetExceeded(80, mockBudget)).toBe(false);
    });

    it('刚好达到返回 false', () => {
      expect(isBudgetExceeded(100, mockBudget)).toBe(false);
    });

    it('超出返回 true', () => {
      expect(isBudgetExceeded(101, mockBudget)).toBe(true);
    });
  });

  describe('getAlertLevel', () => {
    it('正常消费返回 null', () => {
      expect(getAlertLevel(50, mockBudget)).toBeNull();
    });

    it('80% 触发 warning', () => {
      expect(getAlertLevel(80, mockBudget)).toBe('warning');
    });

    it('95% 触发 critical', () => {
      expect(getAlertLevel(95, mockBudget)).toBe('critical');
    });

    it('超出预算触发 exceeded', () => {
      expect(getAlertLevel(101, mockBudget)).toBe('exceeded');
    });
  });

  describe('checkBudgetAlert', () => {
    it('不触发重复预警', () => {
      // 之前已有 warning 级别的预警
      const existingAlerts: Alert[] = [
        {
          alert_id: 'alert_1',
          budget_id: 'budget_monthly',
          alert_level: 'warning',
          triggered_at: Date.now() - 1000,
          cost_at_alert: 80,
          threshold_value: 80,
          acknowledged: false,
        },
      ];

      const alert = checkBudgetAlert(82, mockBudget, existingAlerts);
      // 不应重复触发
      expect(alert).toBeNull();
    });

    it('新周期重置后可以再次触发', () => {
      const existingAlerts: Alert[] = [
        {
          alert_id: 'alert_1',
          budget_id: 'budget_monthly',
          alert_level: 'warning',
          triggered_at: Date.now() - 1000,
          cost_at_alert: 80,
          threshold_value: 80,
          acknowledged: false,
        },
      ];

      // 新周期检查
      const alert = checkBudgetAlert(82, mockBudget, existingAlerts, true);
      expect(alert).toBeNull(); // 应该被过滤
    });

    it('首次触发 warning', () => {
      const alert = checkBudgetAlert(85, mockBudget, []);
      expect(alert).toBeDefined();
      expect(alert!.alert_level).toBe('warning');
      expect(alert!.cost_at_alert).toBe(85);
    });
  });

  describe('resetBudgetForNewCycle', () => {
    it('识别月度新周期', () => {
      const lastReset = new Date('2026-05-01').getTime();
      const now = new Date('2026-06-01').getTime();
      expect(resetBudgetForNewCycle(lastReset, now, 'monthly')).toBe(true);
    });

    it('同月内不需要重置', () => {
      const lastReset = new Date('2026-05-15').getTime();
      const now = new Date('2026-05-20').getTime();
      expect(resetBudgetForNewCycle(lastReset, now, 'monthly')).toBe(false);
    });

    it('周周期周日开始重置', () => {
      const lastReset = new Date('2026-05-25').getTime(); // 周日
      const now = new Date('2026-06-01').getTime(); // 次周日
      expect(resetBudgetForNewCycle(lastReset, now, 'weekly')).toBe(true);
    });
  });
});

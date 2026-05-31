import type { Budget, Alert, AlertLevel } from '../types';

/**
 * 创建预算配置
 */
export function createBudget(
  cycleType: Budget['cycle_type'],
  amount: number,
  options?: {
    warningThreshold?: number;
    criticalThreshold?: number;
  }
): Budget {
  return {
    budget_id: `budget_${cycleType}_${Date.now()}`,
    cycle_type: cycleType,
    amount,
    warning_threshold: options?.warningThreshold ?? 0.8,
    critical_threshold: options?.criticalThreshold ?? 0.95,
    notification_enabled: true,
  };
}

/**
 * 获取预算进度百分比
 */
export function getBudgetProgress(currentSpend: number, budget: Budget): number {
  if (budget.amount <= 0) return 0;
  return Math.round((currentSpend / budget.amount) * 100 * 10) / 10;
}

/**
 * 获取剩余预算
 */
export function getRemainingBudget(currentSpend: number, budget: Budget): number {
  return budget.amount - currentSpend;
}

/**
 * 判断是否超出预算
 */
export function isBudgetExceeded(currentSpend: number, budget: Budget): boolean {
  return currentSpend > budget.amount;
}

/**
 * 获取预警级别
 */
export function getAlertLevel(
  currentSpend: number,
  budget: Budget
): AlertLevel | null {
  const progress = getBudgetProgress(currentSpend, budget);

  if (progress >= 100) {
    return 'exceeded';
  }
  if (progress >= budget.critical_threshold * 100) {
    return 'critical';
  }
  if (progress >= budget.warning_threshold * 100) {
    return 'warning';
  }
  return null;
}

/**
 * 检查是否触发新的预警
 * @param currentSpend 当前消费
 * @param budget 预算配置
 * @param existingAlerts 已有预警列表
 * @param isNewCycle 是否为新周期
 */
export function checkBudgetAlert(
  currentSpend: number,
  budget: Budget,
  existingAlerts: Alert[],
  isNewCycle: boolean = false
): Alert | null {
  const alertLevel = getAlertLevel(currentSpend, budget);
  if (!alertLevel) return null;

  // 新周期：只检查是否超出预算
  if (isNewCycle) {
    if (alertLevel === 'exceeded') {
      return createAlert(budget, 'exceeded', currentSpend, budget.amount);
    }
    return null;
  }

  // 检查是否已有同级别预警
  const hasExistingAlert = existingAlerts.some(
    alert =>
      alert.budget_id === budget.budget_id &&
      alert.alert_level === alertLevel &&
      !alert.acknowledged
  );

  if (hasExistingAlert) return null;

  // 创建新预警
  const threshold = alertLevel === 'exceeded'
    ? budget.amount
    : alertLevel === 'critical'
      ? budget.critical_threshold * budget.amount
      : budget.warning_threshold * budget.amount;

  return createAlert(budget, alertLevel, currentSpend, threshold);
}

/**
 * 创建预警记录
 */
function createAlert(
  budget: Budget,
  level: AlertLevel,
  costAtAlert: number,
  thresholdValue: number
): Alert {
  return {
    alert_id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    budget_id: budget.budget_id,
    alert_level: level,
    triggered_at: Date.now(),
    cost_at_alert: costAtAlert,
    threshold_value: thresholdValue,
    acknowledged: false,
  };
}

/**
 * 判断是否需要重置预算周期
 */
export function resetBudgetForNewCycle(
  lastResetTime: number,
  currentTime: number,
  cycleType: Budget['cycle_type']
): boolean {
  const lastDate = new Date(lastResetTime);
  const currentDate = new Date(currentTime);

  switch (cycleType) {
    case 'daily':
      return lastDate.toDateString() !== currentDate.toDateString();

    case 'weekly':
      const lastWeek = getWeekNumber(lastDate);
      const currentWeek = getWeekNumber(currentDate);
      return lastWeek !== currentWeek;

    case 'monthly':
      return (
        lastDate.getFullYear() !== currentDate.getFullYear() ||
        lastDate.getMonth() !== currentDate.getMonth()
      );

    case 'yearly':
      return lastDate.getFullYear() !== currentDate.getFullYear();

    default:
      return false;
  }
}

/**
 * 获取年份中的周数
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * 确认预警
 */
export function acknowledgeAlert(alert: Alert): Alert {
  return {
    ...alert,
    acknowledged: true,
    acknowledged_at: Date.now(),
  };
}

/**
 * 计算预估月末成本
 */
export function estimateMonthEndCost(
  currentSpend: number,
  currentDayOfMonth: number
): number {
  if (currentDayOfMonth <= 0) return currentSpend;

  const daysInMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0
  ).getDate();

  const dailyAverage = currentSpend / currentDayOfMonth;
  const remainingDays = daysInMonth - currentDayOfMonth;

  return currentSpend + dailyAverage * remainingDays;
}

/**
 * 效率评分模块
 * 根据 PRD 中的效率指标体系计算评分
 */

// 评分权重
const WEIGHTS = {
  acceptance: 0.4,
  speed: 0.3,
  firstTry: 0.3,
};

// 评分阈值
const THRESHOLDS = {
  speed: {
    excellent: 500,  // ms 以内满分
    warning: 2000,    // ms 以外 0 分
  },
  firstTry: {
    excellent: 90,   // % 以上满分
    warning: 70,     // % 以下 0 分
  },
};

export interface EfficiencyScoreInput {
  acceptanceRate: number;      // 工具接受率 (0-100)
  averageResponseTime: number; // 平均响应时间 (ms)
  firstTrySuccessRate: number; // 一次通过率 (0-100)
}

export interface EfficiencyScore {
  acceptanceScore: number;
  speedScore: number;
  firstTryScore: number;
  overallScore: number;
  grade: string;
}

/**
 * 计算接受率评分 (0-100)
 * 线性映射：100% -> 100分
 */
export function calculateAcceptanceScore(acceptanceRate: number): number {
  return Math.max(0, Math.min(100, acceptanceRate));
}

/**
 * 计算响应速度评分 (0-100)
 * 500ms 以内满分，2000ms 以上 0 分，线性插值
 */
export function calculateSpeedScore(averageResponseTime: number): number {
  if (averageResponseTime <= THRESHOLDS.speed.excellent) {
    return 100;
  }
  if (averageResponseTime >= THRESHOLDS.speed.warning) {
    return 0;
  }

  // 线性插值: (2000 - time) / (2000 - 500) * 100
  const range = THRESHOLDS.speed.warning - THRESHOLDS.speed.excellent;
  const score = ((THRESHOLDS.speed.warning - averageResponseTime) / range) * 100;
  return Math.round(score * 10) / 10;
}

/**
 * 计算一次通过率评分 (0-100)
 * 90% 以上满分，70% 以下 0 分，线性插值
 */
export function calculateFirstTryScore(firstTrySuccessRate: number): number {
  if (firstTrySuccessRate >= THRESHOLDS.firstTry.excellent) {
    return 100;
  }
  if (firstTrySuccessRate <= THRESHOLDS.firstTry.warning) {
    return 0;
  }

  const range = THRESHOLDS.firstTry.excellent - THRESHOLDS.firstTry.warning;
  const score = ((firstTrySuccessRate - THRESHOLDS.firstTry.warning) / range) * 100;
  return Math.round(score * 10) / 10;
}

/**
 * 计算综合评分
 */
export function calculateOverallScore(
  acceptanceScore: number,
  speedScore: number,
  firstTryScore: number
): number {
  const overall =
    acceptanceScore * WEIGHTS.acceptance +
    speedScore * WEIGHTS.speed +
    firstTryScore * WEIGHTS.firstTry;
  return Math.round(overall * 10) / 10;
}

/**
 * 根据分数获取等级
 */
export function getScoreGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/**
 * 计算完整效率评分
 */
export function calculateEfficiencyScore(input: EfficiencyScoreInput): EfficiencyScore {
  const acceptanceScore = calculateAcceptanceScore(input.acceptanceRate);
  const speedScore = calculateSpeedScore(input.averageResponseTime);
  const firstTryScore = calculateFirstTryScore(input.firstTrySuccessRate);
  const overallScore = calculateOverallScore(acceptanceScore, speedScore, firstTryScore);
  const grade = getScoreGrade(overallScore);

  return {
    acceptanceScore,
    speedScore,
    firstTryScore,
    overallScore,
    grade,
  };
}

/**
 * 工具效率数据
 */
export interface ToolEfficiency {
  toolName: string;
  callCount: number;
  acceptanceRate: number;
  averageExecutionTime: number;
  firstTrySuccessRate: number;
  score: number;
  grade: string;
}

/**
 * 计算单个工具的效率评分
 */
export function calculateToolEfficiency(
  toolName: string,
  stats: {
    callCount: number;
    accepted: number;
    rejected: number;
    modified: number;
    totalExecutionTime: number;
    firstTrySuccess: number;
  }
): ToolEfficiency {
  const acceptanceRate = stats.callCount > 0
    ? ((stats.accepted + stats.modified) / stats.callCount) * 100
    : 0;

  const averageExecutionTime = stats.accepted > 0
    ? stats.totalExecutionTime / stats.accepted
    : 0;

  const firstTrySuccessRate = stats.accepted > 0
    ? (stats.firstTrySuccess / stats.accepted) * 100
    : 0;

  const { overallScore, grade } = calculateEfficiencyScore({
    acceptanceRate,
    averageResponseTime: averageExecutionTime,
    firstTrySuccessRate,
  });

  return {
    toolName,
    callCount: stats.callCount,
    acceptanceRate: Math.round(acceptanceRate * 10) / 10,
    averageExecutionTime: Math.round(averageExecutionTime),
    firstTrySuccessRate: Math.round(firstTrySuccessRate * 10) / 10,
    score: overallScore,
    grade,
  };
}

/**
 * 格式化分数显示
 */
export function formatScoreDisplay(score: number): string {
  return `${score.toFixed(1)}/100`;
}

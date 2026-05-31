/**
 * 拒绝原因分类
 * 基于关键词匹配进行启发式分类
 */

// 拒绝原因枚举
export enum RejectionReason {
  SECURITY = 'security',
  REDUNDANT = 'redundant',
  INVALID_PARAMS = 'invalid_params',
  OUT_OF_SCOPE = 'out_of_scope',
  UNKNOWN = 'unknown',
}

// 分类规则
const CLASSIFICATION_PATTERNS: Record<RejectionReason, RegExp[]> = {
  [RejectionReason.SECURITY]: [
    /security/i,
    /dangerous/i,
    /harmful/i,
    /malicious/i,
    /unsafe/i,
  ],
  [RejectionReason.REDUNDANT]: [
    /already\s*(done|exists|created)/i,
    /duplicate/i,
    /redundant/i,
    /no\s*need/i,
  ],
  [RejectionReason.INVALID_PARAMS]: [
    /invalid/i,
    /wrong\s*format/i,
    /missing.*argument/i,
    /invalid.*parameter/i,
    /syntax\s*error/i,
  ],
  [RejectionReason.OUT_OF_SCOPE]: [
    /not\s*related/i,
    /outside/i,
    /out\s*of\s*scope/i,
    /not\s*part\s*of/i,
    /not\s*in\s*scope/i,
  ],
  [RejectionReason.UNKNOWN]: [], // 最后兜底
};

/**
 * 分类拒绝原因
 */
export function classifyRejectionReason(reason: string): RejectionReason {
  if (!reason || reason.trim() === '') {
    return RejectionReason.UNKNOWN;
  }

  // 按优先级检查各分类
  for (const [category, patterns] of Object.entries(CLASSIFICATION_PATTERNS)) {
    if (category === RejectionReason.UNKNOWN) continue; // 跳过 unknown 作为兜底

    for (const pattern of patterns) {
      if (pattern.test(reason)) {
        return category as RejectionReason;
      }
    }
  }

  return RejectionReason.UNKNOWN;
}

/**
 * 获取拒绝原因的中文标签
 */
export function getRejectionReasonLabel(reason: RejectionReason): string {
  const labels: Record<RejectionReason, string> = {
    [RejectionReason.SECURITY]: '安全考虑',
    [RejectionReason.REDUNDANT]: '重复操作',
    [RejectionReason.INVALID_PARAMS]: '参数错误',
    [RejectionReason.OUT_OF_SCOPE]: '超出范围',
    [RejectionReason.UNKNOWN]: '未知原因',
  };
  return labels[reason] || '未知原因';
}

/**
 * 统计拒绝原因分布
 * @param reasons 包含原因和计数的数据
 * @param asPercentage 返回百分比而非计数
 */
export function getRejectionReasonStats(
  reasons: { reason: string; count: number }[],
  asPercentage: boolean = false
): Map<RejectionReason, number> {
  const stats = new Map<RejectionReason, number>();

  for (const { reason, count } of reasons) {
    const category = classifyRejectionReason(reason);
    const current = stats.get(category) || 0;
    stats.set(category, current + count);
  }

  if (asPercentage) {
    const total = Array.from(stats.values()).reduce((a, b) => a + b, 0);
    if (total > 0) {
      const percentageStats = new Map<RejectionReason, number>();
      for (const [key, value] of stats) {
        percentageStats.set(key, Math.round((value / total) * 100 * 10) / 10);
      }
      return percentageStats;
    }
  }

  return stats;
}

/**
 * 判断是否需要用户关注
 */
export function isHighPriorityRejection(reason: RejectionReason): boolean {
  return reason === RejectionReason.SECURITY;
}

/**
 * 获取建议的替代方案描述
 */
export function getSuggestionForRejection(reason: RejectionReason): string | null {
  const suggestions: Partial<Record<RejectionReason, string>> = {
    [RejectionReason.SECURITY]: '请检查操作是否涉及敏感数据或系统调用',
    [RejectionReason.REDUNDANT]: '该操作可能已执行，请确认后再试',
    [RejectionReason.INVALID_PARAMS]: '请检查参数格式是否正确',
    [RejectionReason.OUT_OF_SCOPE]: '请确保操作在当前任务范围内',
  };
  return suggestions[reason] || null;
}

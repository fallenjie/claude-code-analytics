import type { SessionMetadata, ModelPricing } from '../types';

// 模型定价表
export const MODEL_PRICING: Record<string, ModelPricing> = {
  'claude-opus-4': { model: 'claude-opus-4', input_price: 15, output_price: 75 },
  'claude-opus-4-5': { model: 'claude-opus-4-5', input_price: 15, output_price: 75 },
  'claude-sonnet-4': { model: 'claude-sonnet-4', input_price: 3, output_price: 15 },
  'claude-sonnet-4-5': { model: 'claude-sonnet-4-5', input_price: 3, output_price: 15 },
  'claude-haiku': { model: 'claude-haiku', input_price: 0.25, output_price: 1.25 },
  'claude-haiku-4-5': { model: 'claude-haiku-4-5', input_price: 0.25, output_price: 1.25 },
};

/**
 * 计算 token 成本
 * @param inputTokens 输入 token 数量
 * @param inputPrice 输入价格 (美元/1M tokens)
 * @param outputTokens 输出 token 数量 (默认为0)
 * @param outputPrice 输出价格 (美元/1M tokens, 默认为0)
 */
export function calculateTokenCost(
  inputTokens: number,
  inputPrice: number,
  outputTokens: number = 0,
  outputPrice: number = 0
): number {
  const inputCost = (inputTokens / 1_000_000) * inputPrice;
  const outputCost = (outputTokens / 1_000_000) * outputPrice;
  return inputCost + outputCost;
}

/**
 * 计算会话成本
 * 优先使用 metadata.total_cost，否则根据 token 量计算
 */
export function calculateSessionCost(metadata: SessionMetadata): number {
  // 如果已有总成本，直接返回
  if (metadata.total_cost !== undefined && metadata.total_cost > 0) {
    return metadata.total_cost;
  }

  // 根据 token 计算
  const inputTokens = metadata.input_tokens ?? 0;
  const outputTokens = metadata.output_tokens ?? 0;

  // 查找模型定价
  const pricing = findModelPricing(metadata.model);
  const inputPrice = pricing?.input_price ?? 15; // 默认 Opus 价格
  const outputPrice = pricing?.output_price ?? 75;

  return calculateTokenCost(inputTokens, inputPrice, outputTokens, outputPrice);
}

/**
 * 根据模型名称查找定价信息
 */
export function findModelPricing(modelName: string): ModelPricing | undefined {
  // 精确匹配
  if (MODEL_PRICING[modelName]) {
    return MODEL_PRICING[modelName];
  }

  // 前缀匹配 (处理 claude-opus-4-5-20251101 等版本号)
  for (const key of Object.keys(MODEL_PRICING)) {
    if (modelName.startsWith(key)) {
      return MODEL_PRICING[key];
    }
  }

  // 默认返回 Opus 定价
  return MODEL_PRICING['claude-opus-4'];
}

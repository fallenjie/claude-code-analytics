import { describe, it, expect } from 'vitest';
import {
  classifyRejectionReason,
  RejectionReason,
  getRejectionReasonStats,
  getRejectionReasonLabel
} from './rejection';

describe('拒绝原因分类', () => {
  describe('classifyRejectionReason', () => {
    it('识别安全相关拒绝', () => {
      expect(classifyRejectionReason('security risk')).toBe(RejectionReason.SECURITY);
      expect(classifyRejectionReason('potential security issue')).toBe(RejectionReason.SECURITY);
      expect(classifyRejectionReason('Security concern detected')).toBe(RejectionReason.SECURITY);
    });

    it('识别重复操作拒绝', () => {
      expect(classifyRejectionReason('already done')).toBe(RejectionReason.REDUNDANT);
      expect(classifyRejectionReason('already exists')).toBe(RejectionReason.REDUNDANT);
      expect(classifyRejectionReason('This file already exists')).toBe(RejectionReason.REDUNDANT);
    });

    it('识别参数错误拒绝', () => {
      expect(classifyRejectionReason('invalid parameters')).toBe(RejectionReason.INVALID_PARAMS);
      expect(classifyRejectionReason('wrong format')).toBe(RejectionReason.INVALID_PARAMS);
      expect(classifyRejectionReason('missing required argument')).toBe(RejectionReason.INVALID_PARAMS);
    });

    it('识别超出范围拒绝', () => {
      expect(classifyRejectionReason('not related to current task')).toBe(RejectionReason.OUT_OF_SCOPE);
      expect(classifyRejectionReason('outside the scope')).toBe(RejectionReason.OUT_OF_SCOPE);
      expect(classifyRejectionReason('requested operation is outside')).toBe(RejectionReason.OUT_OF_SCOPE);
    });

    it('未知原因返回 Unknown', () => {
      expect(classifyRejectionReason('some random reason')).toBe(RejectionReason.UNKNOWN);
      expect(classifyRejectionReason('')).toBe(RejectionReason.UNKNOWN);
    });

    it('大小写不敏感', () => {
      expect(classifyRejectionReason('SECURITY RISK')).toBe(RejectionReason.SECURITY);
      expect(classifyRejectionReason('Already Done')).toBe(RejectionReason.REDUNDANT);
    });
  });

  describe('getRejectionReasonLabel', () => {
    it('返回正确的中文标签', () => {
      expect(getRejectionReasonLabel(RejectionReason.SECURITY)).toBe('安全考虑');
      expect(getRejectionReasonLabel(RejectionReason.REDUNDANT)).toBe('重复操作');
      expect(getRejectionReasonLabel(RejectionReason.INVALID_PARAMS)).toBe('参数错误');
      expect(getRejectionReasonLabel(RejectionReason.OUT_OF_SCOPE)).toBe('超出范围');
      expect(getRejectionReasonLabel(RejectionReason.UNKNOWN)).toBe('未知原因');
    });
  });

  describe('getRejectionReasonStats', () => {
    it('统计各类拒绝原因', () => {
      const reasons = [
        { reason: 'security risk', count: 3 },
        { reason: 'already done', count: 5 },
        { reason: 'invalid params', count: 2 },
        { reason: 'some unknown reason', count: 1 },
      ];

      const stats = getRejectionReasonStats(reasons);

      expect(stats.get(RejectionReason.SECURITY)).toBe(3);
      expect(stats.get(RejectionReason.REDUNDANT)).toBe(5);
      expect(stats.get(RejectionReason.INVALID_PARAMS)).toBe(2);
      expect(stats.get(RejectionReason.UNKNOWN)).toBe(1);
    });

    it('处理空数组', () => {
      const stats = getRejectionReasonStats([]);
      expect(stats.size).toBe(0);
    });

    it('计算百分比', () => {
      const reasons = [
        { reason: 'security risk', count: 2 },
        { reason: 'already done', count: 2 },
      ];

      const stats = getRejectionReasonStats(reasons);
      const percentages = getRejectionReasonStats(reasons, true);

      expect(percentages.get(RejectionReason.SECURITY)).toBe(50);
      expect(percentages.get(RejectionReason.REDUNDANT)).toBe(50);
    });
  });
});

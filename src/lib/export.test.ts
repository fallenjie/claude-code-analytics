import { describe, it, expect } from 'vitest';
import {
  exportToCSV,
  exportToJSON,
  parseCSV,
  getExportVersion
} from './export';
import type { Session } from '../types';

describe('数据导出', () => {
  const mockSessions: Session[] = [
    {
      session_id: 'sess_1',
      model: 'claude-opus-4-5',
      started_at: new Date('2026-05-30T10:00:00Z').getTime(),
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
      model: 'claude-sonnet-4-5',
      started_at: new Date('2026-05-30T14:00:00Z').getTime(),
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

  describe('exportToCSV', () => {
    it('导出基本字段', () => {
      const csv = exportToCSV(mockSessions);
      expect(csv).toContain('session_id');
      expect(csv).toContain('model');
      expect(csv).toContain('total_cost');
      expect(csv).toContain('sess_1');
      expect(csv).toContain('18.75');
      expect(csv).toContain('sess_2');
      expect(csv).toContain('5.625');
    });

    it('包含表头', () => {
      const csv = exportToCSV(mockSessions);
      const lines = csv.split('\n');
      expect(lines[0]).toContain('session_id');
    });

    it('正确处理逗号和引号', () => {
      const sessionsWithComma: Session[] = [
        {
          ...mockSessions[0],
          project_name: 'project, with, commas',
        },
      ];
      const csv = exportToCSV(sessionsWithComma);
      expect(csv).toContain('"project, with, commas"');
    });
  });

  describe('exportToJSON', () => {
    it('导出基本结构', () => {
      const json = exportToJSON(mockSessions);
      const parsed = JSON.parse(json);

      expect(parsed).toHaveProperty('version');
      expect(parsed).toHaveProperty('exportedAt');
      expect(parsed).toHaveProperty('data');
      expect(parsed.data).toHaveLength(2);
    });

    it('包含版本信息', () => {
      const json = exportToJSON(mockSessions);
      const parsed = JSON.parse(json);
      expect(parsed.version).toBeDefined();
    });

    it('包含导出时间', () => {
      const json = exportToJSON(mockSessions);
      const parsed = JSON.parse(json);
      expect(parsed.exportedAt).toBeDefined();
    });
  });

  describe('parseCSV', () => {
    it('解析 CSV 为对象数组', () => {
      const csv = 'session_id,model,cost\nsess_1,opus,10.5\nsess_2,sonnet,5.25';
      const result = parseCSV(csv);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('session_id');
      expect(result[0]).toHaveProperty('model');
      expect(result[0]).toHaveProperty('cost');
    });

    it('处理带引号的值', () => {
      const csv = 'name,desc\n"item 1","desc with, comma"';
      const result = parseCSV(csv);

      expect(result[0].name).toBe('item 1');
      expect(result[0].desc).toBe('desc with, comma');
    });

    it('过滤空行', () => {
      const csv = 'a,b\n1,2\n\n3,4';
      const result = parseCSV(csv);
      // 空行被过滤，只有2行数据
      expect(result).toHaveLength(2);
    });
  });

  describe('getExportVersion', () => {
    it('返回当前版本', () => {
      const version = getExportVersion();
      expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });
});

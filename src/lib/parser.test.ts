import { describe, it, expect } from 'vitest';
import {
  parseMetadata,
  parseConversationLine,
  parseToolCall,
  extractToolStats,
  isValidModelName
} from './parser';
import type { SessionMetadata, ToolCall } from '../types';

describe('会话数据解析器', () => {
  describe('parseMetadata', () => {
    it('正确解析完整的 metadata.json', () => {
      const json = {
        session_id: 'sess_abc123',
        project_id: 'proj_xyz',
        model: 'claude-opus-4-5',
        started_at: 1748700000000,
        ended_at: 1748703600000,
        total_cost: 2.5,
        input_tokens: 100000,
        output_tokens: 200000,
        status: 'completed',
      };

      const result = parseMetadata(json);
      expect(result.session_id).toBe('sess_abc123');
      expect(result.model).toBe('claude-opus-4-5');
      expect(result.total_cost).toBe(2.5);
      expect(result.status).toBe('completed');
    });

    it('处理缺失的可选字段', () => {
      const json = {
        session_id: 'sess_minimal',
        model: 'claude-sonnet-4-5',
        started_at: 1748700000000,
        status: 'active',
      };

      const result = parseMetadata(json);
      expect(result.session_id).toBe('sess_minimal');
      expect(result.total_cost).toBeUndefined();
      expect(result.ended_at).toBeUndefined();
    });

    it('验证 session_id 必填', () => {
      const json = {
        model: 'claude-opus-4-5',
        started_at: 1748700000000,
      };

      expect(() => parseMetadata(json)).toThrow('session_id is required');
    });

    it('验证 model 必填', () => {
      const json = {
        session_id: 'sess_abc',
        started_at: 1748700000000,
      };

      expect(() => parseMetadata(json)).toThrow('model is required');
    });

    it('验证 started_at 必填', () => {
      const json = {
        session_id: 'sess_abc',
        model: 'claude-opus-4-5',
      };

      expect(() => parseMetadata(json)).toThrow('started_at is required');
    });
  });

  describe('parseConversationLine', () => {
    it('解析有效的 JSONL 行', () => {
      const line = JSON.stringify({
        type: 'assistant',
        timestamp: 1748700001000,
        content: 'Hello',
        tool_calls: [
          {
            id: 'tool_1',
            name: 'Read',
            arguments: '{"path": "src/main.ts"}',
            status: 'proposed',
          },
        ],
      });

      const result = parseConversationLine(line);
      expect(result).toBeDefined();
      expect(result!.type).toBe('assistant');
      expect(result!.tool_calls).toHaveLength(1);
    });

    it('处理无效的 JSON', () => {
      const line = 'this is not json {';
      const result = parseConversationLine(line);
      expect(result).toBeNull();
    });

    it('处理空行', () => {
      const result = parseConversationLine('');
      expect(result).toBeNull();
    });
  });

  describe('parseToolCall', () => {
    it('解析完整的 tool_call 对象', () => {
      const toolCall = {
        id: 'tool_abc',
        name: 'Bash',
        arguments: '{"command": "ls -la"}',
        status: 'proposed',
        proposed_at: 1748700001000,
      };

      const result = parseToolCall(toolCall, 'sess_123');
      expect(result.id).toBe('tool_abc');
      expect(result.tool_name).toBe('Bash');
      expect(result.session_id).toBe('sess_123');
      expect(result.status).toBe('proposed');
    });

    it('从 arguments 解析参数', () => {
      const toolCall = {
        id: 'tool_1',
        name: 'Read',
        arguments: '{"path": "test.js", "limit": 100}',
      };

      const result = parseToolCall(toolCall, 'sess_123');
      expect(result.arguments).toBe('{"path": "test.js", "limit": 100}');
    });

    it('处理缺失字段使用默认值', () => {
      const toolCall = {
        id: 'tool_minimal',
        name: 'Edit',
      };

      const result = parseToolCall(toolCall, 'sess_456');
      expect(result.status).toBe('proposed');
      expect(result.proposed_at).toBeUndefined();
    });
  });

  describe('extractToolStats', () => {
    it('从 tool_calls 数组计算统计数据', () => {
      const toolCalls: ToolCall[] = [
        { id: '1', session_id: 'sess', tool_name: 'Read', status: 'accepted', proposed_at: 1 },
        { id: '2', session_id: 'sess', tool_name: 'Read', status: 'accepted', proposed_at: 2 },
        { id: '3', session_id: 'sess', tool_name: 'Edit', status: 'accepted', proposed_at: 3 },
        { id: '4', session_id: 'sess', tool_name: 'Bash', status: 'rejected', proposed_at: 4 },
        { id: '5', session_id: 'sess', tool_name: 'Bash', status: 'modified', proposed_at: 5 },
      ];

      const stats = extractToolStats(toolCalls);
      expect(stats.total).toBe(5);
      expect(stats.proposed).toBe(5);
      expect(stats.accepted).toBe(3);
      expect(stats.rejected).toBe(1);
      expect(stats.modified).toBe(1);
      expect(stats.acceptanceRate).toBeCloseTo(60);
    });

    it('空数组返回零值', () => {
      const stats = extractToolStats([]);
      expect(stats.total).toBe(0);
      expect(stats.accepted).toBe(0);
      expect(stats.acceptanceRate).toBe(0);
    });
  });

  describe('isValidModelName', () => {
    it('接受有效的模型名称', () => {
      expect(isValidModelName('claude-opus-4-5')).toBe(true);
      expect(isValidModelName('claude-sonnet-4-5')).toBe(true);
      expect(isValidModelName('claude-haiku-4-5')).toBe(true);
      expect(isValidModelName('claude-opus-4')).toBe(true);
    });

    it('拒绝无效的模型名称', () => {
      expect(isValidModelName('')).toBe(false);
      expect(isValidModelName('gpt-4')).toBe(false);
      expect(isValidModelName('unknown-model')).toBe(false);
    });
  });
});

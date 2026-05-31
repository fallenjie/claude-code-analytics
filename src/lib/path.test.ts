import { describe, it, expect, beforeAll } from 'vitest';
import {
  getClaudeDir,
  getConversationsDir,
  getSessionDir,
  resolveSessionPath,
  isValidSessionId
} from './path';

describe('路径工具', () => {
  describe('getClaudeDir', () => {
    it('返回 Claude 目录路径', () => {
      const dir = getClaudeDir();
      expect(dir).toBeDefined();
      expect(typeof dir).toBe('string');
      expect(dir.length).toBeGreaterThan(0);
    });

    it('路径包含 .claude', () => {
      const dir = getClaudeDir();
      expect(dir).toContain('.claude');
    });
  });

  describe('getConversationsDir', () => {
    it('返回 conversations 子目录', () => {
      const dir = getConversationsDir();
      expect(dir).toBeDefined();
      expect(dir.endsWith('conversations') || dir.includes('conversations')).toBe(true);
    });

    it('是 ClaudeDir 的子目录', () => {
      const claudeDir = getClaudeDir();
      const convDir = getConversationsDir();
      expect(convDir.startsWith(claudeDir)).toBe(true);
    });
  });

  describe('getSessionDir', () => {
    it('返回特定会话的目录', () => {
      const sessionId = 'test-session-123';
      const dir = getSessionDir(sessionId);
      expect(dir).toBeDefined();
      expect(dir).toContain(sessionId);
    });
  });

  describe('resolveSessionPath', () => {
    it('解析会话的 metadata.json 路径', () => {
      const sessionId = 'test-session-123';
      const paths = resolveSessionPath(sessionId);
      expect(paths.metadata).toBeDefined();
      expect(paths.metadata.endsWith('metadata.json')).toBe(true);
    });

    it('解析会话的 conversation.jsonl 路径', () => {
      const sessionId = 'test-session-123';
      const paths = resolveSessionPath(sessionId);
      expect(paths.conversation).toBeDefined();
      expect(paths.conversation.endsWith('conversation.jsonl')).toBe(true);
    });

    it('返回完整路径结构', () => {
      const sessionId = 'abc123';
      const paths = resolveSessionPath(sessionId);
      expect(paths).toHaveProperty('metadata');
      expect(paths).toHaveProperty('conversation');
      expect(paths).toHaveProperty('sessionDir');
      expect(paths.sessionDir).toContain(sessionId);
    });
  });

  describe('isValidSessionId', () => {
    it('接受有效的 session ID', () => {
      expect(isValidSessionId('sess_abc123')).toBe(true);
      expect(isValidSessionId('session-123-456')).toBe(true);
      expect(isValidSessionId('abc123')).toBe(true);
    });

    it('拒绝空字符串', () => {
      expect(isValidSessionId('')).toBe(false);
    });

    it('拒绝路径遍历攻击', () => {
      expect(isValidSessionId('../etc/passwd')).toBe(false);
      expect(isValidSessionId('..')).toBe(false);
      expect(isValidSessionId('.')).toBe(false);
    });
  });
});

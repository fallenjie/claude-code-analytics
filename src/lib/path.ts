import os from 'os';
import path from 'path';

/**
 * 获取 Claude Code 数据目录
 * 跨平台兼容：Windows/macOS/Linux
 */
export function getClaudeDir(): string {
  const homeDir = os.homedir();
  return path.join(homeDir, '.claude');
}

/**
 * 获取 conversations 目录路径
 */
export function getConversationsDir(): string {
  return path.join(getClaudeDir(), 'conversations');
}

/**
 * 获取特定会话的目录路径
 */
export function getSessionDir(sessionId: string): string {
  return path.join(getConversationsDir(), sessionId);
}

/**
 * 解析会话相关的文件路径
 */
export function resolveSessionPath(sessionId: string): {
  metadata: string;
  conversation: string;
  sessionDir: string;
} {
  const sessionDir = getSessionDir(sessionId);
  return {
    sessionDir,
    metadata: path.join(sessionDir, 'metadata.json'),
    conversation: path.join(sessionDir, 'conversation.jsonl'),
  };
}

/**
 * 验证 session ID 是否合法
 * 防止路径遍历攻击
 */
export function isValidSessionId(sessionId: string): boolean {
  if (!sessionId || sessionId.length === 0) {
    return false;
  }

  // 禁止路径遍历字符
  const dangerousPatterns = ['..', '.', '/', '\\', '\0', '\n', '\r'];
  for (const pattern of dangerousPatterns) {
    if (sessionId.includes(pattern)) {
      return false;
    }
  }

  return true;
}

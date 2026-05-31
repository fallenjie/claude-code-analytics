import type { Session } from '../types';

// 导出格式版本
const EXPORT_VERSION = '1.0.0';

// CSV 导出的字段
const CSV_FIELDS = [
  'session_id',
  'model',
  'project_name',
  'started_at',
  'ended_at',
  'duration_ms',
  'status',
  'input_tokens',
  'output_tokens',
  'total_tokens',
  'total_cost',
  'tools_proposed',
  'tools_accepted',
  'tools_rejected',
  'tools_modified',
  'tools_skipped',
];

/**
 * 获取导出格式版本
 */
export function getExportVersion(): string {
  return EXPORT_VERSION;
}

/**
 * 导出会话数据为 CSV 格式
 */
export function exportToCSV(
  sessions: Session[],
  fields: string[] = CSV_FIELDS
): string {
  if (sessions.length === 0) {
    return fields.join(',') + '\n';
  }

  // 生成表头
  const header = fields.join(',');

  // 生成数据行
  const rows = sessions.map(session => {
    return fields.map(field => {
      const value = getFieldValue(session, field);
      return formatCSVValue(value);
    }).join(',');
  });

  return [header, ...rows].join('\n');
}

/**
 * 导出会话数据为 JSON 格式
 */
export function exportToJSON(sessions: Session[]): string {
  const exportData = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    totalCount: sessions.length,
    data: sessions.map(session => ({
      ...session,
      // 格式化时间戳为可读日期
      started_at_date: session.started_at
        ? new Date(session.started_at).toISOString()
        : null,
      ended_at_date: session.ended_at
        ? new Date(session.ended_at).toISOString()
        : null,
    })),
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * 解析 CSV 字符串为对象数组
 */
export function parseCSV(csv: string): Record<string, string>[] {
  const lines = csv.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length === 0) return [];

  // 解析表头
  const headers = parseCSVLine(lines[0]);

  // 解析数据行
  const result: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    result.push(row);
  }

  return result;
}

/**
 * 解析单行 CSV（处理引号）
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // 转义引号
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * 获取对象字段值
 */
function getFieldValue(obj: Record<string, unknown>, field: string): unknown {
  // 支持嵌套字段如 "a.b.c"
  const parts = field.split('.');
  let value: unknown = obj;

  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = (value as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return value;
}

/**
 * 格式化 CSV 单元格值
 */
function formatCSVValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  const str = String(value);

  // 如果包含逗号、引号或换行，需要用引号包裹
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    // 转义内部引号
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * 生成导出的文件名
 */
export function generateExportFilename(
  type: 'csv' | 'json',
  prefix: string = 'claude-code-analytics'
): string {
  const date = new Date().toISOString().split('T')[0];
  return `${prefix}-${date}.${type}`;
}

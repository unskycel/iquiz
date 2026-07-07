/**
 * 格式化正确答案为可读字符串
 * 支持：数组、JSON 字符串数组、纯字符串
 */
export function formatCorrectAnswer(raw: string | string[]): string {
  if (Array.isArray(raw)) {
    return raw.join(', ');
  }
  if (typeof raw === 'string' && raw.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((v: string, i: number) => `空${i + 1}: ${v}`).join('；');
      }
    } catch { /* fall through */ }
  }
  return String(raw);
}

/**
 * 标准化填空题答案：将逗号/顿号分隔的字符串拆为数组（入库用）
 * 已是数组则直接返回，已为 JSON 数组字符串则解析
 * 单答案原样返回
 */
export function normalizeBlankAnswer(correctAnswer: string | string[]): string | string[] {
  if (Array.isArray(correctAnswer)) {
    return correctAnswer;
  }
  const trimmed = correctAnswer.trim();
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch { /* fall through to plain string */ }
  }
  // Split on common separators
  const parts = trimmed.split(/[，,、；;]/).map(s => s.trim()).filter(Boolean);
  if (parts.length > 1) {
    return parts;
  }
  return correctAnswer;
}

/**
 * 推断填空题空数（仅根据 correct_answer，入库后应为数组或单字符串）
 */
export function getBlankCount(correctAnswer: string | string[] | null | undefined): number {
  if (Array.isArray(correctAnswer)) {
    return correctAnswer.length;
  }
  if (typeof correctAnswer === 'string' && correctAnswer.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(correctAnswer);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.length;
      }
    } catch { /* fall through */ }
  }
  return 1;
}

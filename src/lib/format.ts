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
 * 从 correct_answer 推断填空题空数
 */
export function getBlankCount(correctAnswer: string | string[]): number {
  if (Array.isArray(correctAnswer)) {
    return correctAnswer.length;
  }
  if (typeof correctAnswer === 'string' && correctAnswer.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(correctAnswer);
      if (Array.isArray(parsed) && parsed.length > 1) {
        return parsed.length;
      }
    } catch { /* fall through */ }
  }
  return 1;
}

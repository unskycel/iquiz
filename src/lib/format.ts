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
 * 从 correct_answer 和题干 content 推断填空题空数
 * 优先顺序:
 *   1. correct_answer 是数组 → 返回长度
 *   2. correct_answer 是 JSON 数组字符串 → 返回长度
 *   3. 题干 content 含连续下划线(5+个) → 返回下划线组数
 *   4. 逗号分隔的多答案(如 "A, B") → 返回段数
 *   5. 默认 1
 */
export function getBlankCount(correctAnswer: string | string[] | null | undefined, questionContent?: string): number {
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

  // 从题干中数下划线(5个或以上表示一个空)
  if (questionContent) {
    const underscores = questionContent.match(/_{5,}/g);
    if (underscores && underscores.length > 0) {
      return underscores.length;
    }
  }

  // 多答案逗号/顿号分隔
  if (typeof correctAnswer === 'string') {
    const parts = correctAnswer.split(/[，,、；;]/).map(s => s.trim()).filter(Boolean);
    if (parts.length > 1) {
      return parts.length;
    }
  }

  return 1;
}

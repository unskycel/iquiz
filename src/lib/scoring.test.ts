import { describe, it, expect } from 'vitest';
import { gradeAnswer, calculateTotalScore, calculateTotalPoints } from './scoring';
import type { Question, QuestionOption } from '../types';

// ─── 辅助构造函数 ───────────────────────────────────────────
function makeQuestion(
  overrides: Partial<Question> & { type: Question['type']; correct_answer: Question['correct_answer'] }
): Question {
  return {
    id: 'q1',
    quiz_id: 'quiz1',
    order_index: 0,
    points: 10,
    content: 'test question',
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

// ─── single_choice ─────────────────────────────────────────
describe('gradeAnswer — single_choice', () => {
  const question = makeQuestion({
    type: 'single_choice',
    correct_answer: 'B',
    points: 10,
  });

  it('答案完全匹配 → 满分', () => {
    const result = gradeAnswer(question, 'B');
    expect(result).toEqual({ isCorrect: true, pointsAwarded: 10 });
  });

  it('答案不匹配 → 0 分', () => {
    const result = gradeAnswer(question, 'A');
    expect(result).toEqual({ isCorrect: false, pointsAwarded: 0 });
  });

  it('大小写敏感（A ≠ a）', () => {
    const result = gradeAnswer(question, 'b');
    expect(result.isCorrect).toBe(false);
    expect(result.pointsAwarded).toBe(0);
  });

  it('空答案 → 0 分', () => {
    const result = gradeAnswer(question, '');
    expect(result).toEqual({ isCorrect: false, pointsAwarded: 0 });
  });
});

// ─── multiple_choice ───────────────────────────────────────
describe('gradeAnswer — multiple_choice', () => {
  const question = makeQuestion({
    type: 'multiple_choice',
    correct_answer: ['A', 'C', 'D'],
    points: 10,
  });

  it('全部正确 → 满分', () => {
    const result = gradeAnswer(question, ['A', 'C', 'D']);
    expect(result).toEqual({ isCorrect: true, pointsAwarded: 10 });
  });

  it('顺序不同但内容相同 → 满分', () => {
    const result = gradeAnswer(question, ['D', 'A', 'C']);
    expect(result).toEqual({ isCorrect: true, pointsAwarded: 10 });
  });

  it('部分正确 → 部分分', () => {
    // 选了 A、C（2/3 正确），points = floor(2/3 * 10) = 6
    const result = gradeAnswer(question, ['A', 'C']);
    expect(result.isCorrect).toBe(false);
    expect(result.pointsAwarded).toBe(6);
  });

  it('选了错误选项 → 部分分降低', () => {
    // 选了 A、B、C → A 和 C 正确（2/3），B 错误
    const result = gradeAnswer(question, ['A', 'B', 'C']);
    expect(result.isCorrect).toBe(false);
    expect(result.pointsAwarded).toBe(6);
  });

  it('全错 → 0 分', () => {
    const result = gradeAnswer(question, ['B']);
    expect(result).toEqual({ isCorrect: false, pointsAwarded: 0 });
  });

  it('空数组 → 0 分', () => {
    const result = gradeAnswer(question, []);
    expect(result).toEqual({ isCorrect: false, pointsAwarded: 0 });
  });

  it('多选了额外选项但不全对 → 部分分', () => {
    // 选了 A B C D → A C D 正确(3)，但 B 错误，正确数=3/3=满 -> 但 isCorrect false（因为多了 B）
    const result = gradeAnswer(question, ['A', 'B', 'C', 'D']);
    expect(result.isCorrect).toBe(false);
    // correctCount = filter(A,C,D includes) = 3; 3/3 * 10 = 10
    expect(result.pointsAwarded).toBe(10);
  });
});

// ─── true_false ────────────────────────────────────────────
describe('gradeAnswer — true_false', () => {
  const question = makeQuestion({
    type: 'true_false',
    correct_answer: 'true',
    points: 5,
  });

  it('正确 → 满分', () => {
    expect(gradeAnswer(question, 'true')).toEqual({ isCorrect: true, pointsAwarded: 5 });
  });

  it('错误 → 0 分', () => {
    expect(gradeAnswer(question, 'false')).toEqual({ isCorrect: false, pointsAwarded: 0 });
  });

  it('大小写不敏感（True ≠ true 应通过）', () => {
    const result = gradeAnswer(question, 'True');
    expect(result).toEqual({ isCorrect: true, pointsAwarded: 5 });
  });

  it('大小写不敏感（TRUE → 正确）', () => {
    const result = gradeAnswer(question, 'TRUE');
    expect(result.isCorrect).toBe(true);
  });

  it('中文"对"/"错" → 不匹配英文（不兼容）', () => {
    const result = gradeAnswer(question, '对');
    expect(result.isCorrect).toBe(false);
  });
});

// ─── fill_blank — 单空 ─────────────────────────────────────
describe('gradeAnswer — fill_blank 单空', () => {
  const question = makeQuestion({
    type: 'fill_blank',
    correct_answer: 'HTTP',
    points: 10,
  });

  it('完全匹配 → 满分', () => {
    expect(gradeAnswer(question, 'HTTP')).toEqual({ isCorrect: true, pointsAwarded: 10 });
  });

  it('大小写不敏感 → 满分', () => {
    expect(gradeAnswer(question, 'http')).toEqual({ isCorrect: true, pointsAwarded: 10 });
  });

  it('前后空格自动 trim → 满分', () => {
    expect(gradeAnswer(question, '  HTTP  ')).toEqual({ isCorrect: true, pointsAwarded: 10 });
  });

  it('错误答案 → 0 分', () => {
    expect(gradeAnswer(question, 'FTP')).toEqual({ isCorrect: false, pointsAwarded: 0 });
  });

  it('空字符串 → 0 分', () => {
    expect(gradeAnswer(question, '')).toEqual({ isCorrect: false, pointsAwarded: 0 });
  });
});

// ─── fill_blank — 多空 (JSON 数组) ─────────────────────────
describe('gradeAnswer — fill_blank 多空', () => {
  const question = makeQuestion({
    type: 'fill_blank',
    correct_answer: '["开发软件", "维护软件"]',
    points: 10,
  });

  it('全部正确 → 满分', () => {
    const result = gradeAnswer(question, ['开发软件', '维护软件']);
    expect(result).toEqual({ isCorrect: true, pointsAwarded: 10 });
  });

  it('部分正确（1/2 对）→ 部分分 5', () => {
    const result = gradeAnswer(question, ['开发软件', '错误答案']);
    expect(result.isCorrect).toBe(false);
    expect(result.pointsAwarded).toBe(5);
  });

  it('全错 → 0 分', () => {
    const result = gradeAnswer(question, ['错1', '错2']);
    expect(result).toEqual({ isCorrect: false, pointsAwarded: 0 });
  });

  it('大小写不敏感 + trim', () => {
    const result = gradeAnswer(question, ['  开发软件  ', '维护软件']);
    expect(result).toEqual({ isCorrect: true, pointsAwarded: 10 });
  });

  it('用户答案为字符串（非数组）→ 当单空处理', () => {
    // userAnswer = "开发软件" → userAnswers = ["开发软件"]
    // 第 0 空 "开发软件" === "开发软件" ✓，第 1 空 "" !== "维护软件" ✗ → 1/2 = 5
    const result = gradeAnswer(question, '开发软件');
    expect(result.isCorrect).toBe(false);
    expect(result.pointsAwarded).toBe(5);
  });

  it('三空题部分分', () => {
    const q3 = makeQuestion({
      type: 'fill_blank',
      correct_answer: '["A", "B", "C"]',
      points: 9,
    });
    // 2/3 对 → round(2 * 3) = 6
    const result = gradeAnswer(q3, ['A', 'B', 'X']);
    expect(result.isCorrect).toBe(false);
    expect(result.pointsAwarded).toBe(6);
  });
});

// ─── short_answer ──────────────────────────────────────────
describe('gradeAnswer — short_answer', () => {
  const question = makeQuestion({
    type: 'short_answer',
    correct_answer: '软件工程',
    points: 15,
  });

  it('完全匹配 → 满分', () => {
    expect(gradeAnswer(question, '软件工程')).toEqual({ isCorrect: true, pointsAwarded: 15 });
  });

  it('大小写不敏感', () => {
    const q = makeQuestion({
      type: 'short_answer',
      correct_answer: 'Hello World',
      points: 10,
    });
    expect(gradeAnswer(q, 'hello world')).toEqual({ isCorrect: true, pointsAwarded: 10 });
  });

  it('trim 空格', () => {
    expect(gradeAnswer(question, '  软件工程  ')).toEqual({ isCorrect: true, pointsAwarded: 15 });
  });

  it('错误答案 → 0 分', () => {
    expect(gradeAnswer(question, '计算机科学')).toEqual({ isCorrect: false, pointsAwarded: 0 });
  });
});

// ─── 未知题型 ──────────────────────────────────────────────
describe('gradeAnswer — 未知题型', () => {
  it('返回 0 分', () => {
    const question = makeQuestion({
      // @ts-expect-error 测试未知题型
      type: 'unknown_type',
      correct_answer: 'whatever',
      points: 10,
    });
    expect(gradeAnswer(question, 'whatever')).toEqual({ isCorrect: false, pointsAwarded: 0 });
  });
});

// ─── calculateTotalScore ───────────────────────────────────
describe('calculateTotalScore', () => {
  const questions: Question[] = [
    makeQuestion({ id: 'q1', type: 'single_choice', correct_answer: 'A', points: 10 }),
    makeQuestion({ id: 'q2', type: 'true_false', correct_answer: 'true', points: 5 }),
    makeQuestion({ id: 'q3', type: 'fill_blank', correct_answer: 'HTTP', points: 10 }),
  ];

  it('全对 → 总分 25', () => {
    const answers = new Map([
      ['q1', 'A'],
      ['q2', 'true'],
      ['q3', 'HTTP'],
    ]);
    expect(calculateTotalScore(questions, answers)).toBe(25);
  });

  it('部分对 → 部分总分', () => {
    const answers = new Map([
      ['q1', 'A'],   // ✓ 10
      ['q2', 'false'], // ✗ 0
      ['q3', 'HTTP'],  // ✓ 10
    ]);
    expect(calculateTotalScore(questions, answers)).toBe(20);
  });

  it('空答案 Map → 0 分', () => {
    expect(calculateTotalScore(questions, new Map())).toBe(0);
  });

  it('跳过的题不计分', () => {
    const answers = new Map([
      ['q1', 'A'],    // ✓ 10
      // q2 跳过
      ['q3', 'FTP'],  // ✗ 0
    ]);
    expect(calculateTotalScore(questions, answers)).toBe(10);
  });
});

// ─── calculateTotalPoints ──────────────────────────────────
describe('calculateTotalPoints', () => {
  it('累加所有题目分数', () => {
    const questions: Question[] = [
      makeQuestion({ id: 'q1', type: 'single_choice', correct_answer: 'A', points: 10 }),
      makeQuestion({ id: 'q2', type: 'true_false', correct_answer: 'true', points: 5 }),
      makeQuestion({ id: 'q3', type: 'fill_blank', correct_answer: 'HTTP', points: 15 }),
    ];
    expect(calculateTotalPoints(questions)).toBe(30);
  });

  it('空数组 → 0', () => {
    expect(calculateTotalPoints([])).toBe(0);
  });

  it('单题', () => {
    const questions: Question[] = [
      makeQuestion({ type: 'short_answer', correct_answer: 'test', points: 7 }),
    ];
    expect(calculateTotalPoints(questions)).toBe(7);
  });
});

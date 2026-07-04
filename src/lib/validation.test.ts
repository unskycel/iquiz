import { describe, it, expect } from 'vitest';
import {
  validateQuestion,
  validateQuiz,
  hasValidationErrors,
  countQuestionErrors,
  getFirstErrorIndex,
} from './validation';
import type { Question, QuestionOption } from '../types';

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

function makeOption(overrides: Partial<QuestionOption> = {}): QuestionOption {
  return {
    id: 'opt1',
    question_id: 'q1',
    content: 'option text',
    is_correct: false,
    order_index: 0,
    ...overrides,
  };
}

// ─── validateQuestion ─────────────────────────────────────

describe('validateQuestion', () => {
  // ── single_choice ──
  describe('single_choice', () => {
    it('有效题目 → null', () => {
      const q = makeQuestion({ type: 'single_choice', correct_answer: 'A' });
      const options = [
        makeOption({ id: '1', content: 'A', is_correct: true }),
        makeOption({ id: '2', content: 'B', is_correct: false }),
      ];
      expect(validateQuestion(q, options)).toBeNull();
    });

    it('题目内容为空 → error', () => {
      const q = makeQuestion({ type: 'single_choice', correct_answer: 'A', content: '' });
      const options = [
        makeOption({ id: '1', content: 'A', is_correct: true }),
        makeOption({ id: '2', content: 'B', is_correct: false }),
      ];
      const result = validateQuestion(q, options);
      expect(result?.content).toBe('题目内容不能为空');
    });

    it('少于 2 个选项 → error', () => {
      const q = makeQuestion({ type: 'single_choice', correct_answer: 'A' });
      const options = [makeOption({ id: '1', content: 'A', is_correct: true })];
      const result = validateQuestion(q, options);
      expect(result?.options).toBe('至少需要 2 个非空选项');
    });

    it('没有选正确答案 → error', () => {
      const q = makeQuestion({ type: 'single_choice', correct_answer: '' });
      const options = [
        makeOption({ id: '1', content: 'A', is_correct: false }),
        makeOption({ id: '2', content: 'B', is_correct: false }),
      ];
      const result = validateQuestion(q, options);
      expect(result?.correctAnswer).toBe('请选择正确答案');
    });

    it('正确选项内容为空 → error', () => {
      const q = makeQuestion({ type: 'single_choice', correct_answer: '' });
      const options = [
        makeOption({ id: '1', content: '', is_correct: true }),
        makeOption({ id: '2', content: 'B', is_correct: false }),
      ];
      const result = validateQuestion(q, options);
      expect(result?.correctAnswer).toBe('正确选项的内容不能为空');
    });
  });

  // ── multiple_choice ──
  describe('multiple_choice', () => {
    it('有效题目 → null', () => {
      const q = makeQuestion({ type: 'multiple_choice', correct_answer: ['A', 'B'] });
      const options = [
        makeOption({ id: '1', content: 'A', is_correct: true }),
        makeOption({ id: '2', content: 'B', is_correct: true }),
        makeOption({ id: '3', content: 'C', is_correct: false }),
      ];
      expect(validateQuestion(q, options)).toBeNull();
    });

    it('没有选正确答案 → error', () => {
      const q = makeQuestion({ type: 'multiple_choice', correct_answer: [] });
      const options = [
        makeOption({ id: '1', content: 'A', is_correct: false }),
        makeOption({ id: '2', content: 'B', is_correct: false }),
      ];
      const result = validateQuestion(q, options);
      expect(result?.correctAnswer).toBe('请至少选择一个正确答案');
    });
  });

  // ── true_false ──
  describe('true_false', () => {
    it('有效题目 → null', () => {
      const q = makeQuestion({ type: 'true_false', correct_answer: 'true' });
      expect(validateQuestion(q)).toBeNull();
    });

    it('答案为空 → error', () => {
      const q = makeQuestion({ type: 'true_false', correct_answer: '' });
      const result = validateQuestion(q);
      expect(result?.correctAnswer).toBe('请选择正确或错误');
    });

    it('答案为无效值 → error', () => {
      const q = makeQuestion({ type: 'true_false', correct_answer: 'maybe' });
      const result = validateQuestion(q);
      expect(result?.correctAnswer).toBe('请选择正确或错误');
    });
  });

  // ── fill_blank ──
  describe('fill_blank', () => {
    it('有效单空 → null', () => {
      const q = makeQuestion({ type: 'fill_blank', correct_answer: 'HTTP' });
      expect(validateQuestion(q)).toBeNull();
    });

    it('答案为空 → error', () => {
      const q = makeQuestion({ type: 'fill_blank', correct_answer: '' });
      const result = validateQuestion(q);
      expect(result?.correctAnswer).toBe('正确答案不能为空');
    });

    it('有效多空 JSON 数组 → null', () => {
      const q = makeQuestion({ type: 'fill_blank', correct_answer: '["A", "B"]' });
      expect(validateQuestion(q)).toBeNull();
    });

    it('多空有空值 → error', () => {
      const q = makeQuestion({ type: 'fill_blank', correct_answer: '["A", ""]' });
      const result = validateQuestion(q);
      expect(result?.correctAnswer).toBe('有 1 个空的答案未填写');
    });

    it('无效 JSON → error', () => {
      const q = makeQuestion({ type: 'fill_blank', correct_answer: '[invalid' });
      const result = validateQuestion(q);
      expect(result?.correctAnswer).toBe('答案格式错误');
    });
  });

  // ── short_answer ──
  describe('short_answer', () => {
    it('有效题目 → null', () => {
      const q = makeQuestion({ type: 'short_answer', correct_answer: '软件工程' });
      expect(validateQuestion(q)).toBeNull();
    });

    it('答案为空 → error', () => {
      const q = makeQuestion({ type: 'short_answer', correct_answer: '' });
      const result = validateQuestion(q);
      expect(result?.correctAnswer).toBe('参考答案不能为空');
    });
  });

  // ── 通用验证 ──
  describe('通用验证', () => {
    it('分值 < 1 → error', () => {
      const q = makeQuestion({ type: 'true_false', correct_answer: 'true', points: 0 });
      const result = validateQuestion(q);
      expect(result?.points).toBe('分值必须 ≥ 1');
    });

    it('分值 > 1000 → error', () => {
      const q = makeQuestion({ type: 'true_false', correct_answer: 'true', points: 1001 });
      const result = validateQuestion(q);
      expect(result?.points).toBe('分值不能超过 1000');
    });

    it('题目内容超长 → error', () => {
      const q = makeQuestion({
        type: 'true_false',
        correct_answer: 'true',
        content: 'a'.repeat(2001),
      });
      const result = validateQuestion(q);
      expect(result?.content).toBe('题目内容不能超过 2000 字');
    });
  });
});

// ─── validateQuiz ─────────────────────────────────────────

describe('validateQuiz', () => {
  it('标题为空 → title error', () => {
    const errors = validateQuiz('', []);
    expect(errors.title).toBe('请输入习题标题');
  });

  it('标题超长 → title error', () => {
    const errors = validateQuiz('a'.repeat(101), []);
    expect(errors.title).toBe('标题不能超过 100 字');
  });

  it('无题目 → questions 空数组（由 QuizEditor 检查 length === 0）', () => {
    const errors = validateQuiz('有效标题', []);
    expect(errors.questions).toEqual([]);
  });

  it('有题目且全有效 → questions 全 null', () => {
    const q = makeQuestion({ type: 'true_false', correct_answer: 'true' });
    const errors = validateQuiz('标题', [q]);
    expect(errors.questions).toEqual([null]);
  });

  it('有题目且有错误 → 返回对应 error', () => {
    const q = makeQuestion({ type: 'true_false', correct_answer: '' });
    const errors = validateQuiz('标题', [q]);
    expect(errors.questions[0]).not.toBeNull();
    expect(errors.questions[0]?.correctAnswer).toBe('请选择正确或错误');
  });

  it('混合有效和无效题目', () => {
    const q1 = makeQuestion({ id: 'q1', type: 'true_false', correct_answer: 'true' });
    const q2 = makeQuestion({ id: 'q2', type: 'true_false', correct_answer: '' });
    const q3 = makeQuestion({ id: 'q3', type: 'true_false', correct_answer: 'false' });
    const errors = validateQuiz('标题', [q1, q2, q3]);
    expect(errors.questions[0]).toBeNull();
    expect(errors.questions[1]).not.toBeNull();
    expect(errors.questions[2]).toBeNull();
  });
});

// ─── 辅助函数 ─────────────────────────────────────────────

describe('hasValidationErrors', () => {
  it('无错误 → false', () => {
    expect(hasValidationErrors({ questions: [null, null] })).toBe(false);
  });

  it('有 title 错误 → true', () => {
    expect(hasValidationErrors({ title: 'error', questions: [] })).toBe(true);
  });

  it('有 question 错误 → true', () => {
    expect(hasValidationErrors({ questions: [{ content: 'err' }, null] })).toBe(true);
  });
});

describe('countQuestionErrors', () => {
  it('全无错误 → 0', () => {
    expect(countQuestionErrors({ questions: [null, null] })).toBe(0);
  });

  it('有 2 个错误 → 2', () => {
    expect(countQuestionErrors({ questions: [{}, null, {}] })).toBe(2);
  });
});

describe('getFirstErrorIndex', () => {
  it('无错误 → -1', () => {
    expect(getFirstErrorIndex({ questions: [null, null] })).toBe(-1);
  });

  it('第 2 题有错 → 1', () => {
    expect(getFirstErrorIndex({ questions: [null, { content: 'err' }] })).toBe(1);
  });

  it('第 1 题有错 → 0', () => {
    expect(getFirstErrorIndex({ questions: [{ content: 'err' }, null] })).toBe(0);
  });
});

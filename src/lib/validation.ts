import type { Question, QuestionOption } from '../types';

export interface QuestionError {
  content?: string;
  options?: string;
  correctAnswer?: string;
  points?: string;
}

export interface QuizValidationError {
  title?: string;
  questions: (QuestionError | null)[];
}

/**
 * 验证单个题目
 */
export function validateQuestion(
  question: Question,
  options?: QuestionOption[]
): QuestionError | null {
  const errors: QuestionError = {};

  // 题目内容
  if (!question.content.trim()) {
    errors.content = '题目内容不能为空';
  } else if (question.content.trim().length > 2000) {
    errors.content = '题目内容不能超过 2000 字';
  }

  // 分值
  if (!question.points || question.points < 1) {
    errors.points = '分值必须 ≥ 1';
  } else if (question.points > 1000) {
    errors.points = '分值不能超过 1000';
  }

  // 按题型验证
  switch (question.type) {
    case 'single_choice': {
      const validOptions = (options || []).filter(o => o.content.trim());
      if (validOptions.length < 2) {
        errors.options = '至少需要 2 个非空选项';
      }
      const hasCorrect = (options || []).some(o => o.is_correct);
      if (!hasCorrect) {
        errors.correctAnswer = '请选择正确答案';
      }
      // 检查正确答案对应的选项是否有内容
      const correctOption = (options || []).find(o => o.is_correct);
      if (correctOption && !correctOption.content.trim()) {
        errors.correctAnswer = '正确选项的内容不能为空';
      }
      break;
    }

    case 'multiple_choice': {
      const validOptions = (options || []).filter(o => o.content.trim());
      if (validOptions.length < 2) {
        errors.options = '至少需要 2 个非空选项';
      }
      const correctCount = (options || []).filter(o => o.is_correct).length;
      if (correctCount === 0) {
        errors.correctAnswer = '请至少选择一个正确答案';
      }
      // 检查正确答案对应的选项是否有内容
      const correctOptions = (options || []).filter(o => o.is_correct);
      const emptyCorrect = correctOptions.find(o => !o.content.trim());
      if (emptyCorrect) {
        errors.correctAnswer = '正确选项的内容不能为空';
      }
      break;
    }

    case 'true_false': {
      const answer = question.correct_answer;
      const answerStr = Array.isArray(answer) ? String(answer[0] ?? '') : (answer == null ? '' : String(answer));
      const normalized = answerStr.trim().toLowerCase();
      const isValid = normalized === 'true' || normalized === 'false' || normalized === 't' || normalized === 'f' || answerStr.trim() === '√' || answerStr.trim() === '×';
      if (!isValid) {
        errors.correctAnswer = '请选择正确或错误';
      }
      break;
    }

    case 'fill_blank': {
      const answer = question.correct_answer;
      if (Array.isArray(answer)) {
        // 多空答案：逐个检查
        const emptyBlanks = answer.filter((s) => !String(s ?? '').trim());
        if (emptyBlanks.length > 0) {
          errors.correctAnswer = `有 ${emptyBlanks.length} 个空的答案未填写`;
        }
        if (answer.length === 0) {
          errors.correctAnswer = '正确答案不能为空';
        }
      } else {
        const answerStr = answer == null ? '' : String(answer);
        if (!answerStr.trim()) {
          errors.correctAnswer = '正确答案不能为空';
        } else if (answerStr.trim().startsWith('[')) {
          try {
            const parsed = JSON.parse(answerStr);
            if (Array.isArray(parsed)) {
              const emptyBlanks = parsed.filter((s: unknown) => !String(s).trim());
              if (emptyBlanks.length > 0) {
                errors.correctAnswer = `有 ${emptyBlanks.length} 个空的答案未填写`;
              }
            }
          } catch {
            errors.correctAnswer = '答案格式错误';
          }
        }
      }
      break;
    }

    case 'short_answer': {
      const answer = question.correct_answer;
      const answerStr = Array.isArray(answer) ? String(answer[0] ?? '') : (answer == null ? '' : String(answer));
      if (!answerStr.trim()) {
        errors.correctAnswer = '参考答案不能为空';
      }
      break;
    }
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

/**
 * 验证整个习题集
 */
export function validateQuiz(
  title: string,
  questions: Question[],
  optionsMap?: Map<string, QuestionOption[]>
): QuizValidationError {
  const errors: QuizValidationError = { questions: [] };

  // 标题
  if (!title.trim()) {
    errors.title = '请输入习题标题';
  } else if (title.trim().length > 100) {
    errors.title = '标题不能超过 100 字';
  }

  // 题目列表
  if (questions.length === 0) {
    errors.questions = [];
  } else {
    errors.questions = questions.map(q => {
      const options = optionsMap?.get(q.id);
      return validateQuestion(q, options);
    });
  }

  return errors;
}

/**
 * 检查验证结果是否有错误
 */
export function hasValidationErrors(errors: QuizValidationError): boolean {
  if (errors.title) return true;
  return errors.questions.some(q => q !== null);
}

/**
 * 获取有错误的题目数量
 */
export function countQuestionErrors(errors: QuizValidationError): number {
  return errors.questions.filter(q => q !== null).length;
}

/**
 * 获取第一道有错误的题目索引
 */
export function getFirstErrorIndex(errors: QuizValidationError): number {
  return errors.questions.findIndex(q => q !== null);
}

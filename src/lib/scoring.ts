import type { Question, QuestionOption } from '../types';

export function gradeAnswer(
  question: Question,
  userAnswer: string | string[],
  options?: QuestionOption[]
): { isCorrect: boolean; pointsAwarded: number } {
  const { type, correct_answer, points } = question;
  
  switch (type) {
    case 'single_choice':
      return gradeSingleChoice(correct_answer as string, userAnswer as string, points, options);

    case 'multiple_choice':
      return gradeMultipleChoice(correct_answer as string[], userAnswer as string[], points, options);

    case 'true_false':
      return gradeTrueFalse(correct_answer as string, userAnswer as string, points);

    case 'fill_blank':
      return gradeFillBlank(correct_answer as string, userAnswer as string, points);

    case 'short_answer':
      return gradeShortAnswer(correct_answer as string, userAnswer as string, points);

    default:
      return { isCorrect: false, pointsAwarded: 0 };
  }
}

function gradeSingleChoice(
  correctAnswer: string,
  userAnswer: string,
  points: number,
  options?: QuestionOption[]
): { isCorrect: boolean; pointsAwarded: number } {
  // Resolve correctAnswer to option content for comparison
  // (DB may store correct_answer as: option id UUID, letter label "B", or content text)
  if (options && options.length > 0) {
    // 1. Try matching as a letter label (A/B/C/D) by position
    const letterIdx = ['A', 'B', 'C', 'D', 'E', 'F'].indexOf(correctAnswer.trim().toUpperCase());
    if (letterIdx >= 0 && letterIdx < options.length) {
      const correctContent = options[letterIdx].content;
      if (userAnswer === correctContent) {
        return { isCorrect: true, pointsAwarded: points };
      }
    }

    // 2. Try matching as option id (UUID)
    const byId = options.find((o) => o.id === correctAnswer);
    if (byId) {
      if (userAnswer === byId.content) {
        return { isCorrect: true, pointsAwarded: points };
      }
    }

    // 3. Try matching as content directly
    const byContent = options.find((o) => o.content === correctAnswer);
    if (byContent) {
      if (userAnswer === byContent.content) {
        return { isCorrect: true, pointsAwarded: points };
      }
    }

    // Fall through to direct string compare
  }
  const isCorrect = correctAnswer === userAnswer;
  return { isCorrect, pointsAwarded: isCorrect ? points : 0 };
}

function gradeMultipleChoice(
  correctAnswers: string[],
  userAnswers: string[],
  points: number,
  options?: QuestionOption[]
): { isCorrect: boolean; pointsAwarded: number } {
  // Resolve each correctAnswer: may be letter label, id, or content
  const resolvedCorrect = options && options.length > 0
    ? correctAnswers.map((c) => {
        const trimmed = c.trim().toUpperCase();
        const letterIdx = ['A', 'B', 'C', 'D', 'E', 'F'].indexOf(trimmed);
        if (letterIdx >= 0 && letterIdx < options.length) {
          return options[letterIdx].content;
        }
        const byId = options.find((o) => o.id === c);
        if (byId) return byId.content;
        const byContent = options.find((o) => o.content === c);
        if (byContent) return byContent.content;
        return c;
      })
    : correctAnswers;

  const sortedCorrect = [...resolvedCorrect].sort();
  const sortedUser = [...userAnswers].sort();
  const isCorrect =
    sortedCorrect.length === sortedUser.length &&
    sortedCorrect.every((answer, index) => answer === sortedUser[index]);

  // Partial credit for multiple choice
  if (isCorrect) {
    return { isCorrect: true, pointsAwarded: points };
  }

  // Calculate partial credit
  const correctCount = sortedUser.filter(answer => sortedCorrect.includes(answer)).length;
  const partialPoints = Math.floor((correctCount / sortedCorrect.length) * points);

  return { isCorrect: false, pointsAwarded: partialPoints };
}

function gradeTrueFalse(
  correctAnswer: string,
  userAnswer: string,
  points: number
): { isCorrect: boolean; pointsAwarded: number } {
  // 兼容: 'true'/'false' / '√'/'×' / 'T'/'F'（用户输入必须为 'true'/'false'）
  const norm = (v: string) => {
    const s = v.toLowerCase().trim();
    if (s === 'true' || s === 't' || s === '√') return 'true';
    return 'false';
  };
  const isCorrect = norm(correctAnswer) === norm(userAnswer);
  return { isCorrect, pointsAwarded: isCorrect ? points : 0 };
}

function gradeFillBlank(
  correctAnswer: string,
  userAnswer: string | string[],
  points: number
): { isCorrect: boolean; pointsAwarded: number } {
  // Multi-blank fill-in: correct_answer stored as JSON array string e.g. '["空1","空2"]'
  const parsedCorrect = parseFillBlankAnswer(correctAnswer);
  const isMultiBlank = Array.isArray(parsedCorrect);

  if (isMultiBlank) {
    return gradeMultiBlankFill(parsedCorrect as string[], userAnswer, points);
  }

  // Single blank: simple case-insensitive comparison
  const normalizedCorrect = (parsedCorrect as string).toLowerCase().trim();
  const normalizedUser = (typeof userAnswer === 'string' ? userAnswer : userAnswer[0] || '').toLowerCase().trim();
  const isCorrect = normalizedCorrect === normalizedUser;
  return { isCorrect, pointsAwarded: isCorrect ? points : 0 };
}

/**
 * Parse fill_blank correct_answer — may be a plain string or a JSON array string
 */
function parseFillBlankAnswer(raw: string): string | string[] {
  const trimmed = raw.trim();
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((s: unknown) => String(s));
      }
    } catch { /* fall through to plain string */ }
  }
  return raw;
}

/**
 * Grade multi-blank fill-in with partial credit per blank
 */
function gradeMultiBlankFill(
  correctAnswers: string[],
  userAnswer: string | string[],
  points: number
): { isCorrect: boolean; pointsAwarded: number } {
  // Normalize user answer to array
  const userAnswers: string[] = Array.isArray(userAnswer)
    ? userAnswer
    : (typeof userAnswer === 'string' ? [userAnswer] : []);

  const blankCount = correctAnswers.length;
  let correctCount = 0;

  for (let i = 0; i < blankCount; i++) {
    const correct = correctAnswers[i].toLowerCase().trim();
    const user = (userAnswers[i] || '').toLowerCase().trim();
    if (correct === user) correctCount++;
  }

  const allCorrect = correctCount === blankCount;
  const pointsPerBlank = points / blankCount;
  const pointsAwarded = Math.round(correctCount * pointsPerBlank);

  return { isCorrect: allCorrect, pointsAwarded };
}

function gradeShortAnswer(
  correctAnswer: string,
  userAnswer: string,
  points: number
): { isCorrect: boolean; pointsAwarded: number } {
  // For short answer, we'll do a simple comparison
  // In a real app, you might want more sophisticated matching
  const normalizedCorrect = correctAnswer.toLowerCase().trim();
  const normalizedUser = userAnswer.toLowerCase().trim();
  
  const isCorrect = normalizedCorrect === normalizedUser;
  return { isCorrect, pointsAwarded: isCorrect ? points : 0 };
}

export function calculateTotalScore(
  questions: Question[],
  answers: Map<string, string | string[]>
): number {
  let totalScore = 0;
  
  for (const question of questions) {
    const userAnswer = answers.get(question.id);
    if (userAnswer) {
      const { pointsAwarded } = gradeAnswer(question, userAnswer);
      totalScore += pointsAwarded;
    }
  }
  
  return totalScore;
}

export function calculateTotalPoints(questions: Question[]): number {
  return questions.reduce((total, question) => total + question.points, 0);
}
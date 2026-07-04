import type { Question, QuestionOption } from '../types';

export function gradeAnswer(
  question: Question,
  userAnswer: string | string[],
  options?: QuestionOption[]
): { isCorrect: boolean; pointsAwarded: number } {
  const { type, correct_answer, points } = question;
  
  switch (type) {
    case 'single_choice':
      return gradeSingleChoice(correct_answer as string, userAnswer as string, points);
    
    case 'multiple_choice':
      return gradeMultipleChoice(correct_answer as string[], userAnswer as string[], points);
    
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
  points: number
): { isCorrect: boolean; pointsAwarded: number } {
  const isCorrect = correctAnswer === userAnswer;
  return { isCorrect, pointsAwarded: isCorrect ? points : 0 };
}

function gradeMultipleChoice(
  correctAnswers: string[],
  userAnswers: string[],
  points: number
): { isCorrect: boolean; pointsAwarded: number } {
  const sortedCorrect = [...correctAnswers].sort();
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
  const isCorrect = correctAnswer.toLowerCase() === userAnswer.toLowerCase();
  return { isCorrect, pointsAwarded: isCorrect ? points : 0 };
}

function gradeFillBlank(
  correctAnswer: string,
  userAnswer: string,
  points: number
): { isCorrect: boolean; pointsAwarded: number } {
  // Case-insensitive, trim whitespace
  const normalizedCorrect = correctAnswer.toLowerCase().trim();
  const normalizedUser = userAnswer.toLowerCase().trim();
  
  const isCorrect = normalizedCorrect === normalizedUser;
  return { isCorrect, pointsAwarded: isCorrect ? points : 0 };
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
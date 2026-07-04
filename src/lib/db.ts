import Dexie, { type Table } from 'dexie';
import type { Quiz, Question, QuestionOption, QuizAttempt, AttemptAnswer, ReferenceMaterial } from '../types';

interface OfflineQuiz extends Quiz {
  _synced: boolean;
  _lastModified: string;
}

interface OfflineQuestion extends Question {
  _synced: boolean;
  _lastModified: string;
}

interface OfflineQuestionOption extends QuestionOption {
  _synced: boolean;
  _lastModified: string;
}

interface OfflineQuizAttempt extends QuizAttempt {
  _synced: boolean;
  _lastModified: string;
}

interface OfflineAttemptAnswer extends AttemptAnswer {
  _synced: boolean;
  _lastModified: string;
}

interface OfflineReferenceMaterial extends ReferenceMaterial {
  _synced: boolean;
  _lastModified: string;
}

class IQuizDatabase extends Dexie {
  quizzes!: Table<OfflineQuiz>;
  questions!: Table<OfflineQuestion>;
  questionOptions!: Table<OfflineQuestionOption>;
  quizAttempts!: Table<OfflineQuizAttempt>;
  attemptAnswers!: Table<OfflineAttemptAnswer>;
  referenceMaterials!: Table<OfflineReferenceMaterial>;

  constructor() {
    super('IQuizDB');
    this.version(1).stores({
      quizzes: 'id, user_id, _synced, _lastModified',
      questions: 'id, quiz_id, _synced, _lastModified',
      questionOptions: 'id, question_id, _synced, _lastModified',
      quizAttempts: 'id, user_id, quiz_id, _synced, _lastModified',
      attemptAnswers: 'id, attempt_id, question_id, _synced, _lastModified',
      referenceMaterials: 'id, quiz_id, _synced, _lastModified',
    });
  }
}

export const db = new IQuizDatabase();

// Helper functions for offline operations
export async function saveQuizOffline(quiz: Quiz): Promise<void> {
  await db.quizzes.put({
    ...quiz,
    _synced: false,
    _lastModified: new Date().toISOString(),
  });
}

export async function saveQuestionOffline(question: Question): Promise<void> {
  await db.questions.put({
    ...question,
    _synced: false,
    _lastModified: new Date().toISOString(),
  });
}

export async function saveQuestionOptionOffline(option: QuestionOption): Promise<void> {
  await db.questionOptions.put({
    ...option,
    _synced: false,
    _lastModified: new Date().toISOString(),
  });
}

export async function getUnsyncedQuizzes(): Promise<OfflineQuiz[]> {
  return await db.quizzes.where('_synced').equals(0).toArray();
}

export async function getUnsyncedQuestions(): Promise<OfflineQuestion[]> {
  return await db.questions.where('_synced').equals(0).toArray();
}

export async function markAsSynced(tableName: string, id: string): Promise<void> {
  const table = db.table(tableName);
  await table.update(id, { _synced: true });
}

export async function syncOfflineData(): Promise<void> {
  // This would sync with Supabase when online
  // Implementation depends on your sync strategy
  console.log('Syncing offline data...');
}
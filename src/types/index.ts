export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  created_at: string;
}

export interface Quiz {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  cover_image_url?: string;
  is_published: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export type QuestionType = 'single_choice' | 'multiple_choice' | 'true_false' | 'fill_blank' | 'short_answer';

export interface Question {
  id: string;
  quiz_id: string;
  type: QuestionType;
  content: string;
  order_index: number;
  correct_answer: string | string[];
  points: number;
  explanation?: string;
  created_at: string;
}

export interface QuestionOption {
  id: string;
  question_id: string;
  content: string;
  is_correct: boolean;
  order_index: number;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  score?: number;
  total_points: number;
  started_at: string;
  completed_at?: string;
  time_taken: number;
}

export interface AttemptAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  user_answer: string | string[];
  is_correct?: boolean;
  points_awarded?: number;
}

export interface ReferenceMaterial {
  id: string;
  quiz_id: string;
  file_name: string;
  file_type: 'pdf' | 'image';
  file_url: string;
  file_size: number;
  created_at: string;
}
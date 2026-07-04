export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          display_name: string
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          display_name: string
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string
          avatar_url?: string | null
          created_at?: string
        }
      }
      quizzes: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          cover_image_url: string | null
          is_published: boolean
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          cover_image_url?: string | null
          is_published?: boolean
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          cover_image_url?: string | null
          is_published?: boolean
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          quiz_id: string
          type: 'single_choice' | 'multiple_choice' | 'true_false' | 'fill_blank' | 'short_answer'
          content: string
          order_index: number
          correct_answer: Json
          points: number
          explanation: string | null
          created_at: string
        }
        Insert: {
          id?: string
          quiz_id: string
          type: 'single_choice' | 'multiple_choice' | 'true_false' | 'fill_blank' | 'short_answer'
          content: string
          order_index: number
          correct_answer: Json
          points?: number
          explanation?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          quiz_id?: string
          type?: 'single_choice' | 'multiple_choice' | 'true_false' | 'fill_blank' | 'short_answer'
          content?: string
          order_index?: number
          correct_answer?: Json
          points?: number
          explanation?: string | null
          created_at?: string
        }
      }
      question_options: {
        Row: {
          id: string
          question_id: string
          content: string
          is_correct: boolean
          order_index: number
        }
        Insert: {
          id?: string
          question_id: string
          content: string
          is_correct: boolean
          order_index: number
        }
        Update: {
          id?: string
          question_id?: string
          content?: string
          is_correct?: boolean
          order_index?: number
        }
      }
      quiz_attempts: {
        Row: {
          id: string
          user_id: string
          quiz_id: string
          score: number | null
          total_points: number
          started_at: string
          completed_at: string | null
          time_taken: number
        }
        Insert: {
          id?: string
          user_id: string
          quiz_id: string
          score?: number | null
          total_points: number
          started_at?: string
          completed_at?: string | null
          time_taken: number
        }
        Update: {
          id?: string
          user_id?: string
          quiz_id?: string
          score?: number | null
          total_points?: number
          started_at?: string
          completed_at?: string | null
          time_taken?: number
        }
      }
      attempt_answers: {
        Row: {
          id: string
          attempt_id: string
          question_id: string
          user_answer: Json
          is_correct: boolean | null
          points_awarded: number | null
        }
        Insert: {
          id?: string
          attempt_id: string
          question_id: string
          user_answer: Json
          is_correct?: boolean | null
          points_awarded?: number | null
        }
        Update: {
          id?: string
          attempt_id?: string
          question_id?: string
          user_answer?: Json
          is_correct?: boolean | null
          points_awarded?: number | null
        }
      }
      reference_materials: {
        Row: {
          id: string
          quiz_id: string
          file_name: string
          file_type: 'pdf' | 'image'
          file_url: string
          file_size: number
          created_at: string
        }
        Insert: {
          id?: string
          quiz_id: string
          file_name: string
          file_type: 'pdf' | 'image'
          file_url: string
          file_size: number
          created_at?: string
        }
        Update: {
          id?: string
          quiz_id?: string
          file_name?: string
          file_type?: 'pdf' | 'image'
          file_url?: string
          file_size?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      question_type: 'single_choice' | 'multiple_choice' | 'true_false' | 'fill_blank' | 'short_answer'
      file_type: 'pdf' | 'image'
    }
  }
}
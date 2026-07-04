-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE question_type AS ENUM ('single_choice', 'multiple_choice', 'true_false', 'fill_blank', 'short_answer');
CREATE TYPE file_type AS ENUM ('pdf', 'image');

-- Create users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create quizzes table
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create questions table
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  type question_type NOT NULL,
  content TEXT NOT NULL,
  order_index INT NOT NULL,
  correct_answer JSONB NOT NULL,
  points INT DEFAULT 1,
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create question_options table
CREATE TABLE question_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  order_index INT NOT NULL
);

-- Create quiz_attempts table
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  score INT,
  total_points INT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  time_taken INT NOT NULL
);

-- Create attempt_answers table
CREATE TABLE attempt_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_answer JSONB NOT NULL,
  is_correct BOOLEAN,
  points_awarded INT
);

-- Create reference_materials table
CREATE TABLE reference_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type file_type NOT NULL,
  file_url TEXT NOT NULL,
  file_size INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_quizzes_user_id ON quizzes(user_id);
CREATE INDEX idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX idx_question_options_question_id ON question_options(question_id);
CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX idx_attempt_answers_attempt_id ON attempt_answers(attempt_id);
CREATE INDEX idx_reference_materials_quiz_id ON reference_materials(quiz_id);

-- Create RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reference_materials ENABLE ROW LEVEL SECURITY;

-- Users can only see their own profile
CREATE POLICY "users_self" ON users
  FOR ALL USING (auth.uid() = id);

-- Quiz policies
CREATE POLICY "quiz_owner" ON quizzes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "published_readable" ON quizzes
  FOR SELECT USING (is_published = true);

-- Question policies (via quiz ownership)
CREATE POLICY "question_via_quiz" ON questions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = quiz_id AND quizzes.user_id = auth.uid())
  );

-- Question options policies (via question ownership)
CREATE POLICY "option_via_question" ON question_options
  FOR ALL USING (
    EXISTS (SELECT 1 FROM questions WHERE questions.id = question_id AND questions.quiz_id IN (
      SELECT id FROM quizzes WHERE user_id = auth.uid()
    ))
  );

-- Quiz attempt policies
CREATE POLICY "attempt_owner" ON quiz_attempts
  FOR ALL USING (auth.uid() = user_id);

-- Attempt answer policies
CREATE POLICY "attempt_answer_owner" ON attempt_answers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM quiz_attempts WHERE quiz_attempts.id = attempt_id AND quiz_attempts.user_id = auth.uid())
  );

-- Reference material policies
CREATE POLICY "material_via_quiz" ON reference_materials
  FOR ALL USING (
    EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = quiz_id AND quizzes.user_id = auth.uid())
  );

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for quizzes
CREATE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE ON quizzes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
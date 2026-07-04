-- 添加 RLS 策略：允许任何人查看已发布习题的题目
-- 之前只允许习题所有者查看题目，导致非所有者在答题时看到"该习题还没有题目"

CREATE POLICY "question_via_published_quiz" ON questions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = quiz_id AND quizzes.is_published = true)
  );

-- 同样为 question_options 添加策略
CREATE POLICY "option_via_published_quiz" ON question_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM questions
      JOIN quizzes ON quizzes.id = questions.quiz_id
      WHERE questions.id = question_options.question_id
        AND quizzes.is_published = true
    )
  );

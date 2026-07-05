-- Fix quiz_attempts.time_taken NOT NULL constraint by providing default value
-- This allows INSERT without specifying time_taken (it will be 0 until completed)

ALTER TABLE quiz_attempts
  ALTER COLUMN time_taken SET DEFAULT 0;

-- Fix RLS policy: add WITH CHECK clause so authenticated users can insert their own attempts
-- (currently USING clause only works for SELECT/UPDATE/DELETE; INSERT needs WITH CHECK)

DROP POLICY IF EXISTS "attempt_owner" ON quiz_attempts;
CREATE POLICY "attempt_owner" ON quiz_attempts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "attempt_answer_owner" ON attempt_answers;
CREATE POLICY "attempt_answer_owner" ON attempt_answers
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM quiz_attempts WHERE quiz_attempts.id = attempt_id AND quiz_attempts.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM quiz_attempts WHERE quiz_attempts.id = attempt_id AND quiz_attempts.user_id = auth.uid())
  );

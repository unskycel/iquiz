import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../lib/supabase-server';
import { supabase } from '../../../../lib/supabase';
import { gradeAnswer } from '../../../../lib/scoring';

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Attempt ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify attempt ownership
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('quiz_attempts')
      .select('user_id, quiz_id')
      .eq('id', id)
      .single();

    if (attemptError || !attempt) {
      return new Response(JSON.stringify({ error: 'Attempt not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (attempt.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse batch payload: { answers: [{ questionId, userAnswer }, ...] }
    const { answers: batchAnswers } = await request.json();

    if (!Array.isArray(batchAnswers) || batchAnswers.length === 0) {
      return new Response(JSON.stringify({ error: 'Answers array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Collect all question IDs
    const questionIds = batchAnswers.map((a: any) => a.questionId);

    // Batch fetch all questions with options
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('questions')
      .select('*, question_options(*)')
      .in('id', questionIds);

    if (questionsError) {
      return new Response(JSON.stringify({ error: questionsError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build a map for quick lookup
    const questionMap = new Map(questions.map(q => [q.id, q]));

    // Grade all answers and prepare upsert payload
    const upsertPayload = batchAnswers.map((a: any) => {
      const question = questionMap.get(a.questionId);
      if (!question) return null;

      const { isCorrect, pointsAwarded } = gradeAnswer(question, a.userAnswer, question.question_options);

      return {
        attempt_id: id,
        question_id: a.questionId,
        user_answer: a.userAnswer,
        is_correct: isCorrect,
        points_awarded: pointsAwarded,
      };
    }).filter(Boolean);

    // Get existing answers for this attempt to determine insert vs update
    const { data: existingAnswers } = await supabaseAdmin
      .from('attempt_answers')
      .select('id, question_id')
      .eq('attempt_id', id);

    const existingMap = new Map((existingAnswers || []).map(a => [a.question_id, a.id]));

    // Split into updates and inserts
    const toUpdate = upsertPayload.filter(p => existingMap.has(p.question_id));
    const toInsert = upsertPayload.filter(p => !existingMap.has(p.question_id));

    // Execute updates
    for (const item of toUpdate) {
      await supabaseAdmin
        .from('attempt_answers')
        .update({
          user_answer: item.user_answer,
          is_correct: item.is_correct,
          points_awarded: item.points_awarded,
        })
        .eq('id', existingMap.get(item.question_id));
    }

    // Batch insert new answers
    if (toInsert.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('attempt_answers')
        .insert(toInsert);

      if (insertError) {
        return new Response(JSON.stringify({ error: insertError.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Calculate total score
    const totalScore = upsertPayload.reduce((sum, p) => sum + p.points_awarded, 0);

    return new Response(JSON.stringify({
      success: true,
      count: upsertPayload.length,
      score: totalScore,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[PUT /api/attempts/:id/answers] error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

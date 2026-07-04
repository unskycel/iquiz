import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { gradeAnswer } from '../../../lib/scoring';

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
    const { data: attempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .select('user_id')
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

    const { questionId, userAnswer } = await request.json();

    // Get question
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('*, question_options(*)')
      .eq('id', questionId)
      .single();

    if (questionError || !question) {
      return new Response(JSON.stringify({ error: 'Question not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Grade the answer
    const { isCorrect, pointsAwarded } = gradeAnswer(question, userAnswer, question.question_options);

    // Save or update answer
    const { data: existingAnswer } = await supabase
      .from('attempt_answers')
      .select('id')
      .eq('attempt_id', id)
      .eq('question_id', questionId)
      .single();

    let answer;
    if (existingAnswer) {
      // Update existing answer
      const { data: updatedAnswer, error: updateError } = await supabase
        .from('attempt_answers')
        .update({
          user_answer: userAnswer,
          is_correct: isCorrect,
          points_awarded: pointsAwarded,
        })
        .eq('id', existingAnswer.id)
        .select()
        .single();

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      answer = updatedAnswer;
    } else {
      // Create new answer
      const { data: newAnswer, error: createError } = await supabase
        .from('attempt_answers')
        .insert({
          attempt_id: id,
          question_id: questionId,
          user_answer: userAnswer,
          is_correct: isCorrect,
          points_awarded: pointsAwarded,
        })
        .select()
        .single();

      if (createError) {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      answer = newAnswer;
    }

    return new Response(JSON.stringify({ answer, isCorrect, pointsAwarded }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
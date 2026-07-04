import type { APIRoute } from 'astro';
import { supabase } from '../../../../../lib/supabase';

export const GET: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Quiz ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data: questions, error } = await supabase
      .from('questions')
      .select('*, question_options(*)')
      .eq('quiz_id', id)
      .order('order_index');

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ questions }), {
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

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Quiz ID required' }), {
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

    // Check quiz ownership
    const { data: quiz, error: fetchError } = await supabase
      .from('quizzes')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !quiz) {
      return new Response(JSON.stringify({ error: 'Quiz not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (quiz.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { type, content, correct_answer, points, explanation, options } = await request.json();

    // Get next order index
    const { data: lastQuestion } = await supabase
      .from('questions')
      .select('order_index')
      .eq('quiz_id', id)
      .order('order_index', { ascending: false })
      .limit(1)
      .single();

    const nextOrderIndex = lastQuestion ? lastQuestion.order_index + 1 : 1;

    // Create question
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .insert({
        quiz_id: id,
        type,
        content,
        order_index: nextOrderIndex,
        correct_answer,
        points: points || 1,
        explanation,
      })
      .select()
      .single();

    if (questionError) {
      return new Response(JSON.stringify({ error: questionError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create options if provided
    if (options && options.length > 0) {
      const optionsToInsert = options.map((option: any, index: number) => ({
        question_id: question.id,
        content: option.content,
        is_correct: option.is_correct,
        order_index: index + 1,
      }));

      await supabase.from('question_options').insert(optionsToInsert);
    }

    // Fetch question with options
    const { data: questionWithOptions } = await supabase
      .from('questions')
      .select('*, question_options(*)')
      .eq('id', question.id)
      .single();

    return new Response(JSON.stringify({ question: questionWithOptions }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
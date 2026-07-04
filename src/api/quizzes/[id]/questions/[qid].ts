import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const { id, qid } = params;
    if (!id || !qid) {
      return new Response(JSON.stringify({ error: 'Quiz ID and Question ID required' }), {
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

    const updates = await request.json();

    // Update question
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .update(updates)
      .eq('id', qid)
      .eq('quiz_id', id)
      .select()
      .single();

    if (questionError) {
      return new Response(JSON.stringify({ error: questionError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update options if provided
    if (updates.options) {
      // Delete existing options
      await supabase
        .from('question_options')
        .delete()
        .eq('question_id', qid);

      // Insert new options
      const optionsToInsert = updates.options.map((option: any, index: number) => ({
        question_id: qid,
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
      .eq('id', qid)
      .single();

    return new Response(JSON.stringify({ question: questionWithOptions }), {
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

export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    const { id, qid } = params;
    if (!id || !qid) {
      return new Response(JSON.stringify({ error: 'Quiz ID and Question ID required' }), {
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

    // Delete question (options will be deleted by cascade)
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', qid)
      .eq('quiz_id', id);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'Question deleted' }), {
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
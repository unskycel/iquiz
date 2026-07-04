import type { APIRoute } from 'astro';
import { supabase } from '../../../../../lib/supabase';

export const PUT: APIRoute = async ({ params, request }) => {
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

    const { questionIds } = await request.json();

    // Update order for each question
    const updates = questionIds.map((questionId: string, index: number) => ({
      id: questionId,
      order_index: index + 1,
    }));

    // Batch update
    for (const update of updates) {
      await supabase
        .from('questions')
        .update({ order_index: update.order_index })
        .eq('id', update.id)
        .eq('quiz_id', id);
    }

    return new Response(JSON.stringify({ message: 'Questions reordered' }), {
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
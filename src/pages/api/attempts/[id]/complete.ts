import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../lib/supabase-server';
import { supabase } from '../../../../lib/supabase';

export const POST: APIRoute = async ({ params, request }) => {
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
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (attemptError || !attempt) {
      return new Response(JSON.stringify({ error: 'Attempt not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Calculate total score from answers
    const { data: answers, error: answersError } = await supabaseAdmin
      .from('attempt_answers')
      .select('points_awarded')
      .eq('attempt_id', id);

    if (answersError) {
      return new Response(JSON.stringify({ error: answersError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const score = answers?.reduce((sum, answer) => sum + (answer.points_awarded || 0), 0) || 0;
    const timeTaken = Math.floor((Date.now() - new Date(attempt.started_at).getTime()) / 1000);

    // Update attempt
    const { data: updatedAttempt, error: updateError } = await supabaseAdmin
      .from('quiz_attempts')
      .update({
        score,
        completed_at: new Date().toISOString(),
        time_taken: timeTaken,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ attempt: updatedAttempt, score, totalPoints: attempt.total_points }), {
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
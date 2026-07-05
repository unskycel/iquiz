import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  try {
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

    const { quizId } = await request.json();

    // Get quiz and calculate total points
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('points')
      .eq('quiz_id', quizId);

    if (questionsError) {
      return new Response(JSON.stringify({ error: questionsError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const totalPoints = questions?.reduce((sum, q) => sum + q.points, 0) || 0;

    // Create attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .insert({
        user_id: user.id,
        quiz_id: quizId,
        total_points: totalPoints,
      })
      .select()
      .single();

    if (attemptError) {
      console.error('[POST /api/attempts] insert failed:', attemptError);
      return new Response(JSON.stringify({ error: attemptError.message, code: attemptError.code, details: attemptError.details, hint: attemptError.hint }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ attempt }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[POST /api/attempts] uncaught error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
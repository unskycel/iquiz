import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { supabaseAdmin } from '../../../lib/supabase-server';

export const GET: APIRoute = async ({ request }) => {
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

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const quizId = url.searchParams.get('quizId');
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('quiz_attempts')
      .select('*, quizzes(title)')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (quizId) {
      query = query.eq('quiz_id', quizId);
    }

    const { data: attempts, error } = await query;

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get total count
    let countQuery = supabaseAdmin
      .from('quiz_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('completed_at', 'is', null);

    if (quizId) {
      countQuery = countQuery.eq('quiz_id', quizId);
    }

    const { count } = await countQuery;

    return new Response(JSON.stringify({ attempts, total: count }), {
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
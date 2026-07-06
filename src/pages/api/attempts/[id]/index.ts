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

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // empty body is fine
    }

    // Handle delete action via POST (Vercel blocks DELETE on dynamic routes)
    if (body.action === 'delete') {
      // Verify ownership
      const { data: attempt, error: findError } = await supabaseAdmin
        .from('quiz_attempts')
        .select('id, user_id')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (findError || !attempt) {
        return new Response(JSON.stringify({ error: 'Record not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Delete attempt_answers first (foreign key)
      const { error: answersDeleteError } = await supabaseAdmin
        .from('attempt_answers')
        .delete()
        .eq('attempt_id', id);

      if (answersDeleteError) {
        return new Response(JSON.stringify({ error: answersDeleteError.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Delete the attempt
      const { error: attemptDeleteError } = await supabaseAdmin
        .from('quiz_attempts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (attemptDeleteError) {
        return new Response(JSON.stringify({ error: attemptDeleteError.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[POST /api/attempts/:id] error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
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

    // Verify ownership
    const { data: attempt, error: findError } = await supabaseAdmin
      .from('quiz_attempts')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (findError || !attempt) {
      return new Response(JSON.stringify({ error: 'Record not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete attempt_answers first (foreign key)
    const { error: answersDeleteError } = await supabaseAdmin
      .from('attempt_answers')
      .delete()
      .eq('attempt_id', id);

    if (answersDeleteError) {
      return new Response(JSON.stringify({ error: answersDeleteError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete the attempt
    const { error: attemptDeleteError } = await supabaseAdmin
      .from('quiz_attempts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (attemptDeleteError) {
      return new Response(JSON.stringify({ error: attemptDeleteError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[DELETE /api/attempts/:id] error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const GET: APIRoute = async ({ params, request }) => {
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

    // Get attempt
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('quiz_attempts')
      .select('*, quizzes(*)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (attemptError || !attempt) {
      return new Response(JSON.stringify({ error: attemptError?.message || 'Attempt not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get answers with questions
    const { data: answers, error: answersError } = await supabaseAdmin
      .from('attempt_answers')
      .select('*, questions(*, question_options(*))')
      .eq('attempt_id', id);

    if (answersError) {
      return new Response(JSON.stringify({ error: answersError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ attempt, answers }), {
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
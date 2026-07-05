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
    const offset = (page - 1) * limit;

    const { data: quizzes, error } = await supabaseAdmin
      .from('quizzes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get total count
    const { count } = await supabaseAdmin
      .from('quizzes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    return new Response(JSON.stringify({ quizzes, total: count }), {
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

    const body = await request.json();
    // Accept either { title, description, tags } (legacy) or { quiz, questions } (QuizEditor)
    const quizInput = body.quiz || body;
    const questionsInput: any[] = Array.isArray(body.questions) ? body.questions : [];

    const { title, description, tags } = quizInput;
    if (!title || !String(title).trim()) {
      return new Response(JSON.stringify({ error: 'Title is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data: quiz, error } = await supabaseAdmin
      .from('quizzes')
      .insert({
        user_id: user.id,
        title,
        description: description ?? null,
        tags: tags || [],
      })
      .select()
      .single();

    if (error) {
      console.error('[POST /api/quizzes] insert quiz error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Insert questions (with options) if provided
    const storedQuestions: any[] = [];
    for (let i = 0; i < questionsInput.length; i++) {
      const q = questionsInput[i];
      const { data: inserted, error: qErr } = await supabaseAdmin
        .from('questions')
        .insert({
          quiz_id: quiz.id,
          type: q.type,
          content: q.content,
          order_index: i + 1,
          correct_answer: q.correct_answer,
          points: q.points ?? 1,
          explanation: q.explanation ?? null,
        })
        .select()
        .single();

      if (qErr) {
        console.error('[POST /api/quizzes] insert question error:', qErr);
        continue;
      }

      // Insert options if present
      const options = Array.isArray(q.options) ? q.options : [];
      if (options.length > 0) {
        const optionRows = options.map((opt: any, oi: number) => ({
          question_id: inserted.id,
          content: opt.content ?? '',
          is_correct: !!opt.is_correct,
          order_index: oi + 1,
        }));
        const { error: optErr } = await supabaseAdmin.from('question_options').insert(optionRows);
        if (optErr) {
          console.error('[POST /api/quizzes] insert options error:', optErr);
        }
      }

      storedQuestions.push({ ...inserted, question_options: options });
    }

    return new Response(JSON.stringify({ quiz, questions: storedQuestions }), {
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
import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';

export const GET: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Quiz ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const authHeader = request.headers.get('Authorization');
    let userId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    // Get quiz
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', id)
      .single();

    if (quizError || !quiz) {
      return new Response(JSON.stringify({ error: 'Quiz not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if user can access this quiz
    if (!quiz.is_published && quiz.user_id !== userId) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get questions with options
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*, question_options(*)')
      .eq('quiz_id', id)
      .order('order_index');

    if (questionsError) {
      return new Response(JSON.stringify({ error: questionsError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ quiz, questions }), {
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

    // Check ownership
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

    const body = await request.json();
    // Accept either { ...quizFields } (legacy) or { quiz, questions } (QuizEditor)
    const quizUpdate: any = body.quiz || body;
    const questionsInput: any[] | null = Array.isArray(body.questions) ? body.questions : null;

    // Only update scalar quiz columns; ignore nested fields
    const updates: any = {};
    if ('title' in quizUpdate) updates.title = quizUpdate.title;
    if ('description' in quizUpdate) updates.description = quizUpdate.description ?? null;
    if ('tags' in quizUpdate) updates.tags = quizUpdate.tags || [];
    if ('is_published' in quizUpdate) updates.is_published = !!quizUpdate.is_published;

    const { data: updatedQuiz, error } = await supabase
      .from('quizzes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[PUT /api/quizzes/:id] update quiz error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Replace questions if provided (delete all + recreate)
    let storedQuestions: any[] = [];
    if (questionsInput !== null) {
      // Delete existing questions (cascade deletes options via FK)
      const { error: delErr } = await supabase
        .from('questions')
        .delete()
        .eq('quiz_id', id);
      if (delErr) {
        console.error('[PUT /api/quizzes/:id] delete questions error:', delErr);
        return new Response(JSON.stringify({ error: delErr.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Re-insert
      for (let i = 0; i < questionsInput.length; i++) {
        const q = questionsInput[i];
        const { data: inserted, error: qErr } = await supabase
          .from('questions')
          .insert({
            quiz_id: id,
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
          console.error('[PUT /api/quizzes/:id] insert question error:', qErr);
          continue;
        }

        const options = Array.isArray(q.options) ? q.options : [];
        if (options.length > 0) {
          const optionRows = options.map((opt: any, oi: number) => ({
            question_id: inserted.id,
            content: opt.content ?? '',
            is_correct: !!opt.is_correct,
            order_index: oi + 1,
          }));
          const { error: optErr } = await supabase.from('question_options').insert(optionRows);
          if (optErr) {
            console.error('[PUT /api/quizzes/:id] insert options error:', optErr);
          }
        }

        storedQuestions.push({ ...inserted, question_options: options });
      }
    }

    return new Response(JSON.stringify({ quiz: updatedQuiz, questions: storedQuestions }), {
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

    // Check ownership
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

    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', id);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'Quiz deleted' }), {
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
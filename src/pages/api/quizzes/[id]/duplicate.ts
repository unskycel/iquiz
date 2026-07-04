import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';

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

    // Get original quiz
    const { data: originalQuiz, error: fetchError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !originalQuiz) {
      return new Response(JSON.stringify({ error: 'Quiz not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if user can access this quiz
    if (!originalQuiz.is_published && originalQuiz.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create new quiz
    const { data: newQuiz, error: createError } = await supabase
      .from('quizzes')
      .insert({
        user_id: user.id,
        title: `${originalQuiz.title} (副本)`,
        description: originalQuiz.description,
        tags: originalQuiz.tags,
      })
      .select()
      .single();

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get original questions
    const { data: originalQuestions, error: questionsError } = await supabase
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

    // Duplicate questions
    for (const question of originalQuestions || []) {
      const { question_options, ...questionData } = question;
      
      const { data: newQuestion, error: questionError } = await supabase
        .from('questions')
        .insert({
          quiz_id: newQuiz.id,
          type: questionData.type,
          content: questionData.content,
          order_index: questionData.order_index,
          correct_answer: questionData.correct_answer,
          points: questionData.points,
          explanation: questionData.explanation,
        })
        .select()
        .single();

      if (questionError) {
        console.error('Error duplicating question:', questionError);
        continue;
      }

      // Duplicate options
      if (question_options && question_options.length > 0) {
        const optionsToInsert = question_options.map(option => ({
          question_id: newQuestion.id,
          content: option.content,
          is_correct: option.is_correct,
          order_index: option.order_index,
        }));

        await supabase.from('question_options').insert(optionsToInsert);
      }
    }

    return new Response(JSON.stringify({ quiz: newQuiz }), {
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
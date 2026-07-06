import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../lib/supabase-server';

export const GET: APIRoute = async ({ request, url }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse query params
    const quizId = url.searchParams.get('quizId');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10), 200);

    // Step 1: Get user's attempt IDs
    const { data: attempts, error: attemptsError } = await supabaseAdmin
      .from('quiz_attempts')
      .select('id')
      .eq('user_id', user.id);

    if (attemptsError) {
      return new Response(JSON.stringify({ error: attemptsError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const attemptIds = (attempts || []).map(a => a.id);
    if (attemptIds.length === 0) {
      return new Response(JSON.stringify({
        wrongAnswers: [],
        total: 0,
        quizSummary: [],
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Step 2: Fetch incorrect answers for these attempts
    let answerQuery = supabaseAdmin
      .from('attempt_answers')
      .select('id, user_answer, is_correct, points_awarded, created_at, question_id, attempt_id')
      .in('attempt_id', attemptIds)
      .eq('is_correct', false)
      .order('created_at', { ascending: false });

    if (quizId) {
      // Need question_ids belonging to this quiz — fetch them first
      const { data: quizQuestions } = await supabaseAdmin
        .from('questions')
        .select('id')
        .eq('quiz_id', quizId);
      const qIds = (quizQuestions || []).map(q => q.id);
      if (qIds.length === 0) {
        return new Response(JSON.stringify({
          wrongAnswers: [],
          total: 0,
          quizSummary: [],
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      answerQuery = answerQuery.in('question_id', qIds);
    }

    const { data: wrongAnswers, error: answerError } = await answerQuery.limit(limit);

    if (answerError) {
      return new Response(JSON.stringify({ error: answerError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!wrongAnswers || wrongAnswers.length === 0) {
      return new Response(JSON.stringify({
        wrongAnswers: [],
        total: 0,
        quizSummary: [],
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Step 3: Deduplicate by question_id (keep latest)
    const seenQuestions = new Set<string>();
    const dedupedAnswers = wrongAnswers.filter((wa: any) => {
      if (seenQuestions.has(wa.question_id)) return false;
      seenQuestions.add(wa.question_id);
      return true;
    });

    // Step 4: Batch fetch questions with options
    const questionIds = dedupedAnswers.map(wa => wa.question_id);
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('questions')
      .select('id, type, content, correct_answer, points, explanation, quiz_id')
      .in('id', questionIds);

    if (questionsError) {
      return new Response(JSON.stringify({ error: questionsError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Step 5: Batch fetch options
    const { data: options, error: optionsError } = await supabaseAdmin
      .from('question_options')
      .select('id, question_id, content, is_correct, order_index')
      .in('question_id', questionIds)
      .order('order_index', { ascending: true });

    if (optionsError) {
      return new Response(JSON.stringify({ error: optionsError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Step 6: Batch fetch quiz titles
    const quizIds = [...new Set(questions.map((q: any) => q.quiz_id))];
    const { data: quizzes } = await supabaseAdmin
      .from('quizzes')
      .select('id, title')
      .in('id', quizIds);

    // Step 7: Assemble response
    const questionMap = new Map(questions.map((q: any) => [q.id, q]));
    const quizMap = new Map((quizzes || []).map((q: any) => [q.id, q]));
    const optionsMap = new Map<string, any[]>();
    for (const opt of (options || [])) {
      const arr = optionsMap.get(opt.question_id) || [];
      arr.push(opt);
      optionsMap.set(opt.question_id, arr);
    }

    const result = dedupedAnswers.map((wa: any) => {
      const q = questionMap.get(wa.question_id);
      if (!q) return null;
      return {
        id: wa.id,
        user_answer: wa.user_answer,
        is_correct: wa.is_correct,
        points_awarded: wa.points_awarded,
        created_at: wa.created_at,
        question: {
          id: q.id,
          type: q.type,
          content: q.content,
          correct_answer: q.correct_answer,
          points: q.points,
          explanation: q.explanation,
          question_options: optionsMap.get(q.id) || [],
          quiz: {
            id: q.quiz_id,
            title: quizMap.get(q.quiz_id)?.title || '未知习题',
          },
        },
      };
    }).filter(Boolean);

    // Build quiz summary
    const quizSummaryMap = new Map<string, { quizId: string; quizTitle: string; wrongCount: number }>();
    for (const wa of result) {
      const qId = (wa as any).question?.quiz?.id;
      const qTitle = (wa as any).question?.quiz?.title;
      if (!qId) continue;
      const existing = quizSummaryMap.get(qId);
      if (existing) {
        existing.wrongCount++;
      } else {
        quizSummaryMap.set(qId, { quizId: qId, quizTitle: qTitle || '未知习题', wrongCount: 1 });
      }
    }

    return new Response(JSON.stringify({
      wrongAnswers: result,
      total: result.length,
      quizSummary: Array.from(quizSummaryMap.values()).sort((a, b) => b.wrongCount - a.wrongCount),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[GET /api/wrong-answers] error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

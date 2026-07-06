import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../lib/supabase-server';
import { supabase } from '../../lib/supabase-client';

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
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse query params
    const quizId = url.searchParams.get('quizId');
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = (page - 1) * limit;

    // Fetch incorrect answers with question and quiz info
    let query = supabaseAdmin
      .from('attempt_answers')
      .select(`
        id,
        user_answer,
        is_correct,
        points_awarded,
        created_at,
        question:questions (
          id,
          type,
          content,
          correct_answer,
          points,
          explanation,
          question_options (*),
          quiz:quizzes (
            id,
            title
          )
        ),
        attempt:quiz_attempts (
          id,
          completed_at
        )
      `, { count: 'exact' })
      .eq('is_correct', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by quiz if specified
    if (quizId) {
      query = query.eq('question.quiz_id', quizId);
    }

    const { data: wrongAnswers, error, count } = await query;

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Deduplicate: keep only the latest wrong answer per question
    const seenQuestions = new Set<string>();
    const deduped = (wrongAnswers || []).filter((wa: any) => {
      const qid = wa.question?.id;
      if (!qid || seenQuestions.has(qid)) return false;
      seenQuestions.add(qid);
      return true;
    });

    // Group by quiz for summary
    const quizSummary = new Map<string, { quizId: string; quizTitle: string; wrongCount: number }>();
    for (const wa of deduped) {
      const qId = wa.question?.quiz?.id;
      const qTitle = wa.question?.quiz?.title;
      if (!qId) continue;
      const existing = quizSummary.get(qId);
      if (existing) {
        existing.wrongCount++;
      } else {
        quizSummary.set(qId, { quizId: qId, quizTitle: qTitle || '未知习题', wrongCount: 1 });
      }
    }

    return new Response(JSON.stringify({
      wrongAnswers: deduped,
      total: deduped.length,
      totalCount: count || 0,
      quizSummary: Array.from(quizSummary.values()).sort((a, b) => b.wrongCount - a.wrongCount),
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
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

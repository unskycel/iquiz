import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase-server';
import { supabase } from '../../../lib/supabase';

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

    // 1. 获取所有完成的答题记录（含题目信息用于分析）
    const { data: allAttempts, error: attemptsError } = await supabaseAdmin
      .from('quiz_attempts')
      .select('id, quiz_id, score, total_points, time_taken, completed_at, quizzes(title)')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: true });

    if (attemptsError) {
      return new Response(JSON.stringify({ error: attemptsError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const attempts = allAttempts || [];

    // 2. 计算连续学习天数
    const dateSet = new Set<string>();
    attempts.forEach(a => {
      if (a.completed_at) {
        dateSet.add(a.completed_at.slice(0, 10));
      }
    });
    const today = new Date();
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      if (dateSet.has(dateStr)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    // 3. 本周/本月统计
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(now);
    monthAgo.setDate(monthAgo.getDate() - 30);

    const weekAttempts = attempts.filter(a => a.completed_at && new Date(a.completed_at) >= weekAgo);
    const monthAttempts = attempts.filter(a => a.completed_at && new Date(a.completed_at) >= monthAgo);

    // 4. 按习题维度汇总
    const quizMap = new Map<string, {
      quizId: string;
      title: string;
      attempts: number;
      bestScore: number;
      bestPercentage: number;
      totalScore: number;
      totalPoints: number;
      avgPercentage: number;
      lastAttemptAt: string;
      totalTime: number;
    }>();

    attempts.forEach(a => {
      const existing = quizMap.get(a.quiz_id);
      const percentage = a.total_points > 0 ? (a.score / a.total_points) * 100 : 0;
      if (existing) {
        existing.attempts++;
        existing.bestScore = Math.max(existing.bestScore, a.score || 0);
        existing.bestPercentage = Math.max(existing.bestPercentage, percentage);
        existing.totalScore += a.score || 0;
        existing.totalPoints += a.total_points;
        existing.avgPercentage = existing.totalPoints > 0 ? (existing.totalScore / existing.totalPoints) * 100 : 0;
        existing.totalTime += a.time_taken || 0;
        if (a.completed_at && a.completed_at > existing.lastAttemptAt) {
          existing.lastAttemptAt = a.completed_at;
        }
      } else {
        quizMap.set(a.quiz_id, {
          quizId: a.quiz_id,
          title: a.quizzes?.title || '未知习题',
          attempts: 1,
          bestScore: a.score || 0,
          bestPercentage: percentage,
          totalScore: a.score || 0,
          totalPoints: a.total_points,
          avgPercentage: percentage,
          lastAttemptAt: a.completed_at || '',
          totalTime: a.time_taken || 0,
        });
      }
    });

    const quizProgress = Array.from(quizMap.values()).sort((a, b) => b.lastAttemptAt.localeCompare(a.lastAttemptAt));

    // 5. 分数趋势（最近 20 次）
    const recentAttempts = attempts.slice(-20).map(a => ({
      score: a.score || 0,
      totalPoints: a.total_points,
      percentage: a.total_points > 0 ? Math.round((a.score / a.total_points) * 100) : 0,
      completedAt: a.completed_at,
      quizTitle: a.quizzes?.title || '',
      quizId: a.quiz_id,
    }));

    // 6. 总体统计
    const totalScore = attempts.reduce((sum, a) => sum + (a.score || 0), 0);
    const totalPoints = attempts.reduce((sum, a) => sum + a.total_points, 0);
    const totalTime = attempts.reduce((sum, a) => sum + (a.time_taken || 0), 0);
    const overallAvg = totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) : 0;

    // 7. 掌握度分析（按题型）
    const { data: allAnswers } = await supabaseAdmin
      .from('attempt_answers')
      .select('is_correct, questions(type)')
      .in('attempt_id', attempts.map(a => a.id));

    const typeStats = new Map<string, { total: number; correct: number }>();
    (allAnswers || []).forEach(a => {
      const type = (a as any).questions?.type || 'unknown';
      const existing = typeStats.get(type) || { total: 0, correct: 0 };
      existing.total++;
      if (a.is_correct) existing.correct++;
      typeStats.set(type, existing);
    });

    const masteryByType = Array.from(typeStats.entries()).map(([type, stats]) => ({
      type,
      typeLabel: {
        single_choice: '单选题',
        multiple_choice: '多选题',
        true_false: '判断题',
        fill_blank: '填空题',
        short_answer: '简答题',
      }[type] || type,
      total: stats.total,
      correct: stats.correct,
      accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    })).sort((a, b) => b.total - a.total);

    return new Response(JSON.stringify({
      overview: {
        totalAttempts: attempts.length,
        totalQuizzes: quizMap.size,
        overallAvg,
        totalTime: Math.round(totalTime / 60),
        streak,
        weekCount: weekAttempts.length,
        monthCount: monthAttempts.length,
        weekAvgTime: weekAttempts.length > 0
          ? Math.round(weekAttempts.reduce((s, a) => s + (a.time_taken || 0), 0) / weekAttempts.length / 60)
          : 0,
      },
      quizProgress,
      recentAttempts,
      masteryByType,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[GET /api/stats/progress] error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

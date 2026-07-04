import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';

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
    const { data: attempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .select('*, quizzes(*)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (attemptError || !attempt) {
      return new Response(JSON.stringify({ error: 'Attempt not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get answers with questions
    const { data: answers, error: answersError } = await supabase
      .from('attempt_answers')
      .select('*, questions(*, question_options(*))')
      .eq('attempt_id', id);

    if (answersError) {
      return new Response(JSON.stringify({ error: answersError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate PDF content
    const htmlContent = generateAttemptPDF(attempt, answers || []);

    return new Response(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${attempt.quizzes.title}_结果.html"`,
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

function generateAttemptPDF(attempt: any, answers: any[]): string {
  const score = attempt.score || 0;
  const totalPoints = attempt.total_points;
  const percentage = Math.round((score / totalPoints) * 100);
  const timeTaken = formatTime(attempt.time_taken);

  const answersHTML = answers.map((a, index) => {
    const question = a.questions;
    const userAnswer = Array.isArray(a.user_answer) ? a.user_answer.join(', ') : a.user_answer;
    const isCorrect = a.is_correct;
    const statusClass = isCorrect ? 'correct' : 'incorrect';
    const statusText = isCorrect ? '正确' : '错误';

    let correctAnswer = '';
    if (question.type === 'single_choice') {
      correctAnswer = question.correct_answer;
    } else if (question.type === 'multiple_choice') {
      correctAnswer = question.correct_answer.join(', ');
    } else if (question.type === 'true_false') {
      correctAnswer = question.correct_answer;
    } else {
      correctAnswer = question.correct_answer;
    }

    return `
      <div class="answer ${statusClass}">
        <div class="answer-header">
          <span class="answer-number">${index + 1}.</span>
          <span class="status ${statusClass}">${statusText}</span>
          <span class="points">+${a.points_awarded || 0}分</span>
        </div>
        <div class="question-content">${question.content}</div>
        <div class="answer-details">
          <div><strong>你的答案：</strong>${userAnswer}</div>
          ${!isCorrect ? `<div><strong>正确答案：</strong>${correctAnswer}</div>` : ''}
          ${question.explanation ? `<div class="explanation"><strong>解析：</strong>${question.explanation}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${attempt.quizzes.title} - 答题结果</title>
  <style>
    body { font-family: 'Microsoft YaHei', sans-serif; margin: 40px; line-height: 1.6; }
    .title { text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
    .summary { text-align: center; margin-bottom: 30px; padding: 20px; background: #f5f5f5; border-radius: 8px; }
    .score { font-size: 36px; font-weight: bold; color: ${percentage >= 60 ? '#10b981' : '#ef4444'}; }
    .percentage { font-size: 18px; color: #666; }
    .stats { display: flex; justify-content: center; gap: 40px; margin-top: 16px; }
    .stat { text-align: center; }
    .stat-value { font-size: 20px; font-weight: bold; }
    .stat-label { color: #666; font-size: 14px; }
    .answer { margin-bottom: 20px; padding: 16px; border: 1px solid #ddd; border-radius: 8px; }
    .answer.correct { border-color: #10b981; background: #f0fdf4; }
    .answer.incorrect { border-color: #ef4444; background: #fef2f2; }
    .answer-header { margin-bottom: 12px; display: flex; align-items: center; gap: 12px; }
    .answer-number { font-weight: bold; }
    .status { padding: 2px 8px; border-radius: 4px; font-size: 12px; }
    .status.correct { background: #10b981; color: white; }
    .status.incorrect { background: #ef4444; color: white; }
    .points { color: #666; font-size: 14px; }
    .question-content { margin-bottom: 12px; }
    .answer-details { font-size: 14px; color: #666; }
    .answer-details div { margin-bottom: 4px; }
    .explanation { margin-top: 8px; padding: 8px; background: #f5f5f5; border-radius: 4px; }
    .footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="title">${attempt.quizzes.title} - 答题结果</div>
  <div class="summary">
    <div class="score">${score}分</div>
    <div class="percentage">${percentage}%</div>
    <div class="stats">
      <div class="stat">
        <div class="stat-value">${answers.filter(a => a.is_correct).length}</div>
        <div class="stat-label">正确</div>
      </div>
      <div class="stat">
        <div class="stat-value">${answers.filter(a => !a.is_correct).length}</div>
        <div class="stat-label">错误</div>
      </div>
      <div class="stat">
        <div class="stat-value">${timeTaken}</div>
        <div class="stat-label">用时</div>
      </div>
    </div>
  </div>
  <div class="answers">${answersHTML}</div>
  <div class="footer">Generated by iQuiz</div>
</body>
</html>
  `;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}分${secs}秒`;
}
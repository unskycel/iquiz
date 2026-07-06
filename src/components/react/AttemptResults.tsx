import React, { useState, useEffect } from 'react';
import type { QuizAttempt, Question, AttemptAnswer } from '../../types';
import { getAccessToken } from '../../lib/auth-client';

interface AttemptResultsProps {
  attemptId: string;
}

interface AttemptData {
  attempt: QuizAttempt & { quizzes: { title: string } };
  answers: (AttemptAnswer & { questions: Question & { question_options: any[] } })[];
}

export function AttemptResults({ attemptId }: AttemptResultsProps) {
  const [data, setData] = useState<AttemptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    loadAttempt();
  }, [attemptId]);

  const loadAttempt = async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error('未登录');
      }

      const response = await fetch(`/api/attempts/${attemptId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load attempt');
      }

      const attemptData = await response.json();
      setData(attemptData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };

  const formatCorrectAnswer = (raw: string | string[]): string => {
    if (typeof raw === 'string' && raw.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map((v: string, i: number) => `空${i + 1}: ${v}`).join('；');
        }
      } catch { /* fall through */ }
    }
    return String(raw);
  };

  const getScorePercentage = (score: number, totalPoints: number): number => {
    return totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
  };

  const handleExportPDF = async () => {
    try {
      const token = getAccessToken();
      if (!token) return;

      const response = await fetch(`/api/export/attempts/${attemptId}.pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data?.attempt.quizzes.title || '结果'}_结果.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      setExportError('导出失败，请重试');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-muted-foreground text-sm">加载中...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
        </div>
        <p className="text-destructive mb-4">{error || '加载失败'}</p>
        <a href="/dashboard" className="btn-primary inline-flex items-center gap-2">
          返回控制台
        </a>
      </div>
    );
  }

  const { attempt, answers } = data;
  const score = attempt.score || 0;
  const totalPoints = attempt.total_points;
  const percentage = getScorePercentage(score, totalPoints);
  const correctCount = answers.filter(a => a.is_correct).length;
  const incorrectCount = answers.filter(a => !a.is_correct).length;
  const isPassed = percentage >= 60;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="card p-6">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h1 className="text-xl font-bold">{attempt.quizzes.title}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {attempt.completed_at ? new Date(attempt.completed_at).toLocaleString('zh-CN') : '-'}
            </p>
          </div>
          <button
            onClick={handleExportPDF}
            className="btn-outline text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0L16.5 7.5M12 3v13.5" />
            </svg>
            导出
          </button>
        </div>
        {exportError && (
          <div className="mt-3 p-2 bg-destructive/10 border border-destructive/20 text-destructive rounded text-sm flex items-center justify-between">
            <span>{exportError}</span>
            <button onClick={() => setExportError(null)} className="text-destructive/60 hover:text-destructive ml-2">&times;</button>
          </div>
        )}
      </div>

      {/* Score Summary */}
      <div className="card p-8 text-center relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 ${isPassed ? 'bg-success/8' : 'bg-destructive/8'}`}></div>
        <div className="relative">
          <div className={`text-5xl font-bold mb-1 ${isPassed ? 'text-success' : 'text-destructive'}`}>
            {score}<span className="text-2xl text-muted-foreground">/{totalPoints}</span>
          </div>
          <div className={`text-2xl font-semibold mb-1 ${isPassed ? 'text-success' : 'text-destructive'}`}>{percentage}%</div>
          <div className={`badge ${isPassed ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'} mb-6`}>
            {isPassed ? '通过' : '未通过'}
          </div>
          <div className="flex justify-center gap-8">
            <div>
              <div className="text-2xl font-bold text-success">{correctCount}</div>
              <div className="text-muted-foreground text-sm">正确</div>
            </div>
            <div className="w-px bg-border"></div>
            <div>
              <div className="text-2xl font-bold text-destructive">{incorrectCount}</div>
              <div className="text-muted-foreground text-sm">错误</div>
            </div>
            <div className="w-px bg-border"></div>
            <div>
              <div className="text-2xl font-bold text-muted-foreground">{formatTime(attempt.time_taken)}</div>
              <div className="text-muted-foreground text-sm">用时</div>
            </div>
          </div>
        </div>
      </div>

      {/* Answers */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold px-1">答题详情</h2>
        {answers.map((answer, index) => {
          const question = answer.questions;
          const userAnswer = Array.isArray(answer.user_answer)
            ? answer.user_answer.join(', ')
            : answer.user_answer || '(未作答)';
          
          let correctAnswer = '';
          if (question.type === 'single_choice') {
            correctAnswer = question.correct_answer as string;
          } else if (question.type === 'multiple_choice') {
            correctAnswer = (question.correct_answer as string[]).join(', ');
          } else if (question.type === 'true_false') {
            correctAnswer = question.correct_answer as string;
          } else if (question.type === 'fill_blank') {
            correctAnswer = formatCorrectAnswer(question.correct_answer);
          } else {
            correctAnswer = question.correct_answer as string;
          }

          return (
            <div
              key={answer.id}
              className={`card border-l-4 ${
                answer.is_correct ? 'border-l-success' : 'border-l-destructive'
              } p-5`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{index + 1}.</span>
                  <span className={`badge ${
                    answer.is_correct
                      ? 'bg-success/10 text-success'
                      : 'bg-destructive/10 text-destructive'
                  }`}>
                    {answer.is_correct ? '✓ 正确' : '✗ 错误'}
                  </span>
                  <span className="text-sm text-muted-foreground">+{answer.points_awarded || 0}分</span>
                </div>
                <span className="text-xs text-muted-foreground/80">
                  {question.type === 'single_choice' ? '单选题' :
                    question.type === 'multiple_choice' ? '多选题' :
                    question.type === 'true_false' ? '判断题' :
                    question.type === 'fill_blank' ? '填空题' : '简答题'}
                </span>
              </div>
              
              <p className="mb-3 leading-relaxed">{question.content}</p>
              
              <div className="space-y-1.5 text-sm bg-muted/30 rounded-lg p-3">
                <div className="flex gap-2">
                  <span className="font-medium text-muted-foreground flex-shrink-0">你的答案：</span>
                  <span className={answer.is_correct ? 'text-success' : 'text-destructive'}>
                    {userAnswer}
                  </span>
                </div>
                {!answer.is_correct && (
                  <div className="flex gap-2">
                    <span className="font-medium text-muted-foreground flex-shrink-0">正确答案：</span>
                    <span className="text-success">{correctAnswer}</span>
                  </div>
                )}
              </div>
              {question.explanation && (
                <div className="mt-3 p-3 bg-warning/5 border border-warning/20 rounded-lg text-sm text-foreground/80 flex gap-2">
                  <svg className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                  </svg>
                  <span><span className="font-medium">解析：</span>{question.explanation}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-4 pt-2">
        <a href="/dashboard" className="btn-outline">
          返回控制台
        </a>
        <a href={`/quiz/${attempt.quiz_id}/take`} className="btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          重新答题
        </a>
      </div>
    </div>
  );
}

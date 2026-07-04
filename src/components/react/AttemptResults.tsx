import React, { useState, useEffect } from 'react';
import type { QuizAttempt, Question, AttemptAnswer } from '../../types';

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

  useEffect(() => {
    loadAttempt();
  }, [attemptId]);

  const loadAttempt = async () => {
    try {
      const token = localStorage.getItem('supabase.auth.token');
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

  const getScorePercentage = (score: number, totalPoints: number): number => {
    return totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
  };

  const handleExportPDF = async () => {
    try {
      const token = localStorage.getItem('supabase.auth.token');
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
      alert('导出失败');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">加载中...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error || '加载失败'}</p>
        <a href="/dashboard" className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold mb-2">{attempt.quizzes.title} - 答题结果</h1>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">
            完成时间: {attempt.completed_at ? new Date(attempt.completed_at).toLocaleString('zh-CN') : '-'}
          </span>
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            导出 PDF
          </button>
        </div>
      </div>

      {/* Score Summary */}
      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
        <div className={`text-5xl font-bold mb-2 ${percentage >= 60 ? 'text-green-600' : 'text-red-600'}`}>
          {score}分
        </div>
        <div className="text-xl text-gray-600 mb-4">{percentage}%</div>
        <div className="flex justify-center gap-8">
          <div>
            <div className="text-2xl font-bold text-green-600">{correctCount}</div>
            <div className="text-gray-600">正确</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">{incorrectCount}</div>
            <div className="text-gray-600">错误</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-600">{formatTime(attempt.time_taken)}</div>
            <div className="text-gray-600">用时</div>
          </div>
        </div>
      </div>

      {/* Answers */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">答题详情</h2>
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
          } else {
            correctAnswer = question.correct_answer as string;
          }

          return (
            <div
              key={answer.id}
              className={`bg-white rounded-lg shadow-sm p-6 border-l-4 ${
                answer.is_correct ? 'border-green-500' : 'border-red-500'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{index + 1}.</span>
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      answer.is_correct
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {answer.is_correct ? '正确' : '错误'}
                  </span>
                  <span className="text-sm text-gray-500">+{answer.points_awarded || 0}分</span>
                </div>
                <span className="text-sm text-gray-500">
                  [{question.type === 'single_choice' ? '单选题' :
                    question.type === 'multiple_choice' ? '多选题' :
                    question.type === 'true_false' ? '判断题' :
                    question.type === 'fill_blank' ? '填空题' : '简答题'}]
                </span>
              </div>
              
              <p className="mb-3">{question.content}</p>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">你的答案：</span>
                  <span className={answer.is_correct ? 'text-green-600' : 'text-red-600'}>
                    {userAnswer}
                  </span>
                </div>
                {!answer.is_correct && (
                  <div>
                    <span className="font-medium">正确答案：</span>
                    <span className="text-green-600">{correctAnswer}</span>
                  </div>
                )}
                {question.explanation && (
                  <div className="mt-2 p-3 bg-gray-50 rounded">
                    <span className="font-medium">解析：</span>
                    {question.explanation}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex justify-center space-x-4">
        <a
          href="/dashboard"
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          返回控制台
        </a>
        <a
          href={`/quiz/${attempt.quiz_id}/take`}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          重新答题
        </a>
      </div>
    </div>
  );
}
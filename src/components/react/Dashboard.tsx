import React, { useState, useEffect } from 'react';
import type { Quiz, QuizAttempt } from '../../types';
import { getAccessToken } from '../../lib/auth-client';
import { ErrorRetry } from './ErrorRetry';

interface DashboardProps {
  userId: string;
}

export function Dashboard({ userId }: DashboardProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<(QuizAttempt & { quizzes: { title: string } })[]>([]);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    completedAttempts: 0,
    averageScore: 0,
    totalTime: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const accessToken = getAccessToken();
      if (!accessToken) {
        setError('请先登录');
        setLoading(false);
        return;
      }

      const headers = {
        'Authorization': `Bearer ${accessToken}`,
      };

      // Load quizzes
      let quizData: Quiz[] = [];
      const quizzesResponse = await fetch('/api/quizzes?limit=100', { headers });
      if (quizzesResponse.ok) {
        const data = await quizzesResponse.json();
        quizData = data.quizzes || [];
        setQuizzes(quizData);
      } else {
        console.error('[Dashboard] /api/quizzes error:', quizzesResponse.status);
      }

      // Load attempts
      const attemptsResponse = await fetch('/api/attempts/history?limit=10', { headers });
      if (attemptsResponse.ok) {
        const { attempts: attemptData } = await attemptsResponse.json();
        setAttempts(attemptData || []);

        // Calculate stats
        const completedAttempts = (attemptData || []).filter((a: any) => a.completed_at);
        const totalScore = completedAttempts.reduce((sum: number, a: any) => sum + (a.score || 0), 0);
        const totalPoints = completedAttempts.reduce((sum: number, a: any) => sum + a.total_points, 0);
        const totalTime = completedAttempts.reduce((sum: number, a: any) => sum + a.time_taken, 0);

        setStats({
          totalQuizzes: quizData?.length || 0,
          completedAttempts: completedAttempts.length,
          averageScore: totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) : 0,
          totalTime: Math.round(totalTime / 60), // Convert to minutes
        });
      } else {
        console.error('[Dashboard] /api/attempts error:', attemptsResponse.status);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('加载失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        {/* Stats skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-background border border-border rounded-lg shadow-sm p-6">
              <div className="h-8 w-16 bg-muted rounded animate-pulse mb-2" />
              <div className="h-4 w-20 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
        {/* Quiz cards skeleton */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="h-7 w-24 bg-muted rounded animate-pulse" />
            <div className="h-10 w-28 bg-muted rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-background border border-border rounded-lg shadow-sm p-6">
                <div className="h-6 w-3/4 bg-muted rounded animate-pulse mb-3" />
                <div className="h-4 w-full bg-muted rounded animate-pulse mb-4" />
                <div className="flex space-x-2">
                  <div className="h-9 flex-1 bg-muted rounded animate-pulse" />
                  <div className="h-9 flex-1 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorRetry message={error} onRetry={loadData} fullPage />;
  }

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-background border border-border rounded-lg shadow-sm p-6">
          <div className="text-2xl font-bold text-indigo-600">{stats.totalQuizzes}</div>
          <div className="text-muted-foreground">习题总数</div>
        </div>
        <div className="bg-background border border-border rounded-lg shadow-sm p-6">
          <div className="text-2xl font-bold text-green-600">{stats.completedAttempts}</div>
          <div className="text-muted-foreground">已完成</div>
        </div>
        <div className="bg-background border border-border rounded-lg shadow-sm p-6">
          <div className="text-2xl font-bold text-yellow-600">{stats.averageScore}%</div>
          <div className="text-muted-foreground">平均分数</div>
        </div>
        <div className="bg-background border border-border rounded-lg shadow-sm p-6">
          <div className="text-2xl font-bold text-purple-600">{stats.totalTime}分钟</div>
          <div className="text-muted-foreground">学习时长</div>
        </div>
      </div>

      {/* Quizzes */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">我的习题</h2>
          <a
            href="/quiz/create"
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-colors"
          >
            创建新习题
          </a>
        </div>

        {quizzes.length === 0 ? (
          <div className="bg-background border border-border rounded-lg shadow-sm p-8 text-center text-muted-foreground">
            还没有创建任何习题
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="bg-background border border-border rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-lg mb-2">{quiz.title}</h3>
                {quiz.description && (
                  <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{quiz.description}</p>
                )}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{formatDate(quiz.created_at)}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${quiz.is_published ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-muted text-foreground'}`}>
                    {quiz.is_published ? '已发布' : '草稿'}
                  </span>
                </div>
                <div className="mt-4 flex space-x-2">
                  <a
                    href={`/quiz/${quiz.id}`}
                    className="flex-1 text-center py-2 border border-border rounded-lg hover:bg-accent text-sm"
                  >
                    编辑
                  </a>
                  <a
                    href={`/quiz/${quiz.id}/flashcard`}
                    className="flex-1 text-center py-2 border border-teal-400 text-teal-600 rounded-lg hover:bg-teal-50 text-sm"
                  >
                    背题
                  </a>
                  <a
                    href={`/quiz/${quiz.id}/take`}
                    className="flex-1 text-center py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 text-sm"
                  >
                    开始答题
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Attempts */}
      <div>
        <h2 className="text-xl font-semibold mb-4">最近答题记录</h2>
        {attempts.length === 0 ? (
          <div className="bg-background border border-border rounded-lg shadow-sm p-8 text-center text-muted-foreground">
            还没有答题记录
          </div>
        ) : (
          <div className="bg-background border border-border rounded-lg shadow-sm overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">习题</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">分数</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">用时</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">日期</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {attempts.map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-accent">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a href={`/quiz/attempts/${attempt.id}`} className="text-indigo-600 hover:text-indigo-700">
                        {attempt.quizzes.title}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-medium ${attempt.score && attempt.score / attempt.total_points >= 0.6 ? 'text-green-600' : 'text-red-600'}`}>
                        {attempt.score || 0}/{attempt.total_points}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                      {formatTime(attempt.time_taken)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                      {attempt.completed_at ? formatDate(attempt.completed_at) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
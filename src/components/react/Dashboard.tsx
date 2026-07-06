import React, { useState, useEffect } from 'react';
import type { Quiz, QuizAttempt } from '../../types';
import { getAccessToken } from '../../lib/auth-client';
import { ErrorRetry } from './ErrorRetry';
import { ProgressStats } from './ProgressStats';

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

      let quizData: Quiz[] = [];
      const quizzesResponse = await fetch('/api/quizzes?limit=100', { headers });
      if (quizzesResponse.ok) {
        const data = await quizzesResponse.json();
        quizData = data.quizzes || [];
        setQuizzes(quizData);
      }

      const attemptsResponse = await fetch('/api/attempts/history?limit=10', { headers });
      if (attemptsResponse.ok) {
        const { attempts: attemptData } = await attemptsResponse.json();
        setAttempts(attemptData || []);

        const completedAttempts = (attemptData || []).filter((a: any) => a.completed_at);
        const totalScore = completedAttempts.reduce((sum: number, a: any) => sum + (a.score || 0), 0);
        const totalPoints = completedAttempts.reduce((sum: number, a: any) => sum + a.total_points, 0);
        const totalTime = completedAttempts.reduce((sum: number, a: any) => sum + a.time_taken, 0);

        setStats({
          totalQuizzes: quizData?.length || 0,
          completedAttempts: completedAttempts.length,
          averageScore: totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) : 0,
          totalTime: Math.round(totalTime / 60),
        });
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-6">
              <div className="h-8 w-16 skeleton rounded-lg mb-2" />
              <div className="h-4 w-20 skeleton rounded" />
            </div>
          ))}
        </div>
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="h-7 w-24 skeleton rounded-lg" />
            <div className="h-10 w-28 skeleton rounded-lg" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card p-6">
                <div className="h-6 w-3/4 skeleton rounded mb-3" />
                <div className="h-4 w-full skeleton rounded mb-4" />
                <div className="flex space-x-2">
                  <div className="h-9 flex-1 skeleton rounded-lg" />
                  <div className="h-9 flex-1 skeleton rounded-lg" />
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

  const statCards = [
    { label: '习题总数', value: stats.totalQuizzes, color: 'text-primary', bg: 'bg-primary-light', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
    )},
    { label: '已完成', value: stats.completedAttempts, color: 'text-success', bg: 'bg-success/10', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
    )},
    { label: '平均分数', value: `${stats.averageScore}%`, color: 'text-warning', bg: 'bg-warning/10', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>
    )},
    { label: '学习时长', value: `${stats.totalTime}分钟`, color: 'text-accent', bg: 'bg-accent/10', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
    )},
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="animate-slide-up">
        <h1 className="text-2xl font-bold tracking-tight">控制台</h1>
        <p className="text-muted-foreground text-sm mt-1">管理你的习题集并查看学习进度</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="card p-5 animate-slide-up" style={{animationDelay: `${i * 0.05}s`}}>
            <div className={`w-10 h-10 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center mb-3`}>
              {stat.icon}
            </div>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-muted-foreground text-sm">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <a href="/quizzes" className="card flex items-center gap-2.5 px-4 py-3 hover:border-primary/30 transition-colors group">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-medium">我的习题</div>
            <div className="text-xs text-muted-foreground">管理所有习题</div>
          </div>
        </a>
        <a href="/wrong-answers" className="card flex items-center gap-2.5 px-4 py-3 hover:border-primary/30 transition-colors group">
          <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-medium">错题集</div>
            <div className="text-xs text-muted-foreground">查看答错的题目</div>
          </div>
        </a>
        <a href="/progress" className="card flex items-center gap-2.5 px-4 py-3 hover:border-primary/30 transition-colors">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-medium">学习进度</div>
            <div className="text-xs text-muted-foreground">查看进度和趋势</div>
          </div>
        </a>
        <a href="/history" className="card flex items-center gap-2.5 px-4 py-3 hover:border-primary/30 transition-colors">
          <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-medium">答题历史</div>
            <div className="text-xs text-muted-foreground">查看所有答题记录</div>
          </div>
        </a>
      </div>
      <ProgressStats />

      {/* Quizzes Overview */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">我的习题</h2>
          <a href="/quizzes" className="text-sm text-primary hover:text-primary-hover transition-colors">
            查看全部 →
          </a>
        </div>

        {quizzes.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-muted-foreground mb-3">还没有创建任何习题</p>
            <a href="/quiz/create" className="btn-primary text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              创建第一套习题
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes.slice(0, 3).map((quiz) => (
              <div key={quiz.id} className="card card-hover p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-sm leading-tight flex-1 min-w-0">{quiz.title}</h3>
                  <span className={`badge flex-shrink-0 ml-2 text-xs ${quiz.is_published ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                    {quiz.is_published ? '已发布' : '草稿'}
                  </span>
                </div>
                {quiz.description && (
                  <p className="text-muted-foreground text-xs mb-3 line-clamp-1">{quiz.description}</p>
                )}
                <div className="flex gap-1.5">
                  <a href={`/quiz/${quiz.id}/take`} className="flex-1 text-xs py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary-hover font-medium text-center transition-colors">
                    答题
                  </a>
                  <a href={`/quiz/${quiz.id}/flashcard`} className="flex-1 text-xs py-1.5 border border-accent/30 text-accent rounded-md hover:bg-accent/10 font-medium text-center transition-colors">
                    背题
                  </a>
                  <a href={`/quiz/${quiz.id}`} className="flex-1 text-xs py-1.5 border border-border rounded-md hover:bg-muted text-muted-foreground font-medium text-center transition-colors">
                    编辑
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Attempts */}
      <div>
        <h2 className="text-lg font-semibold mb-4">最近答题记录</h2>
        {attempts.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <p className="text-muted-foreground mb-1">还没有答题记录</p>
            <p className="text-muted-foreground/60 text-sm">完成一次答题后这里会显示记录</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">习题</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">分数</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">用时</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">日期</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {attempts.map((attempt) => {
                    const passRate = attempt.score && attempt.total_points ? attempt.score / attempt.total_points : 0;
                    return (
                      <tr key={attempt.id} className="hover:bg-accent/5 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <a href={`/quiz/attempts/${attempt.id}`} className="text-primary hover:text-primary-hover font-medium transition-colors">
                            {attempt.quizzes.title}
                          </a>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`font-semibold ${passRate >= 0.6 ? 'text-success' : 'text-destructive'}`}>
                            {attempt.score || 0}/{attempt.total_points}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-muted-foreground text-sm">
                          {formatTime(attempt.time_taken)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-muted-foreground text-sm">
                          {attempt.completed_at ? formatDate(attempt.completed_at) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

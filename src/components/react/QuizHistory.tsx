import React, { useState, useEffect } from 'react';
import type { QuizAttempt } from '../../types';
import { getAccessToken } from '../../lib/auth-client';
import { ErrorRetry } from './ErrorRetry';

interface QuizHistoryProps {
  userId: string;
}

export function QuizHistory({ userId }: QuizHistoryProps) {
  const [attempts, setAttempts] = useState<(QuizAttempt & { quizzes: { title: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const limit = 10;

  useEffect(() => {
    loadAttempts();
  }, [page]);

  const loadAttempts = async () => {
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        setError('请先登录');
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/attempts/history?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const { attempts: data, total: totalCount } = await response.json();
        setAttempts(data || []);
        setTotal(totalCount || 0);
      } else if (response.status === 401) {
        setError('登录已过期，请重新登录');
      } else {
        setError('加载失败');
      }
    } catch (err) {
      console.error('Error loading attempts:', err);
      setError('网络错误，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (attemptId: string) => {
    if (!confirm('确定删除这条答题记录吗？此操作不可撤销。')) return;

    setDeletingId(attemptId);
    try {
      const token = getAccessToken();
      if (!token) return;

      const response = await fetch(`/api/attempts/${attemptId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'delete' }),
      });

      if (response.ok) {
        setAttempts(prev => prev.filter(a => a.id !== attemptId));
        setTotal(prev => prev - 1);
      } else {
        alert('删除失败，请重试');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('网络错误，删除失败');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };

  const getScorePercentage = (score: number, totalPoints: number): number => {
    return totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
  };

  const getScoreColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-success';
    if (percentage >= 70) return 'text-primary';
    if (percentage >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreBarBg = (percentage: number): string => {
    if (percentage >= 90) return 'bg-success';
    if (percentage >= 70) return 'bg-primary';
    if (percentage >= 60) return 'bg-warning';
    return 'bg-destructive';
  };

  const totalPages = Math.ceil(total / limit);

  if (loading) {
    return (
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold mb-6">
          <div className="h-8 w-24 bg-muted rounded animate-pulse" />
        </h1>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">答题历史</h1>
        <ErrorRetry
          message={error}
          onRetry={() => { setLoading(true); loadAttempts(); }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">答题历史</h1>
        <a href="/progress" className="btn-outline text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
          </svg>
          学习进度
        </a>
      </div>

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
        <>
          {/* Desktop: table */}
          <div className="hidden sm:block card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">习题</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">分数</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">正确率</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">用时</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">完成时间</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {attempts.map((attempt) => {
                    const percentage = getScorePercentage(attempt.score || 0, attempt.total_points);
                    const scoreColor = getScoreColor(percentage);

                    return (
                      <tr key={attempt.id} className="hover:bg-accent/5 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <a href={`/quiz/attempts/${attempt.id}`} className="text-primary hover:text-primary-hover font-medium transition-colors">
                            {attempt.quizzes.title}
                          </a>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`font-semibold ${scoreColor}`}>
                            {attempt.score || 0}/{attempt.total_points}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-muted rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-2 rounded-full ${getScoreBarBg(percentage)}`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className={`text-sm font-medium ${scoreColor}`}>{percentage}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-muted-foreground text-sm">
                          {formatTime(attempt.time_taken)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-muted-foreground text-sm">
                          {attempt.completed_at ? formatDate(attempt.completed_at) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <a
                              href={`/quiz/attempts/${attempt.id}`}
                              className="text-primary hover:text-primary-hover text-sm transition-colors"
                            >
                              查看详情
                            </a>
                            <button
                              onClick={() => handleDelete(attempt.id)}
                              disabled={deletingId === attempt.id}
                              className="text-destructive hover:text-destructive/80 text-sm transition-colors disabled:opacity-40"
                            >
                              {deletingId === attempt.id ? '删除中...' : '删除'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile: cards */}
          <div className="sm:hidden space-y-3">
            {attempts.map((attempt) => {
              const percentage = getScorePercentage(attempt.score || 0, attempt.total_points);
              const scoreColor = getScoreColor(percentage);

              return (
                <div key={attempt.id} className="card p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <a
                      href={`/quiz/attempts/${attempt.id}`}
                      className="text-primary hover:text-primary-hover font-medium text-sm leading-tight flex-1 min-w-0"
                    >
                      {attempt.quizzes.title}
                    </a>
                    <button
                      onClick={() => handleDelete(attempt.id)}
                      disabled={deletingId === attempt.id}
                      className="text-destructive hover:text-destructive/80 text-xs flex-shrink-0 disabled:opacity-40"
                    >
                      {deletingId === attempt.id ? '删除中...' : '删除'}
                    </button>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`font-semibold text-lg ${scoreColor}`}>
                      {attempt.score || 0}/{attempt.total_points}
                    </span>
                    <span className={`text-sm font-medium ${scoreColor}`}>{percentage}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden mb-2">
                    <div
                      className={`h-1.5 rounded-full ${getScoreBarBg(percentage)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{formatTime(attempt.time_taken)}</span>
                    <span>·</span>
                    <span>{attempt.completed_at ? formatDate(attempt.completed_at) : '-'}</span>
                    <a
                      href={`/quiz/attempts/${attempt.id}`}
                      className="ml-auto text-primary font-medium"
                    >
                      详情 →
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="btn-outline disabled:opacity-40 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              <span className="text-muted-foreground text-sm">
                第 {page} / {totalPages} 页
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="btn-outline disabled:opacity-40 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

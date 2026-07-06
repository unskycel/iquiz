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

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
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
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const totalPages = Math.ceil(total / limit);

  if (loading) {
    return (
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold mb-6">
          <div className="h-8 w-24 bg-muted rounded animate-pulse" />
        </h1>
        <div className="bg-background border border-border rounded-lg shadow-sm p-8">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
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
      <h1 className="text-2xl font-bold">答题历史</h1>

      {attempts.length === 0 ? (
        <div className="bg-background border border-border rounded-lg shadow-sm p-8 text-center text-muted-foreground">
          还没有答题记录
        </div>
      ) : (
        <>
          <div className="bg-background border border-border rounded-lg shadow-sm overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">习题</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">分数</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">正确率</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">用时</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">完成时间</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {attempts.map((attempt) => {
                  const percentage = getScorePercentage(attempt.score || 0, attempt.total_points);
                  const scoreColor = getScoreColor(percentage);

                  return (
                    <tr key={attempt.id} className="hover:bg-accent">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-foreground">{attempt.quizzes.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`font-medium ${scoreColor}`}>
                          {attempt.score || 0}/{attempt.total_points}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-muted rounded-full h-2 mr-2">
                            <div
                              className={`h-2 rounded-full ${
                                percentage >= 60 ? 'bg-green-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className={`text-sm ${scoreColor}`}>{percentage}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {formatTime(attempt.time_taken)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {attempt.completed_at ? formatDate(attempt.completed_at) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a
                          href={`/quiz/attempts/${attempt.id}`}
                          className="text-primary hover:opacity-80 text-sm"
                        >
                          查看详情
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center space-x-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-border rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              <span className="px-4 py-2 text-muted-foreground">
                第 {page} / {totalPages} 页
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-border rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
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
import React, { useState, useEffect } from 'react';
import { getAccessToken } from '../../lib/auth-client';

interface ProgressStatsData {
  overview: {
    totalAttempts: number;
    totalQuizzes: number;
    overallAvg: number;
    totalTime: number;
    streak: number;
    weekCount: number;
    monthCount: number;
  };
  recentAttempts: Array<{
    percentage: number;
    completedAt: string;
    quizTitle: string;
    quizId: string;
  }>;
  quizProgress: Array<{
    quizId: string;
    title: string;
    attempts: number;
    bestPercentage: number;
    avgPercentage: number;
    lastAttemptAt: string;
  }>;
}

export function ProgressStats() {
  const [data, setData] = useState<ProgressStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const token = getAccessToken();
      if (!token) { setLoading(false); return; }

      const response = await fetch('/api/stats/progress', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (err) {
      console.error('ProgressStats load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card p-6">
        <div className="h-6 w-32 skeleton rounded mb-4" />
        <div className="h-32 skeleton rounded-lg" />
      </div>
    );
  }

  if (!data || data.overview.totalAttempts === 0) return null;

  const { overview, recentAttempts, quizProgress } = data;

  // 趋势图
  const chartHeight = 100;
  const pointSpacing = recentAttempts.length > 1 ? 100 / (recentAttempts.length - 1) : 0;

  const trendPath = recentAttempts.length > 0
    ? recentAttempts.map((a, i) => {
        const x = i * pointSpacing;
        const y = chartHeight - (a.percentage / 100) * chartHeight;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
      }).join(' ')
    : '';

  const trendArea = trendPath
    ? `${trendPath} L 100 ${chartHeight} L 0 ${chartHeight} Z`
    : '';

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  const getMasteryColor = (p: number): string => {
    if (p >= 90) return 'text-success';
    if (p >= 70) return 'text-primary';
    if (p >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getMasteryBg = (p: number): string => {
    if (p >= 90) return 'bg-success';
    if (p >= 70) return 'bg-primary';
    if (p >= 60) return 'bg-warning';
    return 'bg-destructive';
  };

  return (
    <div className="space-y-4">
      {/* 趋势图 + 快捷统计 */}
      <div className="card p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">学习进度</h2>
          <a href="/progress" className="text-sm text-primary hover:text-primary-hover transition-colors">
            查看全部 →
          </a>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* 分数趋势图 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">分数趋势</span>
              <span className="text-xs text-muted-foreground">{overview.totalAttempts} 次答题</span>
            </div>
            <div className="relative">
              <svg viewBox={`0 0 100 ${chartHeight}`} className="w-full h-24" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="dashTrendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* 60% pass line */}
                <line x1="0" y1={chartHeight - 60} x2="100" y2={chartHeight - 60}
                  stroke="hsl(var(--success))" strokeWidth="0.3" strokeDasharray="2 2" opacity="0.4" />
                {trendArea && <path d={trendArea} fill="url(#dashTrendGrad)" />}
                {trendPath && <path d={trendPath} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />}
                {recentAttempts.map((a, i) => {
                  const x = i * pointSpacing;
                  const y = chartHeight - (a.percentage / 100) * chartHeight;
                  return <circle key={i} cx={x} cy={y} r="1" fill="hsl(var(--primary))" />;
                })}
              </svg>
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                {recentAttempts.length > 0 && <span>{formatDate(recentAttempts[0].completedAt)}</span>}
                {recentAttempts.length > 1 && <span>{formatDate(recentAttempts[recentAttempts.length - 1].completedAt)}</span>}
              </div>
            </div>
          </div>

          {/* 快捷统计 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-primary-light/50 rounded-lg p-3">
              <div className="text-2xl font-bold text-primary">{overview.streak}</div>
              <div className="text-xs text-muted-foreground">连续学习天数</div>
            </div>
            <div className="bg-accent/5 rounded-lg p-3">
              <div className="text-2xl font-bold text-accent">{overview.weekCount}</div>
              <div className="text-xs text-muted-foreground">本周答题次数</div>
            </div>
            <div className="bg-success/5 rounded-lg p-3">
              <div className="text-2xl font-bold text-success">{overview.overallAvg}%</div>
              <div className="text-xs text-muted-foreground">平均正确率</div>
            </div>
            <div className="bg-warning/5 rounded-lg p-3">
              <div className="text-2xl font-bold text-warning">{overview.totalQuizzes}</div>
              <div className="text-xs text-muted-foreground">已练习习题数</div>
            </div>
          </div>
        </div>
      </div>

      {/* 习题掌握进度（前 3 个） */}
      {quizProgress.length > 0 && (
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">习题掌握度</h2>
            <span className="text-sm text-muted-foreground">{quizProgress.length} 套习题</span>
          </div>
          <div className="space-y-3">
            {quizProgress.slice(0, 3).map(qp => (
              <div key={qp.quizId} className="flex items-center gap-4">
                <a href={`/quiz/${qp.quizId}/take`} className="text-sm font-medium hover:text-primary transition-colors flex-1 truncate">
                  {qp.title}
                </a>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-muted-foreground">{qp.attempts} 次</span>
                  <div className="w-24 bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getMasteryBg(qp.bestPercentage)}`}
                      style={{ width: `${Math.round(qp.bestPercentage)}%` }}
                    />
                  </div>
                  <span className={`text-sm font-semibold w-12 text-right ${getMasteryColor(qp.bestPercentage)}`}>
                    {Math.round(qp.bestPercentage)}%
                  </span>
                </div>
              </div>
            ))}
            {quizProgress.length > 3 && (
              <a href="/progress" className="block text-center text-sm text-primary hover:text-primary-hover transition-colors pt-2">
                查看全部 {quizProgress.length} 套习题 →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

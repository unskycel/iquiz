import React, { useState, useEffect } from 'react';
import { getAccessToken } from '../../lib/auth-client';
import { ErrorRetry } from './ErrorRetry';

interface ProgressData {
  overview: {
    totalAttempts: number;
    totalQuizzes: number;
    overallAvg: number;
    totalTime: number;
    streak: number;
    weekCount: number;
    monthCount: number;
    weekAvgTime: number;
  };
  quizProgress: Array<{
    quizId: string;
    title: string;
    attempts: number;
    bestScore: number;
    bestPercentage: number;
    avgPercentage: number;
    lastAttemptAt: string;
    totalTime: number;
  }>;
  recentAttempts: Array<{
    score: number;
    totalPoints: number;
    percentage: number;
    completedAt: string;
    quizTitle: string;
    quizId: string;
  }>;
  masteryByType: Array<{
    type: string;
    typeLabel: string;
    total: number;
    correct: number;
    accuracy: number;
  }>;
}

interface ProgressOverviewProps {
  userId?: string;
}

export function ProgressOverview({}: ProgressOverviewProps) {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        setError('请先登录');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/stats/progress', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('加载失败');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  const getMasteryColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-success';
    if (percentage >= 70) return 'text-primary';
    if (percentage >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getMasteryBg = (percentage: number): string => {
    if (percentage >= 90) return 'bg-success';
    if (percentage >= 70) return 'bg-primary';
    if (percentage >= 60) return 'bg-warning';
    return 'bg-destructive';
  };

  const getMasteryLabel = (percentage: number): string => {
    if (percentage >= 90) return '精通';
    if (percentage >= 70) return '熟练';
    if (percentage >= 60) return '及格';
    return '需练习';
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5">
              <div className="h-8 w-16 skeleton rounded-lg mb-2" />
              <div className="h-4 w-20 skeleton rounded" />
            </div>
          ))}
        </div>
        <div className="card p-6">
          <div className="h-6 w-32 skeleton rounded mb-4" />
          <div className="h-48 skeleton rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return <ErrorRetry message={error || '加载失败'} onRetry={loadProgress} fullPage />;
  }

  const { overview, quizProgress, recentAttempts, masteryByType } = data;

  // 趋势图 SVG 计算
  const maxPoints = Math.max(...recentAttempts.map(a => a.percentage), 100);
  const chartWidth = 100; // percentage-based
  const chartHeight = 120;
  const pointSpacing = recentAttempts.length > 1 ? chartWidth / (recentAttempts.length - 1) : 0;

  const trendPath = recentAttempts.length > 0
    ? recentAttempts.map((a, i) => {
        const x = i * pointSpacing;
        const y = chartHeight - (a.percentage / maxPoints) * chartHeight;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
      }).join(' ')
    : '';

  const trendArea = trendPath
    ? `${trendPath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`
    : '';

  const statCards = [
    { label: '连续学习', value: `${overview.streak} 天`, color: 'text-primary', bg: 'bg-primary-light', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" /></svg>
    )},
    { label: '本周答题', value: `${overview.weekCount} 次`, color: 'text-accent', bg: 'bg-accent/10', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.483 0-.967.048-1.376.139M8.25 8.25 9 9m6.75-2.25h1.5a2.25 2.25 0 0 1 0 4.5h-1.5" /></svg>
    )},
    { label: '平均正确率', value: `${overview.overallAvg}%`, color: 'text-success', bg: 'bg-success/10', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>
    )},
    { label: '累计学习', value: `${overview.totalTime} 分钟`, color: 'text-warning', bg: 'bg-warning/10', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
    )},
  ];

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

      {/* 分数趋势图 */}
      {recentAttempts.length > 0 && (
        <div className="card p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-semibold">分数趋势</h2>
            <span className="text-sm text-muted-foreground">最近 {recentAttempts.length} 次答题</span>
          </div>
          <div className="relative">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-32" preserveAspectRatio="none">
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map(y => {
                const yPos = chartHeight - (y / 100) * chartHeight;
                return (
                  <line key={y} x1="0" y1={yPos} x2={chartWidth} y2={yPos}
                    stroke="hsl(var(--border))" strokeWidth="0.3" strokeDasharray="1 2" />
                );
              })}
              {/* Area */}
              {trendArea && <path d={trendArea} fill="url(#trendGradient)" />}
              {/* Line */}
              {trendPath && <path d={trendPath} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
              {/* 60% pass line */}
              <line x1="0" y1={chartHeight - (60 / 100) * chartHeight} x2={chartWidth} y2={chartHeight - (60 / 100) * chartHeight}
                stroke="hsl(var(--success))" strokeWidth="0.4" strokeDasharray="2 2" opacity="0.5" />
              {/* Points */}
              {recentAttempts.map((a, i) => {
                const x = i * pointSpacing;
                const y = chartHeight - (a.percentage / maxPoints) * chartHeight;
                return (
                  <circle key={i} cx={x} cy={y} r="1.2" fill="hsl(var(--primary))" />
                );
              })}
            </svg>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              {recentAttempts.length > 0 && <span>{formatDate(recentAttempts[0].completedAt)}</span>}
              {recentAttempts.length > 1 && <span>{formatDate(recentAttempts[recentAttempts.length - 1].completedAt)}</span>}
            </div>
          </div>
        </div>
      )}

      {/* 掌握度分析 */}
      {masteryByType.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">题型掌握度</h2>
          <div className="space-y-4">
            {masteryByType.map(item => (
              <div key={item.type}>
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{item.typeLabel}</span>
                    <span className="text-xs text-muted-foreground">{item.correct}/{item.total} 题</span>
                  </div>
                  <span className={`text-sm font-semibold ${getMasteryColor(item.accuracy)}`}>{item.accuracy}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getMasteryBg(item.accuracy)}`}
                    style={{ width: `${item.accuracy}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 习题维度进度 */}
      {quizProgress.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">习题掌握进度</h2>
          <div className="space-y-4">
            {quizProgress.map(qp => (
              <div key={qp.quizId} className="border border-border rounded-lg p-4 hover:border-primary/30 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <a href={`/quiz/attempts/${qp.quizId}`} className="font-medium hover:text-primary transition-colors">
                    {qp.title}
                  </a>
                  <span className={`badge ${getMasteryBg(qp.bestPercentage)}/10 ${getMasteryColor(qp.bestPercentage)}`}>
                    {getMasteryLabel(qp.bestPercentage)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">答题 </span>
                    <span className="font-medium">{qp.attempts} 次</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">最高 </span>
                    <span className={`font-medium ${getMasteryColor(qp.bestPercentage)}`}>{Math.round(qp.bestPercentage)}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">平均 </span>
                    <span className="font-medium">{Math.round(qp.avgPercentage)}%</span>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getMasteryBg(qp.bestPercentage)}`}
                    style={{ width: `${Math.round(qp.bestPercentage)}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground/70 mt-2">
                  最后答题: {formatDate(qp.lastAttemptAt)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {overview.totalAttempts === 0 && (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
            </svg>
          </div>
          <p className="text-muted-foreground mb-1">还没有答题记录</p>
          <p className="text-muted-foreground/60 text-sm">完成答题后这里会展示你的学习进度</p>
        </div>
      )}
    </div>
  );
}

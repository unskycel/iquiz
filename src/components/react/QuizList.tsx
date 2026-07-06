import React, { useState, useEffect } from 'react';
import type { Quiz } from '../../types';
import { getAccessToken } from '../../lib/auth-client';
import { ErrorRetry } from './ErrorRetry';

interface QuizListProps {
  userId: string;
}

export function QuizList({ userId }: QuizListProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        setError('请先登录');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/quizzes?limit=200', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setQuizzes(data.quizzes || []);
      } else if (response.status === 401) {
        setError('登录已过期，请重新登录');
      } else {
        setError('加载失败');
      }
    } catch (err) {
      console.error('Error loading quizzes:', err);
      setError('网络错误，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    });
  };

  const filtered = quizzes.filter(q => {
    if (filter === 'published' && !q.is_published) return false;
    if (filter === 'draft' && q.is_published) return false;
    if (search && !q.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold mb-6">
          <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">我的习题</h1>
        <ErrorRetry message={error} onRetry={() => { setLoading(true); loadQuizzes(); }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">我的习题</h1>
          <p className="text-muted-foreground text-sm mt-1">
            共 <span className="font-medium text-foreground">{quizzes.length}</span> 套习题
          </p>
        </div>
        <a href="/quiz/create" className="btn-primary text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          创建新习题
        </a>
      </div>

      {quizzes.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z" />
            </svg>
          </div>
          <p className="text-muted-foreground mb-2">还没有创建任何习题</p>
          <p className="text-muted-foreground/60 text-sm">点击上方按钮创建你的第一套习题</p>
        </div>
      ) : (
        <>
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="text"
                placeholder="搜索习题..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="flex gap-1.5">
              {(['all', 'published', 'draft'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    filter === f
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/70'
                  }`}
                >
                  {f === 'all' ? '全部' : f === 'published' ? '已发布' : '草稿'}
                </button>
              ))}
            </div>
          </div>

          {/* Quiz cards */}
          {filtered.length === 0 ? (
            <div className="card p-8 text-center text-muted-foreground text-sm">
              没有匹配的习题
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filtered.map((quiz, i) => (
                <div key={quiz.id} className="card card-hover p-5 animate-slide-up" style={{animationDelay: `${i * 0.04}s`}}>
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-base leading-tight">{quiz.title}</h3>
                    <span className={`badge flex-shrink-0 ml-2 ${quiz.is_published ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                      {quiz.is_published ? '已发布' : '草稿'}
                    </span>
                  </div>
                  {quiz.description && (
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2 leading-relaxed">{quiz.description}</p>
                  )}
                  <div className="text-xs text-muted-foreground/80 mb-4">
                    {formatDate(quiz.created_at)}
                  </div>
                  <div className="flex gap-2">
                    <a href={`/quiz/${quiz.id}`} className="btn-outline flex-1 text-sm py-2">
                      编辑
                    </a>
                    <a href={`/quiz/${quiz.id}/flashcard`} className="flex-1 text-sm py-2 border border-accent/30 text-accent rounded-lg hover:bg-accent/10 font-medium transition-all inline-flex items-center justify-center gap-1.5">
                      背题
                    </a>
                    <a href={`/quiz/${quiz.id}/take`} className="flex-1 text-sm py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover font-medium transition-all inline-flex items-center justify-center gap-1.5">
                      答题
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

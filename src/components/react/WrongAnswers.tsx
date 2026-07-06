import React, { useState, useEffect } from 'react';
import { getAccessToken } from '../../lib/auth-client';
import { formatCorrectAnswer } from '../../lib/format';
import { ErrorRetry } from './ErrorRetry';

interface WrongAnswer {
  id: string;
  user_answer: string | string[];
  is_correct: boolean;
  points_awarded: number;
  created_at: string;
  question: {
    id: string;
    type: string;
    content: string;
    correct_answer: any;
    points: number;
    explanation: string | null;
    question_options: any[];
    quiz: {
      id: string;
      title: string;
    };
  };
  attempt: {
    id: string;
    completed_at: string;
  };
}

interface QuizSummaryItem {
  quizId: string;
  quizTitle: string;
  wrongCount: number;
}

export function WrongAnswers() {
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);
  const [quizSummary, setQuizSummary] = useState<QuizSummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [filterQuizId, setFilterQuizId] = useState<string | null>(null);

  useEffect(() => {
    loadWrongAnswers();
  }, [filterQuizId]);

  const loadWrongAnswers = async () => {
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        setError('请先登录');
        setLoading(false);
        return;
      }

      const url = filterQuizId
        ? `/api/wrong-answers?quizId=${filterQuizId}&limit=100`
        : `/api/wrong-answers?limit=100`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setWrongAnswers(data.wrongAnswers || []);
        setQuizSummary(data.quizSummary || []);
      } else if (response.status === 401) {
        setError('登录已过期，请重新登录');
      } else {
        setError('加载失败');
      }
    } catch (err) {
      console.error('Error loading wrong answers:', err);
      setError('网络错误，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    });
  };

  const typeLabels: Record<string, { label: string; color: string }> = {
    single_choice: { label: '单选题', color: 'bg-primary-light text-primary' },
    multiple_choice: { label: '多选题', color: 'bg-accent/10 text-accent' },
    true_false: { label: '判断题', color: 'bg-warning/10 text-warning' },
    fill_blank: { label: '填空题', color: 'bg-success/10 text-success' },
    short_answer: { label: '简答题', color: 'bg-destructive/10 text-destructive' },
  };

  const formatUserAnswer = (answer: string | string[], type: string): string => {
    if (type === 'true_false') {
      const v = String(answer);
      if (v === 'true') return '正确';
      if (v === 'false') return '错误';
      return v;
    }
    if (Array.isArray(answer)) return answer.join(', ');
    return String(answer || '(未作答)');
  };

  const formatCorrectDisplay = (answer: any, type: string): string => {
    if (type === 'true_false') {
      const v = String(answer);
      if (v === 'true') return '正确';
      if (v === 'false') return '错误';
      return v;
    }
    return formatCorrectAnswer(answer);
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold mb-6">
          <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        </h1>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">错题集</h1>
        <ErrorRetry message={error} onRetry={() => { setLoading(true); loadWrongAnswers(); }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">错题集</h1>
          <p className="text-muted-foreground text-sm mt-1">
            共 <span className="font-medium text-foreground">{wrongAnswers.length}</span> 道错题
          </p>
        </div>
      </div>

      {wrongAnswers.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <p className="text-muted-foreground mb-1">还没有错题</p>
          <p className="text-muted-foreground/60 text-sm">答题中答错的题目会自动收集到这里</p>
        </div>
      ) : (
        <>
          {/* Quiz filter chips */}
          {quizSummary.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterQuizId(null)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  !filterQuizId
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/70'
                }`}
              >
                全部 ({wrongAnswers.length})
              </button>
              {quizSummary.map(qs => (
                <button
                  key={qs.quizId}
                  onClick={() => setFilterQuizId(qs.quizId)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterQuizId === qs.quizId
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/70'
                  }`}
                >
                  {qs.quizTitle} ({qs.wrongCount})
                </button>
              ))}
            </div>
          )}

          {/* Wrong answer list */}
          <div className="space-y-3">
            {wrongAnswers.map((wa, index) => {
              const isExpanded = expandedIds.has(wa.id);
              const typeInfo = typeLabels[wa.question.type] || { label: wa.question.type, color: 'bg-muted text-muted-foreground' };

              return (
                <div
                  key={wa.id}
                  className="card border-l-4 border-l-destructive overflow-hidden"
                >
                  <button
                    onClick={() => toggleExpand(wa.id)}
                    className="w-full p-5 text-left flex items-start gap-3 hover:bg-accent/5 transition-colors"
                  >
                    <span className="font-medium text-muted-foreground flex-shrink-0 mt-0.5">{index + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`badge ${typeInfo.color}`}>{typeInfo.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {wa.question.quiz.title}
                        </span>
                        <span className="text-xs text-muted-foreground/60">
                          · {formatDate(wa.created_at)}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed line-clamp-2">
                        {wa.question.content}
                      </p>
                    </div>
                    <svg
                      className={`w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 animate-fade-in">
                      <div className="space-y-3 pt-2 border-t border-border/50">
                        {/* Question content full */}
                        <p className="text-sm leading-relaxed pt-2">{wa.question.content}</p>

                        {/* Options for choice questions */}
                        {wa.question.question_options && wa.question.question_options.length > 0 && (
                          <div className="space-y-1.5">
                            {wa.question.question_options.map((opt: any, idx: number) => {
                              const isCorrectOpt = wa.question.type === 'true_false'
                                ? (opt.content === '正确' && String(wa.question.correct_answer) === 'true') ||
                                  (opt.content === '错误' && String(wa.question.correct_answer) === 'false')
                                : opt.is_correct;
                              return (
                                <div
                                  key={opt.id || idx}
                                  className={`flex items-center gap-2 p-2.5 rounded-lg text-sm ${
                                    isCorrectOpt
                                      ? 'bg-success/10 text-success border border-success/20'
                                      : 'bg-muted/30 text-muted-foreground'
                                  }`}
                                >
                                  <span className="w-5 h-5 flex items-center justify-center rounded text-xs font-semibold flex-shrink-0">
                                    {wa.question.type === 'true_false'
                                      ? (opt.content === '正确' ? '✓' : '✗')
                                      : String.fromCharCode(65 + idx)}
                                  </span>
                                  <span>{opt.content}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Answers */}
                        <div className="space-y-2 text-sm bg-muted/30 rounded-lg p-3">
                          <div className="flex gap-2">
                            <span className="font-medium text-muted-foreground flex-shrink-0">你的答案：</span>
                            <span className="text-destructive font-medium">
                              {formatUserAnswer(wa.user_answer, wa.question.type)}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <span className="font-medium text-muted-foreground flex-shrink-0">正确答案：</span>
                            <span className="text-success font-medium">
                              {formatCorrectDisplay(wa.question.correct_answer, wa.question.type)}
                            </span>
                          </div>
                        </div>

                        {/* Explanation */}
                        {wa.question.explanation && (
                          <div className="p-3 bg-warning/5 border border-warning/20 rounded-lg text-sm">
                            <span className="font-medium">解析：</span>
                            <span className="text-muted-foreground">{wa.question.explanation}</span>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-1">
                          <a
                            href={`/quiz/${wa.question.quiz.id}/take`}
                            className="btn-outline text-sm"
                          >
                            重做这套习题
                          </a>
                          <a
                            href={`/quiz/${wa.question.quiz.id}/flashcard`}
                            className="btn-outline text-sm"
                          >
                            背题模式
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import type { Question, QuizAttempt } from '../../types';
import { getAccessToken, authHeaders } from '../../lib/auth-client';

interface QuizRunnerProps {
  quizId?: string;
  quiz?: {
    id: string;
    title: string;
    description?: string;
  };
  questions?: Question[];
  onComplete: (attempt: QuizAttempt, answers: Map<string, string | string[]>) => void;
  onCancel: () => void;
}

export function QuizRunner({ quizId, quiz: initialQuiz, questions: initialQuestions, onComplete, onCancel }: QuizRunnerProps) {
  const [quiz, setQuiz] = useState(initialQuiz);
  const [questions, setQuestions] = useState<Question[]>(initialQuestions || []);
  const [loading, setLoading] = useState(!initialQuiz || !initialQuestions);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string | string[]>>(new Map());
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (quizId && !initialQuiz) {
      loadQuiz();
    }
  }, [quizId]);

  useEffect(() => {
    if (loading || error || !quiz || questions.length === 0) return;
    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, error, quiz, questions.length]);

  const loadQuiz = async () => {
    try {
      const token = getAccessToken();
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/quizzes/${quizId}`, { headers });
      if (!response.ok) {
        throw new Error('Failed to load quiz');
      }

      const { quiz: quizData, questions: questionsData } = await response.json();
      setQuiz(quizData);
      setQuestions(questionsData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quiz');
    } finally {
      setLoading(false);
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

  if (error || !quiz) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
        </div>
        <p className="text-destructive mb-4">{error || '习题不存在'}</p>
        <button
          onClick={() => {
            if (typeof onCancel === 'function') onCancel();
            else window.location.href = '/dashboard';
          }}
          className="btn-primary"
        >
          返回
        </button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z" />
          </svg>
        </div>
        <p className="text-muted-foreground mb-4">该习题还没有题目</p>
        <button
          onClick={() => {
            if (typeof onCancel === 'function') onCancel();
            else window.location.href = '/dashboard';
          }}
          className="btn-primary"
        >
          返回
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const handleAnswerChange = (answer: string | string[]) => {
    setAnswers((prev) => new Map(prev).set(currentQuestion.id, answer));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!confirm('确定要提交吗？')) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch('/api/attempts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({ quizId: quiz.id }),
      });
      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`创建答题记录失败 (${response.status}): ${errBody}`);
      }
      const { attempt } = await response.json();

      for (const [questionId, answer] of answers.entries()) {
        const r = await fetch(`/api/attempts/${attempt.id}/answer`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders(),
          },
          body: JSON.stringify({ questionId, userAnswer: answer }),
        });
        if (!r.ok) {
          const errBody = await r.text();
          throw new Error(`提交答案失败 题目${questionId} (${r.status}): ${errBody}`);
        }
      }

      const completeResponse = await fetch(`/api/attempts/${attempt.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: '{}',
      });
      if (!completeResponse.ok) {
        const errBody = await completeResponse.text();
        throw new Error(`完成答题失败 (${completeResponse.status}): ${errBody}`);
      }
      const { attempt: completedAttempt } = await completeResponse.json();

      if (typeof onComplete === 'function') {
        onComplete(completedAttempt, answers);
      } else {
        window.location.href = `/quiz/attempts/${completedAttempt.id}`;
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      setSubmitError(`提交失败: ${error?.message || '请检查网络后重试'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getBlankCount = (correctAnswer: string | string[]): number => {
    if (Array.isArray(correctAnswer)) {
      return correctAnswer.length;
    }
    if (typeof correctAnswer === 'string' && correctAnswer.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(correctAnswer);
        if (Array.isArray(parsed) && parsed.length > 1) {
          return parsed.length;
        }
      } catch { /* fall through */ }
    }
    return 1;
  };

  const renderQuestion = () => {
    const currentAnswer = answers.get(currentQuestion.id);

    switch (currentQuestion.type) {
      case 'single_choice':
        return (
          <div className="space-y-2.5">
            {currentQuestion.question_options?.map((option, idx) => {
              const isSelected = currentAnswer === option.content;
              return (
                <label
                  key={option.id}
                  className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'border-primary bg-primary-light shadow-glow'
                      : 'border-border hover:border-primary/40 hover:bg-accent/5'
                  }`}
                >
                  <span className={`w-8 h-8 flex items-center justify-center rounded-lg mr-4 flex-shrink-0 font-semibold text-sm transition-all ${
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    checked={isSelected}
                    onChange={() => handleAnswerChange(option.content)}
                    className="sr-only"
                  />
                  <span className="text-foreground">{option.content}</span>
                  {isSelected && (
                    <svg className="w-5 h-5 text-primary ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  )}
                </label>
              );
            })}
          </div>
        );

      case 'multiple_choice':
        const selectedOptions = (currentAnswer as string[]) || [];
        return (
          <div className="space-y-2.5">
            {currentQuestion.question_options?.map((option, idx) => {
              const isSelected = selectedOptions.includes(option.content);
              return (
                <label
                  key={option.id}
                  className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'border-primary bg-primary-light shadow-glow'
                      : 'border-border hover:border-primary/40 hover:bg-accent/5'
                  }`}
                >
                  <span className={`w-8 h-8 flex items-center justify-center rounded-lg mr-4 flex-shrink-0 font-semibold text-sm transition-all ${
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {
                      const newSelected = isSelected
                        ? selectedOptions.filter((s) => s !== option.content)
                        : [...selectedOptions, option.content];
                      handleAnswerChange(newSelected);
                    }}
                    className="sr-only"
                  />
                  <span className="text-foreground">{option.content}</span>
                  {isSelected && (
                    <svg className="w-5 h-5 text-primary ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  )}
                </label>
              );
            })}
          </div>
        );

      case 'true_false':
        return (
          <div className="flex gap-4">
            <label
              className={`flex-1 p-6 border rounded-xl cursor-pointer text-center transition-all duration-200 ${
                currentAnswer === 'true'
                  ? 'border-success bg-success/10 shadow-glow'
                  : 'border-border hover:border-success/40 hover:bg-success/5'
              }`}
            >
              <input
                type="radio"
                name={`question-${currentQuestion.id}`}
                checked={currentAnswer === 'true'}
                onChange={() => handleAnswerChange('true')}
                className="sr-only"
              />
              <div className="flex flex-col items-center gap-2">
                <svg className={`w-8 h-8 ${currentAnswer === 'true' ? 'text-success' : 'text-muted-foreground'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                <span className={`font-medium ${currentAnswer === 'true' ? 'text-success' : 'text-muted-foreground'}`}>正确</span>
              </div>
            </label>
            <label
              className={`flex-1 p-6 border rounded-xl cursor-pointer text-center transition-all duration-200 ${
                currentAnswer === 'false'
                  ? 'border-destructive bg-destructive/10 shadow-glow'
                  : 'border-border hover:border-destructive/40 hover:bg-destructive/5'
              }`}
            >
              <input
                type="radio"
                name={`question-${currentQuestion.id}`}
                checked={currentAnswer === 'false'}
                onChange={() => handleAnswerChange('false')}
                className="sr-only"
              />
              <div className="flex flex-col items-center gap-2">
                <svg className={`w-8 h-8 ${currentAnswer === 'false' ? 'text-destructive' : 'text-muted-foreground'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className={`font-medium ${currentAnswer === 'false' ? 'text-destructive' : 'text-muted-foreground'}`}>错误</span>
              </div>
            </label>
          </div>
        );

      case 'fill_blank':
        const blankCount = getBlankCount(currentQuestion.correct_answer);
        if (blankCount > 1) {
          const blankAnswers = (currentAnswer as string[]) || new Array(blankCount).fill('');
          return (
            <div className="space-y-3">
              {Array.from({ length: blankCount }, (_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground w-12 flex-shrink-0">
                    空{i + 1}
                  </span>
                  <input
                    type="text"
                    value={blankAnswers[i] || ''}
                    onChange={(e) => {
                      const newAnswers = [...blankAnswers];
                      newAnswers[i] = e.target.value;
                      handleAnswerChange(newAnswers);
                    }}
                    className="input-field"
                    placeholder={`输入第 ${i + 1} 个空的答案`}
                  />
                </div>
              ))}
            </div>
          );
        }
        return (
          <input
            type="text"
            value={(currentAnswer as string) || ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
            className="input-field"
            placeholder="输入答案"
          />
        );

      case 'short_answer':
        return (
          <textarea
            value={(currentAnswer as string) || ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
            rows={5}
            className="input-field resize-none"
            placeholder="输入你的答案..."
          />
        );

      default:
        return null;
    }
  };

  const typeLabels: Record<string, { label: string; color: string }> = {
    single_choice: { label: '单选题', color: 'bg-primary-light text-primary' },
    multiple_choice: { label: '多选题', color: 'bg-accent/10 text-accent' },
    true_false: { label: '判断题', color: 'bg-warning/10 text-warning' },
    fill_blank: { label: '填空题', color: 'bg-success/10 text-success' },
    short_answer: { label: '简答题', color: 'bg-destructive/10 text-destructive' },
  };

  const typeInfo = typeLabels[currentQuestion.type] || { label: currentQuestion.type, color: 'bg-muted text-muted-foreground' };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="card p-5 mb-5">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-lg font-semibold">{quiz.title}</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span className="font-mono text-sm tabular-nums">{formatTime(timeElapsed)}</span>
          </div>
        </div>
        <div className="flex justify-between items-center text-sm text-muted-foreground mb-2">
          <span>题目 <span className="font-medium text-foreground">{currentIndex + 1}</span> / {questions.length}</span>
          <span>已答 <span className="font-medium text-foreground">{answers.size}</span> / {questions.length}</span>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-gradient-primary h-full rounded-full transition-all duration-300 ease-out-expo"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="card p-7 mb-5 animate-scale-in" key={currentQuestion.id}>
        <div className="flex items-center gap-2 mb-4">
          <span className={`badge ${typeInfo.color}`}>{typeInfo.label}</span>
          <span className="text-sm text-muted-foreground">{currentQuestion.points} 分</span>
        </div>
        <div className="flex items-start gap-2 mb-6">
          <span className="font-semibold text-lg text-primary flex-shrink-0">{currentIndex + 1}.</span>
          <p className="text-lg leading-relaxed text-foreground flex-1">{currentQuestion.content}</p>
        </div>
        {renderQuestion()}
      </div>

      {/* Navigation */}
      <div className="flex flex-wrap justify-between items-center gap-2">
        <button
          type="button"
          onClick={() => {
            if (confirm('确定要放弃答题吗？已作答的记录将不会保存。')) onCancel();
          }}
          className="text-muted-foreground hover:text-destructive text-sm font-medium transition-colors px-3 py-2 whitespace-nowrap"
        >
          放弃答题
        </button>
        <div className="flex gap-2 sm:gap-3 flex-wrap">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="btn-outline disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent whitespace-nowrap"
          >
            上一题
          </button>
          {currentIndex < questions.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="btn-primary whitespace-nowrap"
            >
              下一题
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-success text-success-foreground rounded-lg font-medium hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 whitespace-nowrap inline-flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  提交中...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  提交答案
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Submit error */}
      {submitError && (
        <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm flex items-center justify-between animate-slide-up">
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            {submitError}
          </span>
          <button
            onClick={() => setSubmitError(null)}
            className="text-destructive/60 hover:text-destructive ml-2"
          >
            &times;
          </button>
        </div>
      )}

      {/* Question Navigator */}
      <details className="mt-6 card group" open={questions.length <= 30}>
        <summary className="p-4 cursor-pointer list-none flex justify-between items-center select-none">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-foreground">题目导航</h3>
            <span className="text-xs text-muted-foreground">
              {answers.size}/{questions.length} 已答
            </span>
          </div>
          <svg
            className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-180"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </summary>
        <div className="px-4 pb-4">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(2.5rem,1fr))] gap-1.5 max-h-[240px] overflow-y-auto">
            {questions.map((q, index) => (
              <button
                key={q.id}
                type="button"
                onClick={() => setCurrentIndex(index)}
                aria-label={`跳转到第 ${index + 1} 题`}
                className={`h-10 min-w-0 rounded-lg text-sm font-medium transition-all duration-200 ${
                  index === currentIndex
                    ? 'bg-primary text-primary-foreground shadow-soft'
                    : answers.has(q.id)
                    ? 'bg-success/15 text-success hover:bg-success/20'
                    : 'bg-muted text-muted-foreground hover:bg-accent/10 hover:text-foreground'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </details>
    </div>
  );
}

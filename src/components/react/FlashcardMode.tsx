import React, { useState, useEffect, useRef } from 'react';
import type { Question } from '../../types';
import { getAccessToken } from '../../lib/auth-client';

interface FlashcardModeProps {
  quizId: string;
  quizTitle?: string;
}

export function FlashcardMode({ quizId, quizTitle }: FlashcardModeProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    loadQuestions();
  }, [quizId]);

  const loadQuestions = async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        setError('请先登录');
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/quizzes/${quizId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load quiz');
      }

      const { questions: questionsData } = await response.json();
      setQuestions(questionsData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const formatCorrectAnswer = (raw: string | string[]): string => {
    if (Array.isArray(raw)) {
      return raw.join(', ');
    }
    if (typeof raw === 'string' && raw.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map((v: string, i: number) => `空${i + 1}: ${v}`).join('；');
        }
      } catch { /* fall through */ }
    }
    return String(raw);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setIsFlipping(true);
      setTimeout(() => {
        setShowAnswer(false);
        setCurrentIndex(currentIndex + 1);
        setIsFlipping(false);
      }, 150);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipping(true);
      setTimeout(() => {
        setShowAnswer(false);
        setCurrentIndex(currentIndex - 1);
        setIsFlipping(false);
      }, 150);
    }
  };

  const handleFlip = () => {
    setIsFlipping(true);
    setTimeout(() => {
      setShowAnswer(!showAnswer);
      setIsFlipping(false);
    }, 150);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 60) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
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

  if (error) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
        </div>
        <p className="text-destructive mb-4">{error}</p>
        <a href="/dashboard" className="btn-primary">返回控制台</a>
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
        <a href="/dashboard" className="btn-primary">返回控制台</a>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const typeLabels: Record<string, { label: string; color: string }> = {
    single_choice: { label: '单选题', color: 'bg-primary-light text-primary' },
    multiple_choice: { label: '多选题', color: 'bg-accent/10 text-accent' },
    true_false: { label: '判断题', color: 'bg-warning/10 text-warning' },
    fill_blank: { label: '填空题', color: 'bg-success/10 text-success' },
    short_answer: { label: '简答题', color: 'bg-destructive/10 text-destructive' },
  };

  const typeInfo = typeLabels[currentQuestion.type] || { label: currentQuestion.type, color: 'bg-muted text-muted-foreground' };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h1 className="text-lg font-semibold">{quizTitle || '背题模式'}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              第 <span className="font-medium text-foreground">{currentIndex + 1}</span> / {questions.length} 题
            </p>
          </div>
          <a
            href={`/quiz/${quizId}`}
            className="btn-outline text-sm"
          >
            退出
          </a>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-gradient-primary h-full rounded-full transition-all duration-300 ease-out-expo"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleFlip}
        className={`card cursor-pointer min-h-[320px] p-8 md:p-10 flex flex-col items-center justify-center text-center transition-all duration-200 ${
          isFlipping ? 'opacity-50 scale-95' : 'hover:shadow-large'
        } ${showAnswer ? 'border-primary/30 bg-primary-light/30' : ''}`}
      >
        {!showAnswer ? (
          <div className="animate-scale-in w-full">
            <div className="flex justify-center mb-5">
              <span className={`badge ${typeInfo.color}`}>{typeInfo.label}</span>
            </div>
            <p className="text-xl md:text-2xl font-medium leading-relaxed mb-6">
              {currentQuestion.content}
            </p>
            
            {/* 选择题选项 */}
            {(currentQuestion.type === 'single_choice' || currentQuestion.type === 'multiple_choice') && currentQuestion.question_options && currentQuestion.question_options.length > 0 && (
              <div className="space-y-2.5 mb-6">
                {currentQuestion.question_options.map((option, idx) => (
                  <div
                    key={option.id}
                    className="flex items-center justify-center p-3 border border-border rounded-xl bg-muted/30 gap-3"
                  >
                    <span className="w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 font-semibold text-sm bg-muted text-muted-foreground">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-foreground">{option.content}</span>
                  </div>
                ))}
              </div>
            )}
            
            {/* 判断题选项 */}
            {currentQuestion.type === 'true_false' && (
              <div className="flex gap-3 mb-6">
                <div className="flex-1 p-4 border border-border rounded-xl bg-muted/30 text-center">
                  <svg className="w-6 h-6 mx-auto mb-1 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  <span className="text-sm text-muted-foreground">正确</span>
                </div>
                <div className="flex-1 p-4 border border-border rounded-xl bg-muted/30 text-center">
                  <svg className="w-6 h-6 mx-auto mb-1 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-sm text-muted-foreground">错误</span>
                </div>
              </div>
            )}
            
            <p className="text-muted-foreground/60 text-sm flex items-center justify-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
              点击卡片查看答案
            </p>
          </div>
        ) : (
          <div className="animate-scale-in w-full">
            <div className="flex justify-center mb-4">
              <span className="badge bg-success/10 text-success">
                <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                正确答案
              </span>
            </div>
            <p className="text-xl md:text-2xl font-medium leading-relaxed text-success mb-6">
              {formatCorrectAnswer(currentQuestion.correct_answer)}
            </p>
            {currentQuestion.explanation && (
              <div className="mt-4 p-4 bg-warning/5 border border-warning/20 rounded-lg text-sm text-left">
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">解析：</span>{currentQuestion.explanation}
                </p>
              </div>
            )}
            <p className="text-muted-foreground/60 text-sm mt-6 flex items-center justify-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
              点击卡片返回题目
            </p>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="mt-5">
        {/* 移动端：仅上一题/下一题 + 当前题号 */}
        <div className="flex justify-between items-center gap-2 sm:hidden">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="btn-outline flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent whitespace-nowrap px-3 py-2"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            上一题
          </button>

          <div className="text-center text-sm text-muted-foreground tabular-nums whitespace-nowrap">
            <span className="font-semibold text-foreground">{currentIndex + 1}</span>
            <span className="mx-1">/</span>
            <span>{questions.length}</span>
          </div>

          <button
            onClick={handleNext}
            disabled={currentIndex === questions.length - 1}
            className="btn-primary flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap px-3 py-2"
          >
            下一题
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        {/* 桌面端：包含圆点导航 */}
        <div className="hidden sm:flex justify-between items-center gap-3">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="btn-outline flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            上一题
          </button>

          <div className="flex-1 flex justify-center gap-1 overflow-hidden">
            {questions.map((q, index) => (
              <button
                key={q.id}
                onClick={() => {
                  setIsFlipping(true);
                  setTimeout(() => {
                    setShowAnswer(false);
                    setCurrentIndex(index);
                    setIsFlipping(false);
                  }, 150);
                }}
                className={`w-2 h-2 rounded-full flex-shrink-0 transition-all duration-200 ${
                  index === currentIndex
                    ? 'bg-primary w-6'
                    : 'bg-muted hover:bg-muted-foreground/40'
                }`}
                aria-label={`跳转到第 ${index + 1} 题`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            disabled={currentIndex === questions.length - 1}
            className="btn-primary flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            下一题
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tip */}
      <p className="text-center text-muted-foreground/60 text-xs mt-4">
        支持左右滑动切换卡片
      </p>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import type { Question, QuestionType } from '../../types';
import { getAccessToken } from '../../lib/auth-client';

interface FlashcardModeProps {
  quizId: string;
}

export function FlashcardMode({ quizId }: FlashcardModeProps) {
  const [quiz, setQuiz] = useState<{ title: string; description?: string } | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const mouseStartX = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const token = getAccessToken();
        const headers: HeadersInit = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`/api/quizzes/${quizId}`, { headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setQuiz(data.quiz);
        setQuestions(data.questions || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : '加载失败');
      } finally {
        setLoading(false);
      }
    })();
  }, [quizId]);

  useEffect(() => {
    setShowAnswer(false);
    setSelectedOptions(new Set());
  }, [currentIndex]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">加载中...</p>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">{error || '习题不存在'}</p>
        <a
          href="/dashboard"
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 inline-block"
        >
          返回
        </a>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">该习题还没有题目</p>
        <a
          href="/dashboard"
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 inline-block"
        >
          返回
        </a>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const formatAnswer = (q: Question): React.ReactNode => {
    switch (q.type) {
      case 'single_choice':
      case 'multiple_choice': {
        const correctOpts = q.question_options?.filter((o: any) => o.is_correct) || [];
        if (correctOpts.length === 0) {
          return <span>{Array.isArray(q.correct_answer) ? q.correct_answer.join('、') : q.correct_answer}</span>;
        }
        const labels = correctOpts.map((o: any, i: number) =>
          String.fromCharCode(65 + (q.question_options?.indexOf(o) ?? i))
        );
        return (
          <span className="text-green-600 dark:text-green-400 font-medium">
            {q.type === 'multiple_choice' ? '多选：' : ''}{labels.join('、')}
          </span>
        );
      }
      case 'true_false':
        return (
          (() => {
            const s = String(q.correct_answer).toLowerCase().trim();
            const isTrue = s === 'true' || s === 't' || s === '√';
            return (
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                isTrue ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
              }`}>
                {isTrue ? '✓ 正确' : '✗ 错误'}
              </span>
            );
          })()
        );
      case 'fill_blank': {
        if (Array.isArray(q.correct_answer)) {
          return (
            <div className="space-y-2">
              {q.correct_answer.map((ans, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground w-10">空{i + 1}</span>
                  <span className="px-3 py-1 bg-green-50 border border-green-200 rounded text-green-800 dark:bg-green-900 dark:border-green-800 dark:text-green-300 font-medium">
                    {ans}
                  </span>
                </div>
              ))}
            </div>
          );
        }
        if (typeof q.correct_answer === 'string' && q.correct_answer.trim().startsWith('[')) {
          try {
            const parsed = JSON.parse(q.correct_answer);
            if (Array.isArray(parsed) && parsed.length > 1) {
              return (
                <div className="space-y-2">
                  {parsed.map((ans: string, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground w-10">空{i + 1}</span>
                      <span className="px-3 py-1 bg-green-50 border border-green-200 rounded text-green-800 dark:bg-green-900 dark:border-green-800 dark:text-green-300 font-medium">
                        {ans}
                      </span>
                    </div>
                  ))}
                </div>
              );
            }
          } catch { /* fall through */ }
        }
        return (
          <span className="px-3 py-1 bg-green-50 border border-green-200 rounded text-green-800 dark:bg-green-900 dark:border-green-800 dark:text-green-300 font-medium">
            {q.correct_answer as string}
          </span>
        );
      }
      case 'short_answer':
        return (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-900 dark:bg-green-900 dark:border-green-800 dark:text-green-300 whitespace-pre-wrap">
            {q.correct_answer as string}
          </div>
        );
      default:
        return <span>{String(q.correct_answer)}</span>;
    }
  };

  const typeLabels: Record<QuestionType, { label: string; color: string }> = {
    single_choice: { label: '单选题', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
    multiple_choice: { label: '多选题', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
    true_false: { label: '判断题', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
    fill_blank: { label: '填空题', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300' },
    short_answer: { label: '简答题', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300' },
  };

  const typeInfo = typeLabels[currentQuestion.type] || { label: currentQuestion.type, color: 'bg-muted text-muted-foreground' };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-background border border-border rounded-lg shadow-sm p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-xl font-semibold text-foreground">
            📖 背题模式 — {quiz.title}
          </h1>
          <a
            href="/dashboard"
            className="text-muted-foreground hover:text-foreground text-sm cursor-pointer transition-colors"
          >
            ✕ 退出
          </a>
        </div>
        <div className="flex justify-between items-center text-sm text-muted-foreground mb-2">
          <span>
            题目 {currentIndex + 1} / {questions.length}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Navigator */}
      <div className="mb-4 bg-background border border-border rounded-lg shadow-sm p-3">
        <div className="flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-thin">
          {questions.map((q, index) => (
            <button
              key={q.id}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className={`shrink-0 w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                index === currentIndex
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Flashcard */}
      <div
        className="bg-background border border-border rounded-lg shadow-sm p-8 mb-6 min-h-[420px] flex flex-col select-none touch-pan-y"
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX;
          touchStartY.current = e.touches[0].clientY;
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          const dy = e.changedTouches[0].clientY - touchStartY.current!;
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
            if (dx > 0 && currentIndex > 0) setCurrentIndex(currentIndex - 1);
            else if (dx < 0 && currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1);
          }
          touchStartX.current = null;
        }}
        onMouseDown={(e) => {
          mouseStartX.current = e.clientX;
        }}
        onMouseUp={(e) => {
          if (mouseStartX.current === null) return;
          const dx = e.clientX - mouseStartX.current;
          mouseStartX.current = null;
          if (Math.abs(dx) > 80) {
            if (dx > 0 && currentIndex > 0) setCurrentIndex(currentIndex - 1);
            else if (dx < 0 && currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1);
          }
        }}
        onClick={() => {
          setShowAnswer((s) => !s);
        }}
      >
        {/* 题型 + 分值 */}
        <div className="flex items-center gap-3 mb-4">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
            {typeInfo.label}
          </span>
          <span className="text-sm text-muted-foreground">{currentQuestion.points} 分</span>
        </div>

        {/* 题目内容 */}
        <div className="mb-6">
          <p className="text-lg leading-relaxed text-foreground">{currentQuestion.content}</p>
        </div>

        {/* 选项列表（选择题） */}
        {(currentQuestion.type === 'single_choice' || currentQuestion.type === 'multiple_choice') &&
          currentQuestion.question_options &&
          currentQuestion.question_options.length > 0 && (
            <div className="space-y-2 mb-6">
              {currentQuestion.question_options.map((option: any, idx: number) => {
                const isSelected = selectedOptions.has(option.id);
                const isCorrect = option.is_correct;
                const reveal = selectedOptions.size > 0;
                const showGreen = reveal && isCorrect;
                const showRed = reveal && isSelected && !isCorrect;
                return (
                  <button
                    key={option.id || idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOptions((prev) => {
                        const next = new Set(prev);
                        if (currentQuestion.type === 'multiple_choice') {
                          if (next.has(option.id)) next.delete(option.id);
                          else next.add(option.id);
                        } else {
                          next.clear();
                          next.add(option.id);
                        }
                        return next;
                      });
                    }}
                    className={`w-full flex items-center p-3 rounded-lg border transition-colors text-left ${
                      showGreen
                        ? 'border-green-400 bg-green-50 dark:bg-green-950 dark:border-green-700'
                        : showRed
                        ? 'border-red-400 bg-red-50 dark:bg-red-950 dark:border-red-700'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <span className={`w-7 h-7 flex items-center justify-center rounded-full mr-3 flex-shrink-0 text-sm font-semibold ${
                      showGreen
                        ? 'bg-green-500 text-white'
                        : showRed
                        ? 'bg-red-500 text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-foreground">{option.content}</span>
                    {showGreen && <span className="ml-auto text-green-600 dark:text-green-400">✓</span>}
                    {showRed && <span className="ml-auto text-red-600 dark:text-red-400">✗</span>}
                  </button>
                );
              })}
            </div>
          )
        }

        {/* 判断题选项 */}
        {currentQuestion.type === 'true_false' && (() => {
          const correctVal = (() => {
            const s = String(currentQuestion.correct_answer).toLowerCase().trim();
            return (s === 'true' || s === 't' || s === '√') ? 'true' : 'false';
          })();
          const tfOptions = [
            { label: '正确', value: 'true', isCorrect: correctVal === 'true' },
            { label: '错误', value: 'false', isCorrect: correctVal === 'false' },
          ];
          return (
            <div className="flex space-x-4 mb-6">
              {tfOptions.map((opt) => {
                const isSelected = selectedOptions.has(opt.value);
                const reveal = selectedOptions.size > 0;
                const showGreen = reveal && opt.isCorrect;
                const showRed = reveal && isSelected && !opt.isCorrect;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOptions((prev) => {
                        const next = new Set(prev);
                        next.clear();
                        next.add(opt.value);
                        return next;
                      });
                    }}
                    className={`flex-1 p-3 border rounded-lg text-center transition-colors ${
                      showGreen
                        ? 'border-green-400 bg-green-50 dark:bg-green-950 dark:border-green-700 text-green-700 dark:text-green-300 font-medium'
                        : showRed
                        ? 'border-red-400 bg-red-50 dark:bg-red-950 dark:border-red-700 text-red-700 dark:text-red-300 font-medium'
                        : 'border-border text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    {opt.label}
                    {showGreen && <span className="ml-2">✓</span>}
                    {showRed && <span className="ml-2">✗</span>}
                  </button>
                );
              })}
            </div>
          );
        })()}

        {/* 答案区 */}
        <div className="border-t border-border pt-6 flex-1 flex flex-col justify-center min-h-[140px]">
        {showAnswer ? (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium text-green-600 dark:text-green-400">✓ 正确答案</span>
              <span className="text-xs text-muted-foreground">点击卡片或按钮隐藏</span>
            </div>
            <div className="text-base text-foreground">
              {formatAnswer(currentQuestion)}
            </div>
            {currentQuestion.explanation && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-300">
                💡 {currentQuestion.explanation}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <div className="text-3xl mb-1">👁</div>
            <p className="text-sm">点击卡片查看答案</p>
          </div>
        )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          ← 左滑上题 · 右滑下题 →
        </div>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="px-4 py-2 border border-border rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed text-foreground transition-colors"
          >
            上一题
          </button>
          {currentIndex < questions.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentIndex(currentIndex + 1)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              下一题
            </button>
          ) : (
            <a
              href="/dashboard"
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              完成
            </a>
          )}
        </div>
      </div>

    </div>
  );
}

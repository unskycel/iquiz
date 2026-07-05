import React, { useState, useEffect, useRef } from 'react';
import type { Question, QuestionType } from '../../types';
import { getAccessToken } from '../../lib/auth-client';

interface FlashcardModeProps {
  quizId: string;
  onCancel: () => void;
}

export function FlashcardMode({ quizId, onCancel }: FlashcardModeProps) {
  const [quiz, setQuiz] = useState<{ title: string; description?: string } | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set()); // 用户点击的选项 id
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

  // 切题时重置状态
  useEffect(() => {
    setShowAnswer(false);
    setSelectedOptions(new Set());
  }, [currentIndex]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">加载中...</p>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error || '习题不存在'}</p>
        <button
          onClick={onCancel}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          返回
        </button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">该习题还没有题目</p>
        <button
          onClick={onCancel}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          返回
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  // 格式化正确答案用于展示
  const formatAnswer = (q: Question): React.ReactNode => {
    switch (q.type) {
      case 'single_choice':
      case 'multiple_choice': {
        // 选项已在卡片正面展示，这里只显示文字总结
        const correctOpts = q.question_options?.filter((o: any) => o.is_correct) || [];
        if (correctOpts.length === 0) {
          return <span>{Array.isArray(q.correct_answer) ? q.correct_answer.join('、') : q.correct_answer}</span>;
        }
        const labels = correctOpts.map((o: any, i: number) =>
          String.fromCharCode(65 + (q.question_options?.indexOf(o) ?? i))
        );
        return (
          <span className="text-green-700 font-medium">
            {q.type === 'multiple_choice' ? '多选：' : ''}{labels.join('、')}
          </span>
        );
      }
      case 'true_false':
        return (
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            q.correct_answer === 'true' || q.correct_answer === '正确'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {q.correct_answer === 'true' || q.correct_answer === '正确' ? '✓ 正确' : '✗ 错误'}
          </span>
        );
      case 'fill_blank': {
        if (Array.isArray(q.correct_answer)) {
          return (
            <div className="space-y-2">
              {q.correct_answer.map((ans, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500 w-10">空{i + 1}</span>
                  <span className="px-3 py-1 bg-green-50 border border-green-200 rounded text-green-800 font-medium">
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
                      <span className="text-sm font-medium text-gray-500 w-10">空{i + 1}</span>
                      <span className="px-3 py-1 bg-green-50 border border-green-200 rounded text-green-800 font-medium">
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
          <span className="px-3 py-1 bg-green-50 border border-green-200 rounded text-green-800 font-medium">
            {q.correct_answer as string}
          </span>
        );
      }
      case 'short_answer':
        return (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-900 whitespace-pre-wrap">
            {q.correct_answer as string}
          </div>
        );
      default:
        return <span>{String(q.correct_answer)}</span>;
    }
  };

  // 题型标签颜色
  const typeLabels: Record<QuestionType, { label: string; color: string }> = {
    single_choice: { label: '单选题', color: 'bg-blue-100 text-blue-700' },
    multiple_choice: { label: '多选题', color: 'bg-purple-100 text-purple-700' },
    true_false: { label: '判断题', color: 'bg-amber-100 text-amber-700' },
    fill_blank: { label: '填空题', color: 'bg-teal-100 text-teal-700' },
    short_answer: { label: '简答题', color: 'bg-rose-100 text-rose-700' },
  };

  const typeInfo = typeLabels[currentQuestion.type] || { label: currentQuestion.type, color: 'bg-gray-100 text-gray-700' };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-xl font-semibold">
            📖 背题模式 — {quiz.title}
          </h1>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            ✕ 退出
          </button>
        </div>
        <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
          <span>
            题目 {currentIndex + 1} / {questions.length}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div
        className="bg-white rounded-lg shadow-sm p-8 mb-6 min-h-[300px] select-none touch-pan-y"
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
          // 拖拽超过 80px 才是滑动，否则视为点击
          if (Math.abs(dx) > 80) {
            if (dx > 0 && currentIndex > 0) setCurrentIndex(currentIndex - 1);
            else if (dx < 0 && currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1);
          } else {
            // 桌面点击 — 触发选择题型翻面
            if (currentQuestion.type === 'single_choice' || currentQuestion.type === 'multiple_choice' || currentQuestion.type === 'true_false') {
              setShowAnswer((s) => !s);
            }
          }
        }}
        onClick={() => {
          // 触摸端点击 — 选择题型翻面
          if (currentQuestion.type === 'single_choice' || currentQuestion.type === 'multiple_choice' || currentQuestion.type === 'true_false') {
            setShowAnswer((s) => !s);
          }
        }}
      >
        {/* 题型 + 分值 */}
        <div className="flex items-center gap-3 mb-4">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
            {typeInfo.label}
          </span>
          <span className="text-sm text-gray-400">{currentQuestion.points} 分</span>
        </div>

        {/* 题目内容 */}
        <div className="mb-6">
          <p className="text-lg leading-relaxed">{currentQuestion.content}</p>
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
                        ? 'border-green-400 bg-green-50'
                        : showRed
                        ? 'border-red-400 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className={`w-7 h-7 flex items-center justify-center rounded-full mr-3 flex-shrink-0 text-sm font-semibold ${
                      showGreen
                        ? 'bg-green-500 text-white'
                        : showRed
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{option.content}</span>
                    {showGreen && <span className="ml-auto text-green-600">✓</span>}
                    {showRed && <span className="ml-auto text-red-600">✗</span>}
                  </button>
                );
              })}
            </div>
          )
        }

        {/* 判断题选项 */}
        {currentQuestion.type === 'true_false' && (() => {
          const tfOptions = [
            { label: '正确', value: 'true', isCorrect: currentQuestion.correct_answer === 'true' || currentQuestion.correct_answer === '正确' },
            { label: '错误', value: 'false', isCorrect: currentQuestion.correct_answer === 'false' || currentQuestion.correct_answer === '错误' },
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
                        ? 'border-green-400 bg-green-50 text-green-700 font-medium'
                        : showRed
                        ? 'border-red-400 bg-red-50 text-red-700 font-medium'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
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

        {/* 答案区：所有题型都根据 showAnswer 翻面 */}
        {showAnswer ? (
          <div className="border-t pt-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium text-green-600">✓ 正确答案</span>
              <span className="text-xs text-gray-400">点击卡片或按钮隐藏</span>
            </div>
            <div className="text-base">
              {formatAnswer(currentQuestion)}
            </div>
            {currentQuestion.explanation && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                💡 {currentQuestion.explanation}
              </div>
            )}
          </div>
        ) : (
          <div className="border-t pt-6 text-center py-4 text-gray-400">
            <div className="text-3xl mb-1">👁</div>
            <p className="text-sm">点击卡片查看答案</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          ← 左滑上题 · 右滑下题 →
        </div>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一题
          </button>
          {currentIndex < questions.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentIndex(currentIndex + 1)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              下一题
            </button>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              完成
            </button>
          )}
        </div>
      </div>

      {/* Question Navigator */}
      <div className="mt-6 bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">题目导航</h3>
        <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto">
          {questions.map((q, index) => (
            <button
              key={q.id}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                index === currentIndex
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

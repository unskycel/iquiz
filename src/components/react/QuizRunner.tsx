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

  // Load quiz data if quizId is provided
  useEffect(() => {
    if (quizId && !initialQuiz) {
      loadQuiz();
    }
  }, [quizId]);

  // Timer — must be before any early returns (React hooks rule)
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
      // Create attempt via API
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

      // Submit all answers
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

      // Complete the attempt
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

      onComplete(completedAttempt, answers);
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

  /**
   * Get the number of blanks for a fill_blank question.
   * - Array → return length (DB stores multi-blank answers as JS array)
   * - String starting with '[' → JSON.parse and return length
   * - Otherwise → 1 (single blank)
   */
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
          <div className="space-y-3">
            {currentQuestion.question_options?.map((option, idx) => (
              <label
                key={option.id}
                className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                  currentAnswer === option.content
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className={`w-8 h-8 flex items-center justify-center rounded-full mr-4 flex-shrink-0 font-semibold text-sm ${
                  currentAnswer === option.content
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <input
                  type="radio"
                  name={`question-${currentQuestion.id}`}
                  checked={currentAnswer === option.content}
                  onChange={() => handleAnswerChange(option.content)}
                  className="sr-only"
                />
                {option.content}
              </label>
            ))}
          </div>
        );

      case 'multiple_choice':
        const selectedOptions = (currentAnswer as string[]) || [];
        return (
          <div className="space-y-3">
            {currentQuestion.question_options?.map((option, idx) => (
              <label
                key={option.id}
                className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedOptions.includes(option.content)
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className={`w-8 h-8 flex items-center justify-center rounded-full mr-4 flex-shrink-0 font-semibold text-sm ${
                  selectedOptions.includes(option.content)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <input
                  type="checkbox"
                  checked={selectedOptions.includes(option.content)}
                  onChange={() => {
                    const newSelected = selectedOptions.includes(option.content)
                      ? selectedOptions.filter((s) => s !== option.content)
                      : [...selectedOptions, option.content];
                    handleAnswerChange(newSelected);
                  }}
                  className="sr-only"
                />
                {option.content}
              </label>
            ))}
          </div>
        );

      case 'true_false':
        return (
          <div className="flex space-x-4">
            <label
              className={`flex-1 p-4 border rounded-lg cursor-pointer text-center transition-colors ${
                currentAnswer === 'true'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name={`question-${currentQuestion.id}`}
                checked={currentAnswer === 'true'}
                onChange={() => handleAnswerChange('true')}
                className="sr-only"
              />
              正确
            </label>
            <label
              className={`flex-1 p-4 border rounded-lg cursor-pointer text-center transition-colors ${
                currentAnswer === 'false'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name={`question-${currentQuestion.id}`}
                checked={currentAnswer === 'false'}
                onChange={() => handleAnswerChange('false')}
                className="sr-only"
              />
              错误
            </label>
          </div>
        );

      case 'fill_blank':
        const blankCount = getBlankCount(currentQuestion.correct_answer);
        if (blankCount > 1) {
          // Multi-blank fill-in
          const blankAnswers = (currentAnswer as string[]) || new Array(blankCount).fill('');
          return (
            <div className="space-y-3">
              {Array.from({ length: blankCount }, (_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-500 w-10 flex-shrink-0">
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
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder={`输入第 ${i + 1} 个空`}
                  />
                </div>
              ))}
            </div>
          );
        }
        // Single blank
        return (
          <input
            type="text"
            value={(currentAnswer as string) || ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            placeholder="输入答案"
          />
        );

      case 'short_answer':
        return (
          <textarea
            value={(currentAnswer as string) || ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            placeholder="输入答案"
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-xl font-semibold">{quiz.title}</h1>
          <div className="text-gray-600">{formatTime(timeElapsed)}</div>
        </div>
        <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
          <span>
            题目 {currentIndex + 1} / {questions.length}
          </span>
          <span>
            已答 {answers.size} / {questions.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-start space-x-2 mb-4">
          <span className="font-medium text-lg">{currentIndex + 1}.</span>
          <div className="flex-1">
            <p className="text-lg mb-1">{currentQuestion.content}</p>
            <span className="text-sm text-gray-500">({currentQuestion.points}分)</span>
          </div>
        </div>
        {renderQuestion()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          放弃答题
        </button>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一题
          </button>
          {currentIndex < questions.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              下一题
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isSubmitting ? '提交中...' : '提交答案'}
            </button>
          )}
        </div>
      </div>

      {/* Submit error */}
      {submitError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center justify-between">
          <span>{submitError}</span>
          <button
            onClick={() => setSubmitError(null)}
            className="text-red-400 hover:text-red-600 ml-2"
          >
            &times;
          </button>
        </div>
      )}

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
                  : answers.has(q.id)
                  ? 'bg-green-100 text-green-700'
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
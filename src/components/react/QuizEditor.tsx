import React, { useState, useCallback, useEffect } from 'react';
import type { Question, QuestionType, QuestionOption } from '../../types';
import { validateQuiz, hasValidationErrors, countQuestionErrors, getFirstErrorIndex, type QuestionError } from '../../lib/validation';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';
import { QuestionForm } from './QuestionForm';

interface QuizEditorProps {
  quizId?: string;
  initialQuiz?: {
    id?: string;
    title: string;
    description?: string;
    tags: string[];
  };
  initialQuestions?: Question[];
  onSave?: (quiz: any, questions: any[]) => Promise<void>;
  onCancel: () => void;
}

export function QuizEditor({ quizId, initialQuiz, initialQuestions = [], onSave, onCancel }: QuizEditorProps) {
  const [quiz, setQuiz] = useState(initialQuiz || { title: '', description: '', tags: [] });
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [loading, setLoading] = useState(!!quizId && !initialQuiz);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [questionErrors, setQuestionErrors] = useState<(QuestionError | null)[]>([]);

  // 如果传了 quizId 但没传 initialQuiz，从 API 加载
  useEffect(() => {
    if (!quizId || initialQuiz) return;
    (async () => {
      try {
        const token = (await import('../../lib/auth-client')).getAccessToken();
        const headers: HeadersInit = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`/api/quizzes/${quizId}`, { headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.quiz) setQuiz(data.quiz);
        if (data.questions) setQuestions(data.questions);
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : '加载失败');
      } finally {
        setLoading(false);
      }
    })();
  }, [quizId, initialQuiz]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        // Update order indices
        return newItems.map((item, index) => ({ ...item, order_index: index + 1 }));
      });
    }
  }, []);

  const addQuestion = (type: QuestionType) => {
    setQuestionErrors([]);
    const newQuestion: Question = {
      id: `temp-${Date.now()}`,
      quiz_id: '',
      type,
      content: '',
      order_index: questions.length + 1,
      correct_answer: type === 'multiple_choice' ? [] : '',
      points: 1,
      created_at: new Date().toISOString(),
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, updatedQuestion: Partial<Question>) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...updatedQuestion } : q)));
    // 清除该题的验证错误
    setQuestionErrors((prev) => prev.map((e, i) => (i === index ? null : e)));
  };

  const deleteQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index).map((q, i) => ({ ...q, order_index: i + 1 })));
    setQuestionErrors((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setValidationError(null);
    setSaveError(null);
    setSaveSuccess(null);

    // 收集每道题的选项（从 DOM 或 state 无法直接拿到，需要通过 QuestionForm 暴露）
    // 这里用一个 ref map 来收集 options
    // 但当前架构下 QuestionForm 内部管理 options state，我们需要换个思路：
    // 通过 questions 的 correct_answer 和 type 做基本验证，
    // 选项内容验证依赖 QuestionForm 传递。
    // 简化方案：用 validateQuiz 验证 title + questions（无 options），
    // 选项相关验证在 QuestionForm 内部做 inline。
    const errors = validateQuiz(quiz.title, questions);
    
    // 补充选项验证：遍历 questions 检查 correct_answer
    questions.forEach((q, i) => {
      if (q.type === 'single_choice' || q.type === 'multiple_choice') {
        const answer = q.correct_answer;
        if (q.type === 'single_choice') {
          if (!answer || (typeof answer === 'string' && !answer.trim())) {
            errors.questions[i] = { ...(errors.questions[i] || {}), correctAnswer: '请选择正确答案' };
          }
        } else {
          if (!Array.isArray(answer) || answer.length === 0) {
            errors.questions[i] = { ...(errors.questions[i] || {}), correctAnswer: '请至少选择一个正确答案' };
          }
        }
      }
    });
    setQuestionErrors(errors.questions);

    if ((quiz.title || '').trim() && questions.length === 0) {
      setValidationError('请至少添加一道题目');
      return;
    }

    if (hasValidationErrors(errors)) {
      const errCount = countQuestionErrors(errors);
      const msg = errors.title 
        ? errors.title
        : `有 ${errCount} 道题目需要完善`;
      setValidationError(msg);
      // 滚动到第一个有错误的题目
      const firstErrIdx = getFirstErrorIndex(errors);
      if (firstErrIdx >= 0) {
        const el = document.getElementById(`question-${firstErrIdx}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(quiz, questions);
      } else {
        const token = (await import('../../lib/auth-client')).getAccessToken();
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const url = quizId ? `/api/quizzes/${quizId}` : '/api/quizzes';
        const method = quizId ? 'PUT' : 'POST';
        // Map question_options → options so PUT handler picks them up
        const payload = questions.map(q => ({
          ...q,
          options: q.question_options || q.options || [],
        }));
        const res = await fetch(url, { method, headers, body: JSON.stringify({ quiz, questions: payload }) });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (data.quiz?.id && !quizId) {
          // 跳到编辑页继续操作
          window.location.href = `/quiz/${data.quiz.id}`;
        } else {
          // 编辑模式：显示成功提示
          setSaveSuccess('保存成功');
          setTimeout(() => setSaveSuccess(null), 2000);
        }
      }
    } catch (error) {
      console.error('Save error:', error);
      setSaveError('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">加载中…</p>
        </div>
      )}
      {loadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          加载失败：{loadError}
        </div>
      )}
      <div className="space-y-6">
      {/* Quiz Info */}
      <div className="bg-background border border-border rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">基本信息</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">习题标题 *</label>
            <input
              type="text"
              value={quiz.title}
              onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none ${(validationError && !(quiz.title || '').trim()) ? 'border-red-400 bg-red-50' : 'border-border'}`}
              placeholder="输入习题标题"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">描述</label>
            <textarea
              value={quiz.description || ''}
              onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              placeholder="输入习题描述（可选）"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">标签</label>
            <input
              type="text"
              value={(quiz.tags || []).join(', ')}
              onChange={(e) => setQuiz({ ...quiz, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              placeholder="用逗号分隔多个标签"
            />
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="bg-background border border-border rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">题目 ({questions.length})</h2>
          {/* Desktop: inline buttons */}
          <div className="hidden md:flex space-x-2">
            <button
              type="button"
              onClick={() => addQuestion('single_choice')}
              className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200"
            >
              + 单选题
            </button>
            <button
              type="button"
              onClick={() => addQuestion('multiple_choice')}
              className="px-3 py-1 text-sm bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-lg hover:bg-green-200"
            >
              + 多选题
            </button>
            <button
              type="button"
              onClick={() => addQuestion('true_false')}
              className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200"
            >
              + 判断题
            </button>
            <button
              type="button"
              onClick={() => addQuestion('fill_blank')}
              className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
            >
              + 填空题
            </button>
            <button
              type="button"
              onClick={() => addQuestion('short_answer')}
              className="px-3 py-1 text-sm bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200"
            >
              + 简答题
            </button>
          </div>
          {/* Mobile: dropdown */}
          <select
            className="md:hidden px-3 py-1.5 text-sm border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            onChange={(e) => {
              if (e.target.value) {
                addQuestion(e.target.value as QuestionType);
                e.target.value = '';
              }
            }}
            defaultValue=""
          >
            <option value="" disabled>+ 添加题目</option>
            <option value="single_choice">单选题</option>
            <option value="multiple_choice">多选题</option>
            <option value="true_false">判断题</option>
            <option value="fill_blank">填空题</option>
            <option value="short_answer">简答题</option>
          </select>
        </div>

        {questions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            点击上方按钮添加题目
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <SortableItem key={question.id} id={question.id}>
                    <div id={`question-${index}`}>
                    <QuestionForm
                      question={question}
                      index={index}
                      errors={questionErrors[index] || null}
                      onUpdate={(updates) => updateQuestion(index, updates)}
                      onDelete={() => deleteQuestion(index)}
                    />
                    </div>
                  </SortableItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {/* Validation / save error */}
        {validationError && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg text-sm">
            {validationError}
          </div>
        )}
        {saveError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center justify-between">
            <span>{saveError}</span>
            <button onClick={() => setSaveError(null)} className="text-red-400 hover:text-red-600">&times;</button>
          </div>
        )}
        {saveSuccess && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{saveSuccess}</span>
          </div>
        )}
        <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
        >
          取消
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-colors disabled:opacity-50"
        >
          {isSaving ? '保存中...' : '保存习题'}
        </button>
      </div>
      </div>
    </div>
    </div>
  );
}
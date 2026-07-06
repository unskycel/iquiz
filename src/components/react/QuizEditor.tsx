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

    const errors = validateQuiz(quiz.title, questions);
    
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
          window.location.href = `/quiz/${data.quiz.id}`;
        } else {
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

  const questionTypeButtons: { type: QuestionType; label: string; color: string }[] = [
    { type: 'single_choice', label: '单选题', color: 'bg-primary-light text-primary hover:bg-primary/20' },
    { type: 'multiple_choice', label: '多选题', color: 'bg-accent/10 text-accent hover:bg-accent/20' },
    { type: 'true_false', label: '判断题', color: 'bg-warning/10 text-warning hover:bg-warning/20' },
    { type: 'fill_blank', label: '填空题', color: 'bg-success/10 text-success hover:bg-success/20' },
    { type: 'short_answer', label: '简答题', color: 'bg-destructive/10 text-destructive hover:bg-destructive/20' },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-muted-foreground text-sm">加载中...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
        </div>
        <p className="text-destructive mb-4">{loadError}</p>
        <button onClick={onCancel} className="btn-primary inline-flex items-center gap-2">返回</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Quiz Info */}
      <div className="card p-6 animate-slide-up">
        <h2 className="text-lg font-semibold mb-4">基本信息</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">习题标题 *</label>
            <input
              type="text"
              value={quiz.title}
              onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
              className={`input-field ${(validationError && !(quiz.title || '').trim()) ? 'border-destructive bg-destructive/5' : ''}`}
              placeholder="输入习题标题"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">描述</label>
            <textarea
              value={quiz.description || ''}
              onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
              rows={3}
              className="input-field resize-none"
              placeholder="输入习题描述（可选）"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">标签</label>
            <input
              type="text"
              value={(quiz.tags || []).join(', ')}
              onChange={(e) => setQuiz({ ...quiz, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
              className="input-field"
              placeholder="用逗号分隔多个标签"
            />
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="card p-6 animate-slide-up" style={{animationDelay: '0.1s'}}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-semibold">题目 <span className="text-muted-foreground font-normal">({questions.length})</span></h2>
          {/* Desktop: inline buttons */}
          <div className="hidden md:flex flex-wrap gap-2">
            {questionTypeButtons.map((btn) => (
              <button
                key={btn.type}
                type="button"
                onClick={() => addQuestion(btn.type)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 active:scale-95 ${btn.color}`}
              >
                + {btn.label}
              </button>
            ))}
          </div>
          {/* Mobile: dropdown */}
          <select
            className="md:hidden input-field py-1.5 text-sm w-auto"
            onChange={(e) => {
              if (e.target.value) {
                addQuestion(e.target.value as QuestionType);
                e.target.value = '';
              }
            }}
            defaultValue=""
          >
            <option value="" disabled>+ 添加题目</option>
            {questionTypeButtons.map((btn) => (
              <option key={btn.type} value={btn.type}>{btn.label}</option>
            ))}
          </select>
        </div>

        {questions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <p className="text-muted-foreground mb-1">还没有题目</p>
            <p className="text-muted-foreground/60 text-sm">点击上方按钮添加第一道题目</p>
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
        {validationError && (
          <div className="p-3 bg-warning/10 border border-warning/20 text-warning rounded-lg text-sm flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            {validationError}
          </div>
        )}
        {saveError && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              {saveError}
            </span>
            <button onClick={() => setSaveError(null)} className="text-destructive/60 hover:text-destructive">&times;</button>
          </div>
        )}
        {saveSuccess && (
          <div className="p-3 bg-success/10 border border-success/20 text-success rounded-lg text-sm flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            {saveSuccess}
          </div>
        )}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="btn-outline"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                保存中...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3" />
                </svg>
                保存习题
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

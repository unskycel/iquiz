import React, { useState } from 'react';
import type { Question, QuestionOption } from '../../types';
import type { QuestionError } from '../../lib/validation';

/* === 独立纯函数，不依赖 QuestionForm 渲染周期 === */

/**
 * 空数从 correct_answer 推断：数组→length；JSON 字符串→length；否则 1。
 */
function getEditorBlankCount(correctAnswer: Question['correct_answer']): number {
  if (Array.isArray(correctAnswer)) return Math.max(1, correctAnswer.length);
  if (typeof correctAnswer === 'string' && correctAnswer.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(correctAnswer);
      if (Array.isArray(parsed)) return Math.max(1, parsed.length);
    } catch { /* fall through */ }
  }
  return 1;
}

function BlankCountSelector({ count, onChange }: { count: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-1 text-xs flex-wrap">
      <span className="text-muted-foreground mr-1">空数</span>
      {[1, 2, 3, 4, 5, 6].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`px-2 py-0.5 rounded border transition-colors ${
            count === n
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background text-muted-foreground border-border hover:border-primary/60'
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

function FillBlankEditor({
  value,
  onChange,
  hasError,
}: {
  value: Question['correct_answer'];
  onChange: (v: Question['correct_answer']) => void;
  hasError: boolean;
}) {
  const count = getEditorBlankCount(value);

  // 统一为数组处理
  const arr: string[] =
    Array.isArray(value)
      ? value.map(v => String(v ?? ''))
      : value && typeof value === 'string' && value.trim().startsWith('[')
        ? (() => {
            try {
              const parsed = JSON.parse(value as string);
              return Array.isArray(parsed) ? parsed.map((v: unknown) => String(v ?? '')) : [''];
            } catch {
              return [''];
            }
          })()
        : [String(value ?? '')];

  // 保证数组长度
  while (arr.length < count) arr.push('');
  if (arr.length > count) arr.length = count;

  const setAt = (i: number, v: string) => {
    const next = [...arr];
    next[i] = v;
    onChange(next);
  };

  const errorClass = hasError ? 'border-destructive bg-destructive/5' : 'border-border';

  if (count === 1) {
    return (
      <input
        type="text"
        value={arr[0] ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className={`input-field ${errorClass}`}
        placeholder="输入正确答案"
      />
    );
  }

  return (
    <div className="space-y-2">
      {arr.map((v, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground w-12 flex-shrink-0">空 {i + 1}</span>
          <input
            type="text"
            value={v}
            onChange={(e) => setAt(i, e.target.value)}
            className={`input-field ${errorClass}`}
            placeholder={`输入第 ${i + 1} 个空的答案`}
          />
        </div>
      ))}
    </div>
  );
}

/* === QuestionForm 主组件 === */

interface QuestionFormProps {
  question: Question;
  index: number;
  errors?: QuestionError | null;
  onUpdate: (updates: Partial<Question>) => void;
  onDelete: () => void;
}

export function QuestionForm({ question, index, errors = null, onUpdate, onDelete }: QuestionFormProps) {
  const [options, setOptions] = useState<QuestionOption[]>(
    question.type === 'single_choice' || question.type === 'multiple_choice'
      ? (question.question_options || [])
      : []
  );

  const handleContentChange = (content: string) => {
    onUpdate({ content });
  };

  const handleTypeChange = (type: Question['type']) => {
    const updates: Partial<Question> = { type };
    let newOptions: QuestionOption[] = [];

    if (type === 'multiple_choice') {
      updates.correct_answer = [];
    } else if (type === 'true_false') {
      updates.correct_answer = 'true';
      newOptions = [
        { id: '1', question_id: question.id, content: '正确', is_correct: true, order_index: 1 },
        { id: '2', question_id: question.id, content: '错误', is_correct: false, order_index: 2 },
      ];
    } else {
      updates.correct_answer = '';
    }

    setOptions(newOptions);
    onUpdate({ ...updates, question_options: newOptions });
  };

  const handleOptionChange = (optionIndex: number, content: string) => {
    const newOptions = [...options];
    newOptions[optionIndex] = { ...newOptions[optionIndex], content };
    setOptions(newOptions);
    onUpdate({ question_options: newOptions });
  };

  const handleCorrectChange = (optionIndex: number) => {
    if (question.type === 'single_choice' || question.type === 'true_false') {
      const newOptions = options.map((opt, i) => ({
        ...opt,
        is_correct: i === optionIndex,
      }));
      setOptions(newOptions);
      onUpdate({ correct_answer: options[optionIndex].content, question_options: newOptions });
    } else if (question.type === 'multiple_choice') {
      const newOptions = [...options];
      newOptions[optionIndex] = {
        ...newOptions[optionIndex],
        is_correct: !newOptions[optionIndex].is_correct,
      };
      setOptions(newOptions);
      onUpdate({
        correct_answer: newOptions
          .filter(opt => opt.is_correct)
          .map(opt => opt.content),
        question_options: newOptions,
      });
    }
  };

  const addOption = () => {
    const newOption: QuestionOption = {
      id: `temp-${Date.now()}`,
      question_id: question.id,
      content: '',
      is_correct: false,
      order_index: options.length + 1,
    };
    const newOptions = [...options, newOption];
    setOptions(newOptions);
    onUpdate({ question_options: newOptions });
  };

  const removeOption = (optionIndex: number) => {
    const newOptions = options.filter((_, i) => i !== optionIndex);
    setOptions(newOptions);
    onUpdate({ question_options: newOptions });
  };

  const getTypeLabel = (type: Question['type']): string => {
    const labels: Record<Question['type'], string> = {
      single_choice: '单选题',
      multiple_choice: '多选题',
      true_false: '判断题',
      fill_blank: '填空题',
      short_answer: '简答题',
    };
    return labels[type];
  };

  const getTypeColor = (type: Question['type']): string => {
    const colors: Record<Question['type'], string> = {
      single_choice: 'bg-primary-light text-primary',
      multiple_choice: 'bg-success/10 text-success',
      true_false: 'bg-warning/10 text-warning',
      fill_blank: 'bg-accent/10 text-accent',
      short_answer: 'bg-destructive/10 text-destructive',
    };
    return colors[type];
  };

  const errorBorderClass = (hasError: boolean) =>
    hasError ? 'border-destructive bg-destructive/5' : 'border-border';

  return (
    <div className="border border-border rounded-lg p-4 bg-background">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-foreground">题目 {index + 1}</span>
          <span className={`badge ${getTypeColor(question.type)}`}>
            {getTypeLabel(question.type)}
          </span>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="text-destructive hover:opacity-80 text-sm transition-opacity"
        >
          删除
        </button>
      </div>

      <div className="space-y-4">
        {/* Question Type */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">题目类型</label>
          <select
            value={question.type}
            onChange={(e) => handleTypeChange(e.target.value as Question['type'])}
            className="input-field"
          >
            <option value="single_choice">单选题</option>
            <option value="multiple_choice">多选题</option>
            <option value="true_false">判断题</option>
            <option value="fill_blank">填空题</option>
            <option value="short_answer">简答题</option>
          </select>
        </div>

        {/* Question Content */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">题目内容 *</label>
          <textarea
            value={question.content}
            onChange={(e) => handleContentChange(e.target.value)}
            rows={2}
            className={`input-field ${errorBorderClass(!!errors?.content)}`}
            placeholder="输入题目内容"
          />
          {errors?.content && (
            <p className="mt-1 text-sm text-destructive">{errors.content}</p>
          )}
        </div>

        {/* Options for choice questions */}
        {(question.type === 'single_choice' || question.type === 'multiple_choice') && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">选项</label>
            <div className="space-y-2">
              {options.map((option, optIndex) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <input
                    type={question.type === 'single_choice' ? 'radio' : 'checkbox'}
                    checked={option.is_correct}
                    onChange={() => handleCorrectChange(optIndex)}
                    className="text-primary"
                  />
                  <input
                    type="text"
                    value={option.content}
                    onChange={(e) => handleOptionChange(optIndex, e.target.value)}
                    className={`input-field ${errorBorderClass(!!errors?.options || !!errors?.correctAnswer)}`}
                    placeholder={`选项 ${String.fromCharCode(65 + optIndex)}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(optIndex)}
                    className="text-destructive/60 hover:text-destructive text-lg leading-none px-1 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            {errors?.options && (
              <p className="mt-1 text-sm text-destructive">{errors.options}</p>
            )}
            {errors?.correctAnswer && (
              <p className="mt-1 text-sm text-destructive">{errors.correctAnswer}</p>
            )}
            <button
              type="button"
              onClick={addOption}
              className="mt-2 text-sm text-primary hover:text-primary-hover transition-colors"
            >
              + 添加选项
            </button>
          </div>
        )}

        {/* True/False display */}
        {question.type === 'true_false' && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">正确答案</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={question.correct_answer === 'true'}
                  onChange={() => onUpdate({ correct_answer: 'true' })}
                  className="text-primary"
                />
                <span className="ml-2">正确</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={question.correct_answer === 'false'}
                  onChange={() => onUpdate({ correct_answer: 'false' })}
                  className="text-primary"
                />
                <span className="ml-2">错误</span>
              </label>
            </div>
            {errors?.correctAnswer && (
              <p className="mt-1 text-sm text-destructive">{errors.correctAnswer}</p>
            )}
          </div>
        )}

        {/* Fill blank answer */}
        {question.type === 'fill_blank' && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-foreground">正确答案</label>
              <BlankCountSelector
                count={getEditorBlankCount(question.correct_answer)}
                onChange={(n) => onUpdate({ correct_answer: n === 1 ? '' : new Array(n).fill('') })}
              />
            </div>
            <FillBlankEditor
              value={question.correct_answer}
              onChange={(v) => onUpdate({ correct_answer: v })}
              hasError={!!errors?.correctAnswer}
            />
            {errors?.correctAnswer && (
              <p className="mt-1 text-sm text-destructive">{errors.correctAnswer}</p>
            )}
          </div>
        )}

        {/* Short answer */}
        {question.type === 'short_answer' && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">参考答案</label>
            <textarea
              value={question.correct_answer as string}
              onChange={(e) => onUpdate({ correct_answer: e.target.value })}
              rows={3}
              className={`input-field ${errorBorderClass(!!errors?.correctAnswer)}`}
              placeholder="输入参考答案"
            />
            {errors?.correctAnswer && (
              <p className="mt-1 text-sm text-destructive">{errors.correctAnswer}</p>
            )}
          </div>
        )}

        {/* Points */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">分值</label>
          <input
            type="number"
            value={question.points}
            onChange={(e) => onUpdate({ points: parseInt(e.target.value) || 1 })}
            min="1"
            className={`input-field w-24 ${errorBorderClass(!!errors?.points)}`}
          />
          {errors?.points && (
            <p className="mt-1 text-sm text-destructive">{errors.points}</p>
          )}
        </div>

        {/* Explanation */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">解析（可选）</label>
          <textarea
            value={question.explanation || ''}
            onChange={(e) => onUpdate({ explanation: e.target.value })}
            rows={2}
            className="input-field"
            placeholder="输入题目解析"
          />
        </div>
      </div>
    </div>
  );
}

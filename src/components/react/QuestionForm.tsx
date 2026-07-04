import React, { useState } from 'react';
import type { Question, QuestionOption } from '../../types';
import type { QuestionError } from '../../lib/validation';

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
    
    // Reset correct_answer based on type
    if (type === 'multiple_choice') {
      updates.correct_answer = [];
    } else if (type === 'true_false') {
      updates.correct_answer = 'true';
      setOptions([
        { id: '1', question_id: question.id, content: '正确', is_correct: true, order_index: 1 },
        { id: '2', question_id: question.id, content: '错误', is_correct: false, order_index: 2 },
      ]);
    } else {
      updates.correct_answer = '';
      setOptions([]);
    }
    
    onUpdate(updates);
  };

  const handleOptionChange = (optionIndex: number, content: string) => {
    const newOptions = [...options];
    newOptions[optionIndex] = { ...newOptions[optionIndex], content };
    setOptions(newOptions);
  };

  const handleCorrectChange = (optionIndex: number) => {
    if (question.type === 'single_choice' || question.type === 'true_false') {
      const newOptions = options.map((opt, i) => ({
        ...opt,
        is_correct: i === optionIndex,
      }));
      setOptions(newOptions);
      onUpdate({ correct_answer: options[optionIndex].content });
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
    setOptions([...options, newOption]);
  };

  const removeOption = (optionIndex: number) => {
    const newOptions = options.filter((_, i) => i !== optionIndex);
    setOptions(newOptions);
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
      single_choice: 'bg-indigo-100 text-indigo-700',
      multiple_choice: 'bg-green-100 text-green-700',
      true_false: 'bg-yellow-100 text-yellow-700',
      fill_blank: 'bg-purple-100 text-purple-700',
      short_answer: 'bg-pink-100 text-pink-700',
    };
    return colors[type];
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-gray-700">题目 {index + 1}</span>
          <span className={`px-2 py-0.5 text-xs rounded-full ${getTypeColor(question.type)}`}>
            {getTypeLabel(question.type)}
          </span>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="text-red-600 hover:text-red-700 text-sm"
        >
          删除
        </button>
      </div>

      <div className="space-y-4">
        {/* Question Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">题目类型</label>
          <select
            value={question.type}
            onChange={(e) => handleTypeChange(e.target.value as Question['type'])}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">题目内容 *</label>
          <textarea
            value={question.content}
            onChange={(e) => handleContentChange(e.target.value)}
            rows={2}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none ${errors?.content ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
            placeholder="输入题目内容"
          />
          {errors?.content && (
            <p className="mt-1 text-sm text-red-600">{errors.content}</p>
          )}
        </div>

        {/* Options for choice questions */}
        {(question.type === 'single_choice' || question.type === 'multiple_choice') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">选项</label>
            <div className="space-y-2">
              {options.map((option, optIndex) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <input
                    type={question.type === 'single_choice' ? 'radio' : 'checkbox'}
                    checked={option.is_correct}
                    onChange={() => handleCorrectChange(optIndex)}
                    className="text-indigo-600"
                  />
                  <input
                    type="text"
                    value={option.content}
                    onChange={(e) => handleOptionChange(optIndex, e.target.value)}
                    className={`flex-1 px-3 py-1 border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none ${errors?.options || errors?.correctAnswer ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                    placeholder={`选项 ${String.fromCharCode(65 + optIndex)}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(optIndex)}
                    className="text-red-500 hover:text-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            {errors?.options && (
              <p className="mt-1 text-sm text-red-600">{errors.options}</p>
            )}
            {errors?.correctAnswer && (
              <p className="mt-1 text-sm text-red-600">{errors.correctAnswer}</p>
            )}
            <button
              type="button"
              onClick={addOption}
              className="mt-2 text-sm text-indigo-600 hover:text-indigo-700"
            >
              + 添加选项
            </button>
          </div>
        )}

        {/* True/False display */}
        {question.type === 'true_false' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">正确答案</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={question.correct_answer === 'true'}
                  onChange={() => onUpdate({ correct_answer: 'true' })}
                  className="text-indigo-600"
                />
                <span className="ml-2">正确</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={question.correct_answer === 'false'}
                  onChange={() => onUpdate({ correct_answer: 'false' })}
                  className="text-indigo-600"
                />
                <span className="ml-2">错误</span>
              </label>
            </div>
            {errors?.correctAnswer && (
              <p className="mt-1 text-sm text-red-600">{errors.correctAnswer}</p>
            )}
          </div>
        )}

        {/* Fill blank answer */}
        {question.type === 'fill_blank' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">正确答案</label>
            <input
              type="text"
              value={question.correct_answer as string}
              onChange={(e) => onUpdate({ correct_answer: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none ${errors?.correctAnswer ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              placeholder='输入正确答案（多空用 JSON 数组格式如 ["空1","空2"]）'
            />
            {errors?.correctAnswer && (
              <p className="mt-1 text-sm text-red-600">{errors.correctAnswer}</p>
            )}
          </div>
        )}

        {/* Short answer */}
        {question.type === 'short_answer' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">参考答案</label>
            <textarea
              value={question.correct_answer as string}
              onChange={(e) => onUpdate({ correct_answer: e.target.value })}
              rows={3}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none ${errors?.correctAnswer ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              placeholder="输入参考答案"
            />
            {errors?.correctAnswer && (
              <p className="mt-1 text-sm text-red-600">{errors.correctAnswer}</p>
            )}
          </div>
        )}

        {/* Points */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">分值</label>
          <input
            type="number"
            value={question.points}
            onChange={(e) => onUpdate({ points: parseInt(e.target.value) || 1 })}
            min="1"
            className={`w-24 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none ${errors?.points ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
          />
          {errors?.points && (
            <p className="mt-1 text-sm text-red-600">{errors.points}</p>
          )}
        </div>

        {/* Explanation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">解析（可选）</label>
          <textarea
            value={question.explanation || ''}
            onChange={(e) => onUpdate({ explanation: e.target.value })}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            placeholder="输入题目解析"
          />
        </div>
      </div>
    </div>
  );
}
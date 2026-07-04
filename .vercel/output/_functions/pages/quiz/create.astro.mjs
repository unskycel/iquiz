import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_CzcP1_xN.mjs';
import 'piccolore';
import { $ as $$MainLayout } from '../../chunks/MainLayout_BQojVDfY.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState, useCallback } from 'react';
import { useSensors, useSensor, PointerSensor, KeyboardSensor, DndContext, closestCenter } from '@dnd-kit/core';
import { useSortable, sortableKeyboardCoordinates, arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
export { renderers } from '../../renderers.mjs';

function SortableItem({ id, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };
  return /* @__PURE__ */ jsxs("div", { ref: setNodeRef, style, className: "relative", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute left-0 top-1/2 -translate-y-1/2 -translate-x-8", children: /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        className: "p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing",
        ...attributes,
        ...listeners,
        children: /* @__PURE__ */ jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 8h16M4 16h16" }) })
      }
    ) }),
    children
  ] });
}

function QuestionForm({ question, index, onUpdate, onDelete }) {
  const [options, setOptions] = useState(
    question.type === "single_choice" || question.type === "multiple_choice" ? question.question_options || [] : []
  );
  const handleContentChange = (content) => {
    onUpdate({ content });
  };
  const handleTypeChange = (type) => {
    const updates = { type };
    if (type === "multiple_choice") {
      updates.correct_answer = [];
    } else if (type === "true_false") {
      updates.correct_answer = "true";
      setOptions([
        { id: "1", question_id: question.id, content: "正确", is_correct: true, order_index: 1 },
        { id: "2", question_id: question.id, content: "错误", is_correct: false, order_index: 2 }
      ]);
    } else {
      updates.correct_answer = "";
      setOptions([]);
    }
    onUpdate(updates);
  };
  const handleOptionChange = (optionIndex, content) => {
    const newOptions = [...options];
    newOptions[optionIndex] = { ...newOptions[optionIndex], content };
    setOptions(newOptions);
  };
  const handleCorrectChange = (optionIndex) => {
    if (question.type === "single_choice" || question.type === "true_false") {
      const newOptions = options.map((opt, i) => ({
        ...opt,
        is_correct: i === optionIndex
      }));
      setOptions(newOptions);
      onUpdate({ correct_answer: options[optionIndex].content });
    } else if (question.type === "multiple_choice") {
      const newOptions = [...options];
      newOptions[optionIndex] = {
        ...newOptions[optionIndex],
        is_correct: !newOptions[optionIndex].is_correct
      };
      setOptions(newOptions);
      onUpdate({
        correct_answer: newOptions.filter((opt) => opt.is_correct).map((opt) => opt.content)
      });
    }
  };
  const addOption = () => {
    const newOption = {
      id: `temp-${Date.now()}`,
      question_id: question.id,
      content: "",
      is_correct: false,
      order_index: options.length + 1
    };
    setOptions([...options, newOption]);
  };
  const removeOption = (optionIndex) => {
    const newOptions = options.filter((_, i) => i !== optionIndex);
    setOptions(newOptions);
  };
  const getTypeLabel = (type) => {
    const labels = {
      single_choice: "单选题",
      multiple_choice: "多选题",
      true_false: "判断题",
      fill_blank: "填空题",
      short_answer: "简答题"
    };
    return labels[type];
  };
  const getTypeColor = (type) => {
    const colors = {
      single_choice: "bg-indigo-100 text-indigo-700",
      multiple_choice: "bg-green-100 text-green-700",
      true_false: "bg-yellow-100 text-yellow-700",
      fill_blank: "bg-purple-100 text-purple-700",
      short_answer: "bg-pink-100 text-pink-700"
    };
    return colors[type];
  };
  return /* @__PURE__ */ jsxs("div", { className: "border border-gray-200 rounded-lg p-4 bg-white", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
        /* @__PURE__ */ jsxs("span", { className: "font-medium text-gray-700", children: [
          "题目 ",
          index + 1
        ] }),
        /* @__PURE__ */ jsx("span", { className: `px-2 py-0.5 text-xs rounded-full ${getTypeColor(question.type)}`, children: getTypeLabel(question.type) })
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: onDelete,
          className: "text-red-600 hover:text-red-700 text-sm",
          children: "删除"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "题目类型" }),
        /* @__PURE__ */ jsxs(
          "select",
          {
            value: question.type,
            onChange: (e) => handleTypeChange(e.target.value),
            className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none",
            children: [
              /* @__PURE__ */ jsx("option", { value: "single_choice", children: "单选题" }),
              /* @__PURE__ */ jsx("option", { value: "multiple_choice", children: "多选题" }),
              /* @__PURE__ */ jsx("option", { value: "true_false", children: "判断题" }),
              /* @__PURE__ */ jsx("option", { value: "fill_blank", children: "填空题" }),
              /* @__PURE__ */ jsx("option", { value: "short_answer", children: "简答题" })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "题目内容 *" }),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            value: question.content,
            onChange: (e) => handleContentChange(e.target.value),
            rows: 2,
            className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none",
            placeholder: "输入题目内容"
          }
        )
      ] }),
      (question.type === "single_choice" || question.type === "multiple_choice") && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "选项" }),
        /* @__PURE__ */ jsx("div", { className: "space-y-2", children: options.map((option, optIndex) => /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: question.type === "single_choice" ? "radio" : "checkbox",
              checked: option.is_correct,
              onChange: () => handleCorrectChange(optIndex),
              className: "text-indigo-600"
            }
          ),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: option.content,
              onChange: (e) => handleOptionChange(optIndex, e.target.value),
              className: "flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none",
              placeholder: `选项 ${String.fromCharCode(65 + optIndex)}`
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => removeOption(optIndex),
              className: "text-red-500 hover:text-red-600",
              children: "×"
            }
          )
        ] }, option.id)) }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: addOption,
            className: "mt-2 text-sm text-indigo-600 hover:text-indigo-700",
            children: "+ 添加选项"
          }
        )
      ] }),
      question.type === "true_false" && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "正确答案" }),
        /* @__PURE__ */ jsxs("div", { className: "flex space-x-4", children: [
          /* @__PURE__ */ jsxs("label", { className: "flex items-center", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "radio",
                checked: question.correct_answer === "true",
                onChange: () => onUpdate({ correct_answer: "true" }),
                className: "text-indigo-600"
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "ml-2", children: "正确" })
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "flex items-center", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "radio",
                checked: question.correct_answer === "false",
                onChange: () => onUpdate({ correct_answer: "false" }),
                className: "text-indigo-600"
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "ml-2", children: "错误" })
          ] })
        ] })
      ] }),
      question.type === "fill_blank" && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "正确答案" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            value: question.correct_answer,
            onChange: (e) => onUpdate({ correct_answer: e.target.value }),
            className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none",
            placeholder: "输入正确答案"
          }
        )
      ] }),
      question.type === "short_answer" && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "参考答案" }),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            value: question.correct_answer,
            onChange: (e) => onUpdate({ correct_answer: e.target.value }),
            rows: 3,
            className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none",
            placeholder: "输入参考答案"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "分值" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "number",
            value: question.points,
            onChange: (e) => onUpdate({ points: parseInt(e.target.value) || 1 }),
            min: "1",
            className: "w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "解析（可选）" }),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            value: question.explanation || "",
            onChange: (e) => onUpdate({ explanation: e.target.value }),
            rows: 2,
            className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none",
            placeholder: "输入题目解析"
          }
        )
      ] })
    ] })
  ] });
}

function QuizEditor({ initialQuiz, initialQuestions = [], onSave, onCancel }) {
  const [quiz, setQuiz] = useState(initialQuiz || { title: "", description: "", tags: [] });
  const [questions, setQuestions] = useState(initialQuestions);
  const [isSaving, setIsSaving] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );
  const handleDragEnd = useCallback((event) => {
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
  const addQuestion = (type) => {
    const newQuestion = {
      id: `temp-${Date.now()}`,
      quiz_id: "",
      type,
      content: "",
      order_index: questions.length + 1,
      correct_answer: type === "multiple_choice" ? [] : "",
      points: 1,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    setQuestions([...questions, newQuestion]);
  };
  const updateQuestion = (index, updatedQuestion) => {
    setQuestions((prev) => prev.map((q, i) => i === index ? { ...q, ...updatedQuestion } : q));
  };
  const deleteQuestion = (index) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index).map((q, i) => ({ ...q, order_index: i + 1 })));
  };
  const handleSave = async () => {
    if (!quiz.title.trim()) {
      alert("请输入习题标题");
      return;
    }
    if (questions.length === 0) {
      alert("请至少添加一道题目");
      return;
    }
    setIsSaving(true);
    try {
      await onSave(quiz, questions);
    } catch (error) {
      console.error("Save error:", error);
      alert("保存失败，请重试");
    } finally {
      setIsSaving(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-sm p-6", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold mb-4", children: "基本信息" }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "习题标题 *" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: quiz.title,
              onChange: (e) => setQuiz({ ...quiz, title: e.target.value }),
              className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none",
              placeholder: "输入习题标题"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "描述" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              value: quiz.description || "",
              onChange: (e) => setQuiz({ ...quiz, description: e.target.value }),
              rows: 3,
              className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none",
              placeholder: "输入习题描述（可选）"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "标签" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: quiz.tags.join(", "),
              onChange: (e) => setQuiz({ ...quiz, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) }),
              className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none",
              placeholder: "用逗号分隔多个标签"
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-sm p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-4", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-xl font-semibold", children: [
          "题目 (",
          questions.length,
          ")"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex space-x-2", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => addQuestion("single_choice"),
              className: "px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200",
              children: "+ 单选题"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => addQuestion("multiple_choice"),
              className: "px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200",
              children: "+ 多选题"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => addQuestion("true_false"),
              className: "px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200",
              children: "+ 判断题"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => addQuestion("fill_blank"),
              className: "px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200",
              children: "+ 填空题"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => addQuestion("short_answer"),
              className: "px-3 py-1 text-sm bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200",
              children: "+ 简答题"
            }
          )
        ] })
      ] }),
      questions.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-center py-8 text-gray-500", children: "点击上方按钮添加题目" }) : /* @__PURE__ */ jsx(DndContext, { sensors, collisionDetection: closestCenter, onDragEnd: handleDragEnd, children: /* @__PURE__ */ jsx(SortableContext, { items: questions.map((q) => q.id), strategy: verticalListSortingStrategy, children: /* @__PURE__ */ jsx("div", { className: "space-y-4", children: questions.map((question, index) => /* @__PURE__ */ jsx(SortableItem, { id: question.id, children: /* @__PURE__ */ jsx(
        QuestionForm,
        {
          question,
          index,
          onUpdate: (updates) => updateQuestion(index, updates),
          onDelete: () => deleteQuestion(index)
        }
      ) }, question.id)) }) }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex justify-end space-x-4", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: onCancel,
          className: "px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors",
          children: "取消"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: handleSave,
          disabled: isSaving,
          className: "px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50",
          children: isSaving ? "保存中..." : "保存习题"
        }
      )
    ] })
  ] });
}

const $$Create = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "MainLayout", $$MainLayout, { "title": "iQuiz - \u521B\u5EFA\u4E60\u9898" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="mb-8"> <h1 class="text-3xl font-bold text-gray-900">创建新习题</h1> <p class="mt-2 text-gray-600">填写习题信息，添加题目</p> </div> ${renderComponent($$result2, "QuizEditor", QuizEditor, { "client:load": true, "onSave": (async (quiz, questions) => {
    console.log("Saving quiz:", quiz, questions);
  }), "onCancel": (() => {
    window.location.href = "/dashboard";
  }), "client:component-hydration": "load", "client:component-path": "E:/project/iquiz/src/components/react/QuizEditor", "client:component-export": "QuizEditor" })} ` })}`;
}, "E:/project/iquiz/src/pages/quiz/create.astro", void 0);

const $$file = "E:/project/iquiz/src/pages/quiz/create.astro";
const $$url = "/quiz/create";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Create,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };

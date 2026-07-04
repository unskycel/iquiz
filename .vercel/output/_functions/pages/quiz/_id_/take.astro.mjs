import { e as createComponent, k as renderComponent, r as renderTemplate, h as createAstro } from '../../../chunks/astro/server_CzcP1_xN.mjs';
import 'piccolore';
import { $ as $$MainLayout } from '../../../chunks/MainLayout_BQojVDfY.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
export { renderers } from '../../../renderers.mjs';

function QuizRunner({ quizId, quiz: initialQuiz, questions: initialQuestions, onComplete, onCancel }) {
  const [quiz, setQuiz] = useState(initialQuiz);
  const [questions, setQuestions] = useState(initialQuestions || []);
  const [loading, setLoading] = useState(!initialQuiz || !initialQuestions);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(/* @__PURE__ */ new Map());
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    if (quizId && !initialQuiz) {
      loadQuiz();
    }
  }, [quizId]);
  const loadQuiz = async () => {
    try {
      const token = localStorage.getItem("supabase.auth.token");
      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await fetch(`/api/quizzes/${quizId}`, { headers });
      if (!response.ok) {
        throw new Error("Failed to load quiz");
      }
      const { quiz: quizData, questions: questionsData } = await response.json();
      setQuiz(quizData);
      setQuestions(questionsData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load quiz");
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsxs("div", { className: "text-center py-8", children: [
      /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-gray-600", children: "加载中..." })
    ] });
  }
  if (error || !quiz) {
    return /* @__PURE__ */ jsxs("div", { className: "text-center py-8", children: [
      /* @__PURE__ */ jsx("p", { className: "text-red-600", children: error || "习题不存在" }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: onCancel,
          className: "mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700",
          children: "返回"
        }
      )
    ] });
  }
  if (questions.length === 0) {
    return /* @__PURE__ */ jsxs("div", { className: "text-center py-8", children: [
      /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "该习题还没有题目" }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: onCancel,
          className: "mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700",
          children: "返回"
        }
      )
    ] });
  }
  const currentQuestion = questions[currentIndex];
  const progress = (currentIndex + 1) / questions.length * 100;
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1e3);
    return () => clearInterval(timer);
  }, []);
  const handleAnswerChange = (answer) => {
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
    if (!confirm("确定要提交吗？")) return;
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/attempts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("supabase.auth.token")}`
        },
        body: JSON.stringify({ quizId: quiz.id })
      });
      if (!response.ok) throw new Error("Failed to create attempt");
      const { attempt } = await response.json();
      for (const [questionId, answer] of answers.entries()) {
        await fetch(`/api/attempts/${attempt.id}/answer`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("supabase.auth.token")}`
          },
          body: JSON.stringify({ questionId, userAnswer: answer })
        });
      }
      const completeResponse = await fetch(`/api/attempts/${attempt.id}/complete`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("supabase.auth.token")}`
        }
      });
      if (!completeResponse.ok) throw new Error("Failed to complete attempt");
      const { attempt: completedAttempt } = await completeResponse.json();
      onComplete(completedAttempt, answers);
    } catch (error2) {
      console.error("Submit error:", error2);
      alert("提交失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };
  const renderQuestion = () => {
    const currentAnswer = answers.get(currentQuestion.id);
    switch (currentQuestion.type) {
      case "single_choice":
        return /* @__PURE__ */ jsx("div", { className: "space-y-3", children: currentQuestion.question_options?.map((option) => /* @__PURE__ */ jsxs(
          "label",
          {
            className: `block p-4 border rounded-lg cursor-pointer transition-colors ${currentAnswer === option.content ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"}`,
            children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "radio",
                  name: `question-${currentQuestion.id}`,
                  checked: currentAnswer === option.content,
                  onChange: () => handleAnswerChange(option.content),
                  className: "text-indigo-600 mr-3"
                }
              ),
              option.content
            ]
          },
          option.id
        )) });
      case "multiple_choice":
        const selectedOptions = currentAnswer || [];
        return /* @__PURE__ */ jsx("div", { className: "space-y-3", children: currentQuestion.question_options?.map((option) => /* @__PURE__ */ jsxs(
          "label",
          {
            className: `block p-4 border rounded-lg cursor-pointer transition-colors ${selectedOptions.includes(option.content) ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"}`,
            children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "checkbox",
                  checked: selectedOptions.includes(option.content),
                  onChange: () => {
                    const newSelected = selectedOptions.includes(option.content) ? selectedOptions.filter((s) => s !== option.content) : [...selectedOptions, option.content];
                    handleAnswerChange(newSelected);
                  },
                  className: "text-indigo-600 mr-3"
                }
              ),
              option.content
            ]
          },
          option.id
        )) });
      case "true_false":
        return /* @__PURE__ */ jsxs("div", { className: "flex space-x-4", children: [
          /* @__PURE__ */ jsxs(
            "label",
            {
              className: `flex-1 p-4 border rounded-lg cursor-pointer text-center transition-colors ${currentAnswer === "true" ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"}`,
              children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "radio",
                    name: `question-${currentQuestion.id}`,
                    checked: currentAnswer === "true",
                    onChange: () => handleAnswerChange("true"),
                    className: "sr-only"
                  }
                ),
                "正确"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "label",
            {
              className: `flex-1 p-4 border rounded-lg cursor-pointer text-center transition-colors ${currentAnswer === "false" ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"}`,
              children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "radio",
                    name: `question-${currentQuestion.id}`,
                    checked: currentAnswer === "false",
                    onChange: () => handleAnswerChange("false"),
                    className: "sr-only"
                  }
                ),
                "错误"
              ]
            }
          )
        ] });
      case "fill_blank":
        return /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            value: currentAnswer || "",
            onChange: (e) => handleAnswerChange(e.target.value),
            className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none",
            placeholder: "输入答案"
          }
        );
      case "short_answer":
        return /* @__PURE__ */ jsx(
          "textarea",
          {
            value: currentAnswer || "",
            onChange: (e) => handleAnswerChange(e.target.value),
            rows: 4,
            className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none",
            placeholder: "输入答案"
          }
        );
      default:
        return null;
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-sm p-4 mb-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-2", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold", children: quiz.title }),
        /* @__PURE__ */ jsx("div", { className: "text-gray-600", children: formatTime(timeElapsed) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-sm text-gray-600 mb-2", children: [
        /* @__PURE__ */ jsxs("span", { children: [
          "题目 ",
          currentIndex + 1,
          " / ",
          questions.length
        ] }),
        /* @__PURE__ */ jsxs("span", { children: [
          "已答 ",
          answers.size,
          " / ",
          questions.length
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: /* @__PURE__ */ jsx(
        "div",
        {
          className: "bg-indigo-600 h-2 rounded-full transition-all",
          style: { width: `${progress}%` }
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-sm p-6 mb-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-start space-x-2 mb-4", children: [
        /* @__PURE__ */ jsxs("span", { className: "font-medium text-lg", children: [
          currentIndex + 1,
          "."
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-lg mb-1", children: currentQuestion.content }),
          /* @__PURE__ */ jsxs("span", { className: "text-sm text-gray-500", children: [
            "(",
            currentQuestion.points,
            "分)"
          ] })
        ] })
      ] }),
      renderQuestion()
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: onCancel,
          className: "px-4 py-2 text-gray-600 hover:text-gray-800",
          children: "放弃答题"
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "flex space-x-3", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: handlePrevious,
            disabled: currentIndex === 0,
            className: "px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed",
            children: "上一题"
          }
        ),
        currentIndex < questions.length - 1 ? /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: handleNext,
            className: "px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700",
            children: "下一题"
          }
        ) : /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: handleSubmit,
            disabled: isSubmitting,
            className: "px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50",
            children: isSubmitting ? "提交中..." : "提交答案"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 bg-white rounded-lg shadow-sm p-4", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-medium text-gray-700 mb-3", children: "题目导航" }),
      /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: questions.map((q, index) => /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => setCurrentIndex(index),
          className: `w-10 h-10 rounded-lg text-sm font-medium transition-colors ${index === currentIndex ? "bg-indigo-600 text-white" : answers.has(q.id) ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`,
          children: index + 1
        },
        q.id
      )) })
    ] })
  ] });
}

const $$Astro = createAstro();
const $$Take = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Take;
  const { id } = Astro2.params;
  return renderTemplate`${renderComponent($$result, "MainLayout", $$MainLayout, { "title": "iQuiz - \u7B54\u9898" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "QuizRunner", QuizRunner, { "client:load": true, "quizId": id, "onComplete": ((attempt, answers) => {
    window.location.href = `/quiz/attempts/${attempt.id}`;
  }), "onCancel": (() => {
    window.location.href = "/dashboard";
  }), "client:component-hydration": "load", "client:component-path": "E:/project/iquiz/src/components/react/QuizRunner", "client:component-export": "QuizRunner" })} ` })}`;
}, "E:/project/iquiz/src/pages/quiz/[id]/take.astro", void 0);

const $$file = "E:/project/iquiz/src/pages/quiz/[id]/take.astro";
const $$url = "/quiz/[id]/take";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Take,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };

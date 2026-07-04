import { e as createComponent, k as renderComponent, r as renderTemplate, h as createAstro } from '../../../chunks/astro/server_CzcP1_xN.mjs';
import 'piccolore';
import { $ as $$MainLayout } from '../../../chunks/MainLayout_BQojVDfY.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
export { renderers } from '../../../renderers.mjs';

function AttemptResults({ attemptId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    loadAttempt();
  }, [attemptId]);
  const loadAttempt = async () => {
    try {
      const token = localStorage.getItem("supabase.auth.token");
      if (!token) {
        throw new Error("未登录");
      }
      const response = await fetch(`/api/attempts/${attemptId}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error("Failed to load attempt");
      }
      const attemptData = await response.json();
      setData(attemptData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  };
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };
  const getScorePercentage = (score2, totalPoints2) => {
    return totalPoints2 > 0 ? Math.round(score2 / totalPoints2 * 100) : 0;
  };
  const handleExportPDF = async () => {
    try {
      const token = localStorage.getItem("supabase.auth.token");
      if (!token) return;
      const response = await fetch(`/api/export/attempts/${attemptId}.pdf`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data?.attempt.quizzes.title || "结果"}_结果.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error2) {
      console.error("Export error:", error2);
      alert("导出失败");
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsxs("div", { className: "text-center py-8", children: [
      /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-gray-600", children: "加载中..." })
    ] });
  }
  if (error || !data) {
    return /* @__PURE__ */ jsxs("div", { className: "text-center py-8", children: [
      /* @__PURE__ */ jsx("p", { className: "text-red-600", children: error || "加载失败" }),
      /* @__PURE__ */ jsx("a", { href: "/dashboard", className: "mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700", children: "返回控制台" })
    ] });
  }
  const { attempt, answers } = data;
  const score = attempt.score || 0;
  const totalPoints = attempt.total_points;
  const percentage = getScorePercentage(score, totalPoints);
  const correctCount = answers.filter((a) => a.is_correct).length;
  const incorrectCount = answers.filter((a) => !a.is_correct).length;
  return /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-sm p-6", children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold mb-2", children: [
        attempt.quizzes.title,
        " - 答题结果"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
        /* @__PURE__ */ jsxs("span", { className: "text-gray-600", children: [
          "完成时间: ",
          attempt.completed_at ? new Date(attempt.completed_at).toLocaleString("zh-CN") : "-"
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleExportPDF,
            className: "px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm",
            children: "导出 PDF"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-sm p-6 text-center", children: [
      /* @__PURE__ */ jsxs("div", { className: `text-5xl font-bold mb-2 ${percentage >= 60 ? "text-green-600" : "text-red-600"}`, children: [
        score,
        "分"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-xl text-gray-600 mb-4", children: [
        percentage,
        "%"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-center gap-8", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-green-600", children: correctCount }),
          /* @__PURE__ */ jsx("div", { className: "text-gray-600", children: "正确" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-red-600", children: incorrectCount }),
          /* @__PURE__ */ jsx("div", { className: "text-gray-600", children: "错误" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-gray-600", children: formatTime(attempt.time_taken) }),
          /* @__PURE__ */ jsx("div", { className: "text-gray-600", children: "用时" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: "答题详情" }),
      answers.map((answer, index) => {
        const question = answer.questions;
        const userAnswer = Array.isArray(answer.user_answer) ? answer.user_answer.join(", ") : answer.user_answer || "(未作答)";
        let correctAnswer = "";
        if (question.type === "single_choice") {
          correctAnswer = question.correct_answer;
        } else if (question.type === "multiple_choice") {
          correctAnswer = question.correct_answer.join(", ");
        } else if (question.type === "true_false") {
          correctAnswer = question.correct_answer;
        } else {
          correctAnswer = question.correct_answer;
        }
        return /* @__PURE__ */ jsxs(
          "div",
          {
            className: `bg-white rounded-lg shadow-sm p-6 border-l-4 ${answer.is_correct ? "border-green-500" : "border-red-500"}`,
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
                  /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
                    index + 1,
                    "."
                  ] }),
                  /* @__PURE__ */ jsx(
                    "span",
                    {
                      className: `px-2 py-0.5 text-xs rounded-full ${answer.is_correct ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`,
                      children: answer.is_correct ? "正确" : "错误"
                    }
                  ),
                  /* @__PURE__ */ jsxs("span", { className: "text-sm text-gray-500", children: [
                    "+",
                    answer.points_awarded || 0,
                    "分"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("span", { className: "text-sm text-gray-500", children: [
                  "[",
                  question.type === "single_choice" ? "单选题" : question.type === "multiple_choice" ? "多选题" : question.type === "true_false" ? "判断题" : question.type === "fill_blank" ? "填空题" : "简答题",
                  "]"
                ] })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "mb-3", children: question.content }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-sm", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { className: "font-medium", children: "你的答案：" }),
                  /* @__PURE__ */ jsx("span", { className: answer.is_correct ? "text-green-600" : "text-red-600", children: userAnswer })
                ] }),
                !answer.is_correct && /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { className: "font-medium", children: "正确答案：" }),
                  /* @__PURE__ */ jsx("span", { className: "text-green-600", children: correctAnswer })
                ] }),
                question.explanation && /* @__PURE__ */ jsxs("div", { className: "mt-2 p-3 bg-gray-50 rounded", children: [
                  /* @__PURE__ */ jsx("span", { className: "font-medium", children: "解析：" }),
                  question.explanation
                ] })
              ] })
            ]
          },
          answer.id
        );
      })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex justify-center space-x-4", children: [
      /* @__PURE__ */ jsx(
        "a",
        {
          href: "/dashboard",
          className: "px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50",
          children: "返回控制台"
        }
      ),
      /* @__PURE__ */ jsx(
        "a",
        {
          href: `/quiz/${attempt.quiz_id}/take`,
          className: "px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700",
          children: "重新答题"
        }
      )
    ] })
  ] });
}

const $$Astro = createAstro();
const $$id = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$id;
  const { id } = Astro2.params;
  return renderTemplate`${renderComponent($$result, "MainLayout", $$MainLayout, { "title": "iQuiz - \u7B54\u9898\u7ED3\u679C" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "AttemptResults", AttemptResults, { "client:load": true, "attemptId": id, "client:component-hydration": "load", "client:component-path": "E:/project/iquiz/src/components/react/AttemptResults", "client:component-export": "AttemptResults" })} ` })}`;
}, "E:/project/iquiz/src/pages/quiz/attempts/[id].astro", void 0);

const $$file = "E:/project/iquiz/src/pages/quiz/attempts/[id].astro";
const $$url = "/quiz/attempts/[id]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$id,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };

import { e as createComponent, k as renderComponent, r as renderTemplate } from '../chunks/astro/server_CzcP1_xN.mjs';
import 'piccolore';
import { $ as $$MainLayout } from '../chunks/MainLayout_BQojVDfY.mjs';
import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
export { renderers } from '../renderers.mjs';

function QuizHistory({ userId }) {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  useEffect(() => {
    loadAttempts();
  }, [page]);
  const loadAttempts = async () => {
    try {
      const token = localStorage.getItem("supabase.auth.token");
      if (!token) return;
      const response = await fetch(`/api/attempts/history?page=${page}&limit=${limit}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        const { attempts: data, total: totalCount } = await response.json();
        setAttempts(data || []);
        setTotal(totalCount || 0);
      }
    } catch (error) {
      console.error("Error loading attempts:", error);
    } finally {
      setLoading(false);
    }
  };
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };
  const getScorePercentage = (score, totalPoints) => {
    return totalPoints > 0 ? Math.round(score / totalPoints * 100) : 0;
  };
  const getScoreColor = (percentage) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 70) return "text-blue-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };
  const totalPages = Math.ceil(total / limit);
  if (loading) {
    return /* @__PURE__ */ jsxs("div", { className: "text-center py-8", children: [
      /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-gray-600", children: "加载中..." })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "答题历史" }),
    attempts.length === 0 ? /* @__PURE__ */ jsx("div", { className: "bg-white rounded-lg shadow-sm p-8 text-center text-gray-500", children: "还没有答题记录" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("div", { className: "bg-white rounded-lg shadow-sm overflow-hidden", children: /* @__PURE__ */ jsxs("table", { className: "w-full", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-gray-50", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "习题" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "分数" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "正确率" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "用时" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "完成时间" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "操作" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-gray-200", children: attempts.map((attempt) => {
          const percentage = getScorePercentage(attempt.score || 0, attempt.total_points);
          const scoreColor = getScoreColor(percentage);
          return /* @__PURE__ */ jsxs("tr", { className: "hover:bg-gray-50", children: [
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: /* @__PURE__ */ jsx("div", { className: "font-medium text-gray-900", children: attempt.quizzes.title }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: /* @__PURE__ */ jsxs("span", { className: `font-medium ${scoreColor}`, children: [
              attempt.score || 0,
              "/",
              attempt.total_points
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
              /* @__PURE__ */ jsx("div", { className: "w-16 bg-gray-200 rounded-full h-2 mr-2", children: /* @__PURE__ */ jsx(
                "div",
                {
                  className: `h-2 rounded-full ${percentage >= 60 ? "bg-green-500" : "bg-red-500"}`,
                  style: { width: `${percentage}%` }
                }
              ) }),
              /* @__PURE__ */ jsxs("span", { className: `text-sm ${scoreColor}`, children: [
                percentage,
                "%"
              ] })
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap text-gray-600", children: formatTime(attempt.time_taken) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap text-gray-600", children: attempt.completed_at ? formatDate(attempt.completed_at) : "-" }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: /* @__PURE__ */ jsx(
              "a",
              {
                href: `/quiz/attempts/${attempt.id}`,
                className: "text-indigo-600 hover:text-indigo-700 text-sm",
                children: "查看详情"
              }
            ) })
          ] }, attempt.id);
        }) })
      ] }) }),
      totalPages > 1 && /* @__PURE__ */ jsxs("div", { className: "flex justify-center space-x-2", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setPage(Math.max(1, page - 1)),
            disabled: page === 1,
            className: "px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed",
            children: "上一页"
          }
        ),
        /* @__PURE__ */ jsxs("span", { className: "px-4 py-2 text-gray-600", children: [
          "第 ",
          page,
          " / ",
          totalPages,
          " 页"
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setPage(Math.min(totalPages, page + 1)),
            disabled: page === totalPages,
            className: "px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed",
            children: "下一页"
          }
        )
      ] })
    ] })
  ] });
}

const $$History = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "MainLayout", $$MainLayout, { "title": "iQuiz - \u7B54\u9898\u5386\u53F2" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "QuizHistory", QuizHistory, { "client:load": true, "client:component-hydration": "load", "client:component-path": "E:/project/iquiz/src/components/react/QuizHistory", "client:component-export": "QuizHistory" })} ` })}`;
}, "E:/project/iquiz/src/pages/history.astro", void 0);

const $$file = "E:/project/iquiz/src/pages/history.astro";
const $$url = "/history";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$History,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };

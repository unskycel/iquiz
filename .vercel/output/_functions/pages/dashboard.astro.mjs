import { e as createComponent, k as renderComponent, r as renderTemplate } from '../chunks/astro/server_CzcP1_xN.mjs';
import 'piccolore';
import { $ as $$MainLayout } from '../chunks/MainLayout_BQojVDfY.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
export { renderers } from '../renderers.mjs';

function Dashboard({ userId }) {
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    completedAttempts: 0,
    averageScore: 0,
    totalTime: 0
  });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadData();
  }, []);
  const loadData = async () => {
    try {
      const token = localStorage.getItem("supabase.auth.token");
      if (!token) return;
      const headers = {
        "Authorization": `Bearer ${token}`
      };
      const quizzesResponse = await fetch("/api/quizzes?limit=100", { headers });
      if (quizzesResponse.ok) {
        const { quizzes: quizData2 } = await quizzesResponse.json();
        setQuizzes(quizData2 || []);
      }
      const attemptsResponse = await fetch("/api/attempts/history?limit=10", { headers });
      if (attemptsResponse.ok) {
        const { attempts: attemptData } = await attemptsResponse.json();
        setAttempts(attemptData || []);
        const completedAttempts = (attemptData || []).filter((a) => a.completed_at);
        const totalScore = completedAttempts.reduce((sum, a) => sum + (a.score || 0), 0);
        const totalPoints = completedAttempts.reduce((sum, a) => sum + a.total_points, 0);
        const totalTime = completedAttempts.reduce((sum, a) => sum + a.time_taken, 0);
        setStats({
          totalQuizzes: quizData?.length || 0,
          completedAttempts: completedAttempts.length,
          averageScore: totalPoints > 0 ? Math.round(totalScore / totalPoints * 100) : 0,
          totalTime: Math.round(totalTime / 60)
          // Convert to minutes
        });
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };
  if (loading) {
    return /* @__PURE__ */ jsxs("div", { className: "text-center py-8", children: [
      /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-gray-600", children: "加载中..." })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-4 gap-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-sm p-6", children: [
        /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-indigo-600", children: stats.totalQuizzes }),
        /* @__PURE__ */ jsx("div", { className: "text-gray-600", children: "习题总数" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-sm p-6", children: [
        /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-green-600", children: stats.completedAttempts }),
        /* @__PURE__ */ jsx("div", { className: "text-gray-600", children: "已完成" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-sm p-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-2xl font-bold text-yellow-600", children: [
          stats.averageScore,
          "%"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "text-gray-600", children: "平均分数" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-sm p-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-2xl font-bold text-purple-600", children: [
          stats.totalTime,
          "分钟"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "text-gray-600", children: "学习时长" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-4", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: "我的习题" }),
        /* @__PURE__ */ jsx(
          "a",
          {
            href: "/quiz/create",
            className: "bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors",
            children: "创建新习题"
          }
        )
      ] }),
      quizzes.length === 0 ? /* @__PURE__ */ jsx("div", { className: "bg-white rounded-lg shadow-sm p-8 text-center text-gray-500", children: "还没有创建任何习题" }) : /* @__PURE__ */ jsx("div", { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-6", children: quizzes.map((quiz) => /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow", children: [
        /* @__PURE__ */ jsx("h3", { className: "font-semibold text-lg mb-2", children: quiz.title }),
        quiz.description && /* @__PURE__ */ jsx("p", { className: "text-gray-600 text-sm mb-3 line-clamp-2", children: quiz.description }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-sm text-gray-500", children: [
          /* @__PURE__ */ jsx("span", { children: formatDate(quiz.created_at) }),
          /* @__PURE__ */ jsx("span", { className: `px-2 py-0.5 rounded-full text-xs ${quiz.is_published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`, children: quiz.is_published ? "已发布" : "草稿" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 flex space-x-2", children: [
          /* @__PURE__ */ jsx(
            "a",
            {
              href: `/quiz/${quiz.id}`,
              className: "flex-1 text-center py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm",
              children: "编辑"
            }
          ),
          /* @__PURE__ */ jsx(
            "a",
            {
              href: `/quiz/${quiz.id}/take`,
              className: "flex-1 text-center py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm",
              children: "开始答题"
            }
          )
        ] })
      ] }, quiz.id)) })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold mb-4", children: "最近答题记录" }),
      attempts.length === 0 ? /* @__PURE__ */ jsx("div", { className: "bg-white rounded-lg shadow-sm p-8 text-center text-gray-500", children: "还没有答题记录" }) : /* @__PURE__ */ jsx("div", { className: "bg-white rounded-lg shadow-sm overflow-hidden", children: /* @__PURE__ */ jsxs("table", { className: "w-full", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-gray-50", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "习题" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "分数" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "用时" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "日期" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-gray-200", children: attempts.map((attempt) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-gray-50", children: [
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: /* @__PURE__ */ jsx("a", { href: `/quiz/attempts/${attempt.id}`, className: "text-indigo-600 hover:text-indigo-700", children: attempt.quizzes.title }) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: /* @__PURE__ */ jsxs("span", { className: `font-medium ${attempt.score && attempt.score / attempt.total_points >= 0.6 ? "text-green-600" : "text-red-600"}`, children: [
            attempt.score || 0,
            "/",
            attempt.total_points
          ] }) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap text-gray-600", children: formatTime(attempt.time_taken) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap text-gray-600", children: attempt.completed_at ? formatDate(attempt.completed_at) : "-" })
        ] }, attempt.id)) })
      ] }) })
    ] })
  ] });
}

const $$Dashboard = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "MainLayout", $$MainLayout, { "title": "iQuiz - \u63A7\u5236\u53F0" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "Dashboard", Dashboard, { "client:load": true, "client:component-hydration": "load", "client:component-path": "E:/project/iquiz/src/components/react/Dashboard", "client:component-export": "Dashboard" })} ` })}`;
}, "E:/project/iquiz/src/pages/dashboard.astro", void 0);

const $$file = "E:/project/iquiz/src/pages/dashboard.astro";
const $$url = "/dashboard";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Dashboard,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };

import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_CzcP1_xN.mjs';
import 'piccolore';
import { $ as $$MainLayout } from '../chunks/MainLayout_BQojVDfY.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import 'react';
export { renderers } from '../renderers.mjs';

function TestComponent() {
  return /* @__PURE__ */ jsxs("div", { className: "p-4 bg-green-100 rounded-lg", children: [
    /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-green-800", children: "React 组件测试" }),
    /* @__PURE__ */ jsx("p", { className: "text-green-700", children: "如果你看到这个，说明 React 组件正常工作！" })
  ] });
}

const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "MainLayout", $$MainLayout, { "title": "iQuiz - \u4F60\u7684\u8D44\u6599\u4E60\u9898" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="text-center py-16"> <h1 class="text-4xl font-bold text-gray-900 mb-6">iQuiz - 你的资料习题</h1> <p class="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
快速将你的学习资料转化为各类习题，帮助你更快地学习和记忆。
</p> <div class="flex justify-center space-x-4"> <a href="/auth/register" class="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-colors">
开始使用
</a> <a href="/auth/login" class="border border-indigo-600 text-indigo-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-indigo-50 transition-colors">
登录
</a> </div> </div> <div class="grid md:grid-cols-3 gap-8 mt-16"> <div class="text-center p-6"> <div class="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4"> <svg class="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path> </svg> </div> <h3 class="text-xl font-semibold mb-2">多题型支持</h3> <p class="text-gray-600">支持单选、多选、判断、填空、问答等多种题型</p> </div> <div class="text-center p-6"> <div class="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4"> <svg class="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path> </svg> </div> <h3 class="text-xl font-semibold mb-2">快速生成</h3> <p class="text-gray-600">一键生成习题，快速巩固你的知识点</p> </div> <div class="text-center p-6"> <div class="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4"> <svg class="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path> </svg> </div> <h3 class="text-xl font-semibold mb-2">快速导出</h3> <p class="text-gray-600">将习题导出为PDF，方便分享和打印</p> </div> </div> <div class="mt-8"> ${renderComponent($$result2, "TestComponent", TestComponent, { "client:load": true, "client:component-hydration": "load", "client:component-path": "E:/project/iquiz/src/components/react/TestComponent", "client:component-export": "TestComponent" })} </div> ` })}`;
}, "E:/project/iquiz/src/pages/index.astro", void 0);

const $$file = "E:/project/iquiz/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };

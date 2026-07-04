import { e as createComponent, g as addAttribute, n as renderHead, o as renderSlot, r as renderTemplate, h as createAstro } from './astro/server_CzcP1_xN.mjs';
import 'piccolore';
import 'clsx';
/* empty css                         */

const $$Astro = createAstro();
const $$MainLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$MainLayout;
  const { title = "iQuiz - \u4F60\u7684\u8D44\u6599\u4E60\u9898", description = "\u5FEB\u901F\u5C06\u4F60\u7684\u5B66\u4E60\u8D44\u6599\u8F6C\u5316\u4E3A\u5404\u7C7B\u4E60\u9898" } = Astro2.props;
  return renderTemplate`<html lang="zh-CN"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="description"${addAttribute(description, "content")}><link rel="icon" type="image/svg+xml" href="/favicon.svg"><title>${title}</title>${renderHead()}</head> <body class="min-h-screen bg-gray-50"> <nav class="bg-white shadow-sm"> <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"> <div class="flex justify-between h-16"> <div class="flex items-center"> <a href="/" class="flex items-center space-x-2"> <span class="text-xl font-bold text-indigo-600">iQuiz</span> </a> </div> <div class="flex items-center space-x-4"> <a href="/dashboard" class="text-gray-700 hover:text-indigo-600">控制台</a> <a href="/auth/login" class="text-gray-700 hover:text-indigo-600">登录</a> <a href="/auth/register" class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">注册</a> </div> </div> </div> </nav> <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"> ${renderSlot($$result, $$slots["default"])} </main> <footer class="bg-white border-t mt-auto"> <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"> <p class="text-center text-gray-500 text-sm">© 2025 iQuiz 保留所有权利</p> </div> </footer> </body></html>`;
}, "E:/project/iquiz/src/layouts/MainLayout.astro", void 0);

export { $$MainLayout as $ };

import { e as createComponent, n as renderHead, o as renderSlot, r as renderTemplate, h as createAstro } from './astro/server_CzcP1_xN.mjs';
import 'piccolore';
import 'clsx';
/* empty css                         */

const $$Astro = createAstro();
const $$AuthLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$AuthLayout;
  const { title = "iQuiz - \u767B\u5F55" } = Astro2.props;
  return renderTemplate`<html lang="zh-CN"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><title>${title}</title>${renderHead()}</head> <body class="min-h-screen bg-gray-50 flex items-center justify-center"> <div class="w-full max-w-md"> <div class="text-center mb-8"> <a href="/" class="text-3xl font-bold text-indigo-600">iQuiz</a> <p class="mt-2 text-gray-600">你的资料习题</p> </div> <div class="bg-white rounded-lg shadow-md p-8"> ${renderSlot($$result, $$slots["default"])} </div> </div> </body></html>`;
}, "E:/project/iquiz/src/layouts/AuthLayout.astro", void 0);

export { $$AuthLayout as $ };

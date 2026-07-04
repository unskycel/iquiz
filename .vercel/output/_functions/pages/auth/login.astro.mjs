import { e as createComponent, k as renderComponent, l as renderScript, r as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_CzcP1_xN.mjs';
import 'piccolore';
import { $ as $$AuthLayout } from '../../chunks/AuthLayout_DrOuRjRP.mjs';
export { renderers } from '../../renderers.mjs';

const $$Login = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "AuthLayout", $$AuthLayout, { "title": "iQuiz - \u767B\u5F55" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<h2 class="text-2xl font-bold text-center mb-6">登录</h2> <form id="login-form" class="space-y-4"> <div> <label for="email" class="block text-sm font-medium text-gray-700 mb-1">邮箱</label> <input type="email" id="email" name="email" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors" placeholder="your@email.com"> </div> <div> <label for="password" class="block text-sm font-medium text-gray-700 mb-1">密码</label> <input type="password" id="password" name="password" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors" placeholder="••••••••"> </div> <div class="flex items-center justify-between"> <label class="flex items-center"> <input type="checkbox" class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"> <span class="ml-2 text-sm text-gray-600">记住我</span> </label> <a href="/auth/reset" class="text-sm text-indigo-600 hover:text-indigo-500">忘记密码？</a> </div> <button type="submit" class="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium">
登录
</button> </form> <div class="mt-6 text-center"> <p class="text-gray-600">
还没有账号？
<a href="/auth/register" class="text-indigo-600 hover:text-indigo-500 font-medium">立即注册</a> </p> </div> <div class="mt-6"> <div class="relative"> <div class="absolute inset-0 flex items-center"> <div class="w-full border-t border-gray-300"></div> </div> <div class="relative flex justify-center text-sm"> <span class="px-2 bg-white text-gray-500">或者</span> </div> </div> <div class="mt-6 grid grid-cols-2 gap-3"> <button type="button" class="w-full border border-gray-300 rounded-lg py-2 px-4 hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"> <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"> <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"></path> </svg> <span>Google</span> </button> <button type="button" class="w-full border border-gray-300 rounded-lg py-2 px-4 hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"> <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"> <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path> </svg> <span>GitHub</span> </button> </div> </div> ` })} ${renderScript($$result, "E:/project/iquiz/src/pages/auth/login.astro?astro&type=script&index=0&lang.ts")}`;
}, "E:/project/iquiz/src/pages/auth/login.astro", void 0);

const $$file = "E:/project/iquiz/src/pages/auth/login.astro";
const $$url = "/auth/login";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Login,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };

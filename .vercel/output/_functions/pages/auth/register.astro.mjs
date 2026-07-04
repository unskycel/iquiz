import { e as createComponent, k as renderComponent, l as renderScript, r as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_CzcP1_xN.mjs';
import 'piccolore';
import { $ as $$AuthLayout } from '../../chunks/AuthLayout_DrOuRjRP.mjs';
export { renderers } from '../../renderers.mjs';

const $$Register = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "AuthLayout", $$AuthLayout, { "title": "iQuiz - \u6CE8\u518C" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<h2 class="text-2xl font-bold text-center mb-6">注册</h2> <form id="register-form" class="space-y-4"> <div> <label for="displayName" class="block text-sm font-medium text-gray-700 mb-1">用户名</label> <input type="text" id="displayName" name="displayName" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors" placeholder="你的用户名"> </div> <div> <label for="email" class="block text-sm font-medium text-gray-700 mb-1">邮箱</label> <input type="email" id="email" name="email" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors" placeholder="your@email.com"> </div> <div> <label for="password" class="block text-sm font-medium text-gray-700 mb-1">密码</label> <input type="password" id="password" name="password" required minlength="8" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors" placeholder="••••••••"> </div> <div> <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">确认密码</label> <input type="password" id="confirmPassword" name="confirmPassword" required minlength="8" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors" placeholder="••••••••"> </div> <div class="flex items-center"> <input type="checkbox" id="terms" required class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"> <label for="terms" class="ml-2 text-sm text-gray-600">
我已阅读并同意 <a href="/terms" class="text-indigo-600 hover:text-indigo-500">服务条款</a> 和 <a href="/privacy" class="text-indigo-600 hover:text-indigo-500">隐私政策</a> </label> </div> <button type="submit" class="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium">
注册
</button> </form> <div class="mt-6 text-center"> <p class="text-gray-600">
已有账号？
<a href="/auth/login" class="text-indigo-600 hover:text-indigo-500 font-medium">立即登录</a> </p> </div> ` })} ${renderScript($$result, "E:/project/iquiz/src/pages/auth/register.astro?astro&type=script&index=0&lang.ts")}`;
}, "E:/project/iquiz/src/pages/auth/register.astro", void 0);

const $$file = "E:/project/iquiz/src/pages/auth/register.astro";
const $$url = "/auth/register";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Register,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };

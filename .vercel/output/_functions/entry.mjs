import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_BKN62vH3.mjs';
import { manifest } from './manifest_DpXbVINN.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/auth/login.astro.mjs');
const _page2 = () => import('./pages/auth/register.astro.mjs');
const _page3 = () => import('./pages/dashboard.astro.mjs');
const _page4 = () => import('./pages/history.astro.mjs');
const _page5 = () => import('./pages/quiz/attempts/_id_.astro.mjs');
const _page6 = () => import('./pages/quiz/create.astro.mjs');
const _page7 = () => import('./pages/quiz/_id_/take.astro.mjs');
const _page8 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/auth/login.astro", _page1],
    ["src/pages/auth/register.astro", _page2],
    ["src/pages/dashboard.astro", _page3],
    ["src/pages/history.astro", _page4],
    ["src/pages/quiz/attempts/[id].astro", _page5],
    ["src/pages/quiz/create.astro", _page6],
    ["src/pages/quiz/[id]/take.astro", _page7],
    ["src/pages/index.astro", _page8]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "6a79d80e-61da-4bfd-bdac-4a4f33552983",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) ;

export { __astrojsSsrVirtualEntry as default, pageMap };

import 'piccolore';
import { p as decodeKey } from './chunks/astro/server_CzcP1_xN.mjs';
import 'clsx';
import { N as NOOP_MIDDLEWARE_FN } from './chunks/astro-designed-error-pages_CGW6f0FA.mjs';
import 'es-module-lexer';

function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.normalize().replace(/#/g, "%23").replace(/\?/g, "%3F")];
      }
      return [key, value];
    })
  );
}
function getParameter(part, params) {
  if (part.spread) {
    return params[part.content.slice(3)] || "";
  }
  if (part.dynamic) {
    if (!params[part.content]) {
      throw new TypeError(`Missing parameter: ${part.content}`);
    }
    return params[part.content];
  }
  return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]");
}
function getSegment(segment, params) {
  const segmentPath = segment.map((part) => getParameter(part, params)).join("");
  return segmentPath ? "/" + segmentPath : "";
}
function getRouteGenerator(segments, addTrailingSlash) {
  return (params) => {
    const sanitizedParams = sanitizeParams(params);
    let trailing = "";
    if (addTrailingSlash === "always" && segments.length) {
      trailing = "/";
    }
    const path = segments.map((segment) => getSegment(segment, sanitizedParams)).join("") + trailing;
    return path || "/";
  };
}

function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData(fallback);
    }),
    isIndex: rawRouteData.isIndex,
    origin: rawRouteData.origin
  };
}

function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const inlinedScripts = new Map(serializedManifest.inlinedScripts);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  const serverIslandNameMap = new Map(serializedManifest.serverIslandNameMap);
  const key = decodeKey(serializedManifest.key);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware() {
      return { onRequest: NOOP_MIDDLEWARE_FN };
    },
    ...serializedManifest,
    assets,
    componentMetadata,
    inlinedScripts,
    clientDirectives,
    routes,
    serverIslandNameMap,
    key
  };
}

const manifest = deserializeManifest({"hrefRoot":"file:///E:/project/iquiz/","cacheDir":"file:///E:/project/iquiz/node_modules/.astro/","outDir":"file:///E:/project/iquiz/dist/","srcDir":"file:///E:/project/iquiz/src/","publicDir":"file:///E:/project/iquiz/public/","buildClientDir":"file:///E:/project/iquiz/dist/client/","buildServerDir":"file:///E:/project/iquiz/dist/server/","adapterName":"@astrojs/vercel","routes":[{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"page","component":"_server-islands.astro","params":["name"],"segments":[[{"content":"_server-islands","dynamic":false,"spread":false}],[{"content":"name","dynamic":true,"spread":false}]],"pattern":"^\\/_server-islands\\/([^/]+?)\\/?$","prerender":false,"isIndex":false,"fallbackRoutes":[],"route":"/_server-islands/[name]","origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"endpoint","isIndex":false,"route":"/_image","pattern":"^\\/_image\\/?$","segments":[[{"content":"_image","dynamic":false,"spread":false}]],"params":[],"component":"node_modules/astro/dist/assets/endpoint/generic.js","pathname":"/_image","prerender":false,"fallbackRoutes":[],"origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/login.DzfcyXd5.css"}],"routeData":{"route":"/auth/login","isIndex":false,"type":"page","pattern":"^\\/auth\\/login\\/?$","segments":[[{"content":"auth","dynamic":false,"spread":false}],[{"content":"login","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/auth/login.astro","pathname":"/auth/login","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/login.DzfcyXd5.css"}],"routeData":{"route":"/auth/register","isIndex":false,"type":"page","pattern":"^\\/auth\\/register\\/?$","segments":[[{"content":"auth","dynamic":false,"spread":false}],[{"content":"register","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/auth/register.astro","pathname":"/auth/register","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/login.DzfcyXd5.css"}],"routeData":{"route":"/dashboard","isIndex":false,"type":"page","pattern":"^\\/dashboard\\/?$","segments":[[{"content":"dashboard","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/dashboard.astro","pathname":"/dashboard","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/login.DzfcyXd5.css"}],"routeData":{"route":"/history","isIndex":false,"type":"page","pattern":"^\\/history\\/?$","segments":[[{"content":"history","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/history.astro","pathname":"/history","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/login.DzfcyXd5.css"}],"routeData":{"route":"/quiz/attempts/[id]","isIndex":false,"type":"page","pattern":"^\\/quiz\\/attempts\\/([^/]+?)\\/?$","segments":[[{"content":"quiz","dynamic":false,"spread":false}],[{"content":"attempts","dynamic":false,"spread":false}],[{"content":"id","dynamic":true,"spread":false}]],"params":["id"],"component":"src/pages/quiz/attempts/[id].astro","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/login.DzfcyXd5.css"}],"routeData":{"route":"/quiz/create","isIndex":false,"type":"page","pattern":"^\\/quiz\\/create\\/?$","segments":[[{"content":"quiz","dynamic":false,"spread":false}],[{"content":"create","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/quiz/create.astro","pathname":"/quiz/create","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/login.DzfcyXd5.css"}],"routeData":{"route":"/quiz/[id]/take","isIndex":false,"type":"page","pattern":"^\\/quiz\\/([^/]+?)\\/take\\/?$","segments":[[{"content":"quiz","dynamic":false,"spread":false}],[{"content":"id","dynamic":true,"spread":false}],[{"content":"take","dynamic":false,"spread":false}]],"params":["id"],"component":"src/pages/quiz/[id]/take.astro","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/login.DzfcyXd5.css"}],"routeData":{"route":"/","isIndex":true,"type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}}],"base":"/","trailingSlash":"ignore","compressHTML":true,"componentMetadata":[["E:/project/iquiz/src/pages/auth/login.astro",{"propagation":"none","containsHead":true}],["E:/project/iquiz/src/pages/auth/register.astro",{"propagation":"none","containsHead":true}],["E:/project/iquiz/src/pages/dashboard.astro",{"propagation":"none","containsHead":true}],["E:/project/iquiz/src/pages/history.astro",{"propagation":"none","containsHead":true}],["E:/project/iquiz/src/pages/index.astro",{"propagation":"none","containsHead":true}],["E:/project/iquiz/src/pages/quiz/[id]/take.astro",{"propagation":"none","containsHead":true}],["E:/project/iquiz/src/pages/quiz/attempts/[id].astro",{"propagation":"none","containsHead":true}],["E:/project/iquiz/src/pages/quiz/create.astro",{"propagation":"none","containsHead":true}]],"renderers":[],"clientDirectives":[["idle","(()=>{var l=(n,t)=>{let i=async()=>{await(await n())()},e=typeof t.value==\"object\"?t.value:void 0,s={timeout:e==null?void 0:e.timeout};\"requestIdleCallback\"in window?window.requestIdleCallback(i,s):setTimeout(i,s.timeout||200)};(self.Astro||(self.Astro={})).idle=l;window.dispatchEvent(new Event(\"astro:idle\"));})();"],["load","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event(\"astro:load\"));})();"],["media","(()=>{var n=(a,t)=>{let i=async()=>{await(await a())()};if(t.value){let e=matchMedia(t.value);e.matches?i():e.addEventListener(\"change\",i,{once:!0})}};(self.Astro||(self.Astro={})).media=n;window.dispatchEvent(new Event(\"astro:media\"));})();"],["only","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event(\"astro:only\"));})();"],["visible","(()=>{var a=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value==\"object\"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let l of e)if(l.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=a;window.dispatchEvent(new Event(\"astro:visible\"));})();"]],"entryModules":{"\u0000@astro-page:src/pages/auth/login@_@astro":"pages/auth/login.astro.mjs","\u0000@astro-page:src/pages/auth/register@_@astro":"pages/auth/register.astro.mjs","\u0000@astro-page:src/pages/dashboard@_@astro":"pages/dashboard.astro.mjs","\u0000@astro-page:src/pages/history@_@astro":"pages/history.astro.mjs","\u0000@astro-page:src/pages/index@_@astro":"pages/index.astro.mjs","\u0000@astro-page:src/pages/quiz/[id]/take@_@astro":"pages/quiz/_id_/take.astro.mjs","\u0000@astro-page:src/pages/quiz/attempts/[id]@_@astro":"pages/quiz/attempts/_id_.astro.mjs","\u0000@astro-page:src/pages/quiz/create@_@astro":"pages/quiz/create.astro.mjs","\u0000@astrojs-ssr-virtual-entry":"entry.mjs","\u0000@astro-renderers":"renderers.mjs","\u0000noop-middleware":"_noop-middleware.mjs","\u0000virtual:astro:actions/noop-entrypoint":"noop-entrypoint.mjs","\u0000@astro-page:node_modules/astro/dist/assets/endpoint/generic@_@js":"pages/_image.astro.mjs","\u0000@astrojs-ssr-adapter":"_@astrojs-ssr-adapter.mjs","\u0000@astrojs-manifest":"manifest_DpXbVINN.mjs","E:/project/iquiz/node_modules/astro/dist/assets/services/sharp.js":"chunks/sharp_D7GRaTe6.mjs","E:/project/iquiz/src/components/react/AttemptResults":"_astro/AttemptResults.CrAx5UdA.js","E:/project/iquiz/src/components/react/Dashboard":"_astro/Dashboard.w1ogXZ2N.js","E:/project/iquiz/src/components/react/QuizEditor":"_astro/QuizEditor.pwGlPXyg.js","E:/project/iquiz/src/components/react/QuizHistory":"_astro/QuizHistory.DluQNEsV.js","E:/project/iquiz/src/components/react/QuizRunner":"_astro/QuizRunner.yceN0fm1.js","E:/project/iquiz/src/components/react/TestComponent":"_astro/TestComponent.CTazrBPv.js","@astrojs/react/client.js":"_astro/client.DMCHRjiH.js","E:/project/iquiz/src/pages/auth/login.astro?astro&type=script&index=0&lang.ts":"_astro/login.astro_astro_type_script_index_0_lang.7MwKciNX.js","E:/project/iquiz/src/pages/auth/register.astro?astro&type=script&index=0&lang.ts":"_astro/register.astro_astro_type_script_index_0_lang.BR6DEQ81.js","astro:scripts/before-hydration.js":""},"inlinedScripts":[["E:/project/iquiz/src/pages/auth/login.astro?astro&type=script&index=0&lang.ts","document.getElementById(\"login-form\")?.addEventListener(\"submit\",async e=>{e.preventDefault();const t=e.target,n=t.elements.namedItem(\"email\").value,m=t.elements.namedItem(\"password\").value;console.log(\"Login:\",{email:n,password:m})});"],["E:/project/iquiz/src/pages/auth/register.astro?astro&type=script&index=0&lang.ts","document.getElementById(\"register-form\")?.addEventListener(\"submit\",async t=>{t.preventDefault();const e=t.target,a=e.elements.namedItem(\"displayName\").value,m=e.elements.namedItem(\"email\").value,s=e.elements.namedItem(\"password\").value,n=e.elements.namedItem(\"confirmPassword\").value;if(s!==n){alert(\"两次输入的密码不一致\");return}console.log(\"Register:\",{displayName:a,email:m,password:s})});"]],"assets":["/_astro/login.DzfcyXd5.css","/favicon.svg","/_astro/AttemptResults.CrAx5UdA.js","/_astro/client.DMCHRjiH.js","/_astro/Dashboard.w1ogXZ2N.js","/_astro/index.B1L1bhxJ.js","/_astro/index.BCOEHr3l.js","/_astro/jsx-runtime.D_zvdyIk.js","/_astro/QuizEditor.pwGlPXyg.js","/_astro/QuizHistory.DluQNEsV.js","/_astro/QuizRunner.yceN0fm1.js","/_astro/TestComponent.CTazrBPv.js"],"buildFormat":"directory","checkOrigin":true,"allowedDomains":[],"actionBodySizeLimit":1048576,"serverIslandNameMap":[],"key":"Phf5UjOCxoj1jP6nzms0VRVYmj4LCp5zx/6XNaZUX3s="});
if (manifest.sessionConfig) manifest.sessionConfig.driverModule = null;

export { manifest };

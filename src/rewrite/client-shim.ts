import { encodeTarget } from "../codec.js";

/**
 * Routes runtime fetch/XHR calls through the same proxy path as rewritten HTML.
 * It intentionally does not attempt to bypass target-site access controls.
 */
export function clientShim(targetUrl: string, prefix = "/proxy"): string {
  const targetToken = encodeTarget(targetUrl);
  return `<script>(function(){
const base=atob("${Buffer.from(targetUrl, "utf8").toString("base64")}");
const prefix="${prefix}";
const skip=/^(data:|blob:|about:|javascript:|mailto:|tel:|#)/i;
if("serviceWorker" in navigator)navigator.serviceWorker.register("/prism-sw.js",{scope:"/"}).then(function(registration){function send(){(navigator.serviceWorker.controller||registration.active)?.postMessage({type:"prism-target",base:base})}send();navigator.serviceWorker.addEventListener("controllerchange",send)}).catch(function(){});
function token(value){return btoa(unescape(encodeURIComponent(value))).replace(/\\+/g,"-").replace(/\\//g,"_").replace(/=+$/,"")}
function route(value){if(typeof value!=="string"||skip.test(value)||value.indexOf(prefix)===0)return value;try{const resolved=new URL(value,base);if(resolved.origin===location.origin&&resolved.pathname===prefix&&resolved.searchParams.has("__prism"))return resolved.pathname+resolved.search+resolved.hash;return prefix+"?__prism="+encodeURIComponent(token(resolved.href))}catch{return value}}
window.__prismNavigate=function(value){location.replace(route(value))};
function routeForm(form){const action=form.getAttribute("action");if(!action){form.action=prefix+"?__prism="+encodeURIComponent(token(base));return}if(action.indexOf(prefix)!==0)form.action=route(action)}
document.addEventListener("submit",function(event){if(event.target instanceof HTMLFormElement)routeForm(event.target)},true);
const submit=HTMLFormElement.prototype.submit;
HTMLFormElement.prototype.submit=function(){routeForm(this);return submit.call(this)};
const requestSubmit=HTMLFormElement.prototype.requestSubmit;
if(requestSubmit)HTMLFormElement.prototype.requestSubmit=function(){routeForm(this);return requestSubmit.apply(this,arguments)};
const nativeFetch=window.fetch.bind(window);
window.fetch=function(input,init){if(input instanceof Request){return nativeFetch(new Request(route(input.url),input),init)}return nativeFetch(route(input),init)};
const open=XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open=function(method,url){const args=Array.prototype.slice.call(arguments);args[1]=route(url);return open.apply(this,args)};
window.__PRISM_TARGET__="${targetToken}";
})();</script>`;
}
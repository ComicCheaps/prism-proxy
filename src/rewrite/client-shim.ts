import { encodeTarget } from "../codec.js";

/**
 * Routes runtime fetch/XHR calls through the same proxy path as rewritten HTML.
 * It intentionally does not attempt to bypass target-site access controls.
 */
export function clientShim(targetUrl: string, prefix = "/proxy/"): string {
  const targetToken = encodeTarget(targetUrl);
  return `<script>(function(){
const base=atob("${Buffer.from(targetUrl, "utf8").toString("base64")}");
const prefix="${prefix}";
const skip=/^(data:|blob:|about:|javascript:|mailto:|tel:|#)/i;
function token(value){return btoa(unescape(encodeURIComponent(value))).replace(/\\+/g,"-").replace(/\\//g,"_").replace(/=+$/,"")}
function route(value){if(typeof value!=="string"||skip.test(value)||value.indexOf(prefix)===0)return value;try{return prefix+token(new URL(value,base).href)}catch{return value}}
const nativeFetch=window.fetch.bind(window);
window.fetch=function(input,init){if(input instanceof Request){return nativeFetch(new Request(route(input.url),input),init)}return nativeFetch(route(input),init)};
const open=XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open=function(method,url){const args=Array.prototype.slice.call(arguments);args[1]=route(url);return open.apply(this,args)};
window.__PRISM_TARGET__="${targetToken}";
})();</script>`;
}
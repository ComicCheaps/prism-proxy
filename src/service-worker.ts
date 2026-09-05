export const SERVICE_WORKER = `const bases = new Map();
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("message", (event) => {
  if (event.data?.type === "prism-target" && event.source?.id) bases.set(event.source.id, event.data.base);
});
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const base = bases.get(event.clientId);
  const requestUrl = new URL(event.request.url);
  const internal = ["/", "/go", "/proxy", "/health", "/prism-sw.js"];
  if (!base || requestUrl.origin !== self.location.origin || internal.includes(requestUrl.pathname)) return;
  const target = new URL(requestUrl.pathname + requestUrl.search, base);
  const token = btoa(unescape(encodeURIComponent(target.href))).replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/, "");
  event.respondWith(fetch("/proxy?__prism=" + encodeURIComponent(token), event.request));
});`;
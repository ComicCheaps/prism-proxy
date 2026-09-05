import type { FastifyInstance, FastifyReply } from "fastify";
import { Agent, request as upstreamRequest } from "undici";
import { gunzipSync, inflateSync, brotliDecompressSync } from "node:zlib";
import { randomUUID } from "node:crypto";
import { decodeTarget, encodeTarget } from "./codec.js";
import { SessionCookieJar } from "./cookie-jar.js";
import { TargetSessionStore } from "./target-session.js";
import type { ProxyConfig } from "./config.js";
import { rewriteCss } from "./rewrite/css.js";
import { rewriteLocation, sanitizeResponseHeaders } from "./rewrite/headers.js";
import { rewriteHtml } from "./rewrite/html.js";
import { LANDING_PAGE } from "./landing.js";
import { SERVICE_WORKER } from "./service-worker.js";
import { isUnsupportedHost, unsupportedPage } from "./unsupported.js";
import { resolveStartTarget } from "./start-target.js";

// Reuse TCP/TLS connections to origin servers instead of handshaking per asset.
const upstreamAgent = new Agent({
  keepAliveTimeout: 10_000,
  keepAliveMaxTimeout: 60_000,
  connections: 128,
});
const cookieJar = new SessionCookieJar();
const targetSessions = new TargetSessionStore();

export function registerProxyRoutes(app: FastifyInstance, config: ProxyConfig): void {
  app.get("/", (_req, reply) => reply.type("text/html").send(LANDING_PAGE));
  app.get("/health", (_req, reply) => reply.send({ status: "ok" }));
  app.get("/prism-sw.js", (_req, reply) =>
    reply
      .header("cache-control", "no-cache")
      .type("application/javascript; charset=utf-8")
      .send(SERVICE_WORKER),
  );

  // Landing-page form target: normalize the user's input and bounce to a token URL.
  app.get("/go", (req, reply) => {
    const { url } = req.query as { url?: string };
    if (!url) return reply.code(400).send({ error: "Missing ?url=" });
    const normalized = resolveStartTarget(url);
    try {
      new URL(normalized);
    } catch {
      return reply.code(400).send({ error: "Invalid URL" });
    }
    return reply.redirect(`/proxy?__prism=${encodeURIComponent(encodeTarget(normalized))}`);
  });

  // Handles both GET and POST so forms (Wikipedia search, login boxes) work.
  app.route({
    method: ["GET", "POST"],
    url: "/proxy",
    handler: async (req, reply) => {
    const sessionId = readSessionId(req.headers.cookie) ?? randomUUID();
    reply.header("set-cookie", `prism_sid=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`);
    const query = req.query as Record<string, string | string[] | undefined>;
    const browserQuery = { ...query };
    delete browserQuery.__prism;
    const token = findProxyToken(query, req.headers.referer);

    let target: URL;
    try {
      const targetUrl = token ? decodeTarget(token) : targetSessions.get(sessionId);
      if (!targetUrl) throw new Error("Missing proxy URL");
      target = new URL(targetUrl);
    } catch {
      return reply.code(400).send({ error: "Invalid proxy token" });
    }
    if (target.protocol !== "http:" && target.protocol !== "https:") {
      return reply.code(400).send({ error: "Only http(s) URLs can be proxied" });
    }
    if (isUnsupportedHost(target.hostname)) {
      return reply.type("text/html").send(unsupportedPage(target.hostname));
    }
    if (isBlocked(target.hostname, config)) {
      return reply.code(403).send({ error: "That host is not allowed" });
    }

    // Google navigates to a same-origin /proxy URL without its form action
    // token. The session fallback points to Google home, but search fields
    // belong on /search rather than /.
    if (!query.__prism && isGoogleHomeSearch(target, browserQuery)) {
      target.pathname = "/search";
      target.search = "";
    }
    // Carry the browser's query string onto the target — forms that submit via
    // GET (and search URLs like ?search=foo) depend on it.
    for (const [key, value] of Object.entries(browserQuery)) {
      if (typeof value === "string") target.searchParams.append(key, value);
      if (Array.isArray(value)) {
        for (const entry of value) target.searchParams.append(key, entry);
      }
    }

    let upstream;
    try {
      // We advertise gzip/deflate/br so origins send small bodies, then
      // decompress ourselves only when we need to rewrite. undici doesn't
      // follow redirects, so 3xx responses reach us and their Location header
      // gets rewritten to stay inside the proxy.
      const isPost = req.method === "POST";
      const contentType = String(req.headers["content-type"] ?? "");
      const headers: Record<string, string> = {
        "user-agent": req.headers["user-agent"] ?? "prism-proxy/0.1",
        accept: req.headers.accept ?? "*/*",
        "accept-encoding": "gzip, deflate, br",
        "accept-language": req.headers["accept-language"] ?? "en-US,en;q=0.9",
        referer: target.origin + "/",
      };
      if (req.headers.range) headers.range = req.headers.range;
      const cookies = cookieJar.getHeader(sessionId, target);
      if (cookies) headers.cookie = cookies;
      let body: string | undefined;
      if (isPost && contentType.includes("application/x-www-form-urlencoded")) {
        headers["content-type"] = contentType;
        body = req.body ? new URLSearchParams(req.body as Record<string, string>).toString() : undefined;
      } else if (isPost && req.body) {
        headers["content-type"] = contentType;
        body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
      }
      upstream = await upstreamRequest(target, {
        method: req.method,
        dispatcher: upstreamAgent,
        headers,
        body,
      });
    } catch (err) {
      req.log.warn({ err, target: target.href }, "upstream fetch failed");
      return reply.code(502).send({ error: `Could not reach ${target.host}` });
    }
    cookieJar.store(sessionId, target, upstream.headers["set-cookie"]);

    const contentType = String(upstream.headers["content-type"] ?? "");
    const encoding = String(upstream.headers["content-encoding"] ?? "").toLowerCase();
    const needsRewrite =
      contentType.includes("text/html") || contentType.includes("text/css");

    if (needsRewrite) {
      if (contentType.includes("text/html") && isDocumentRequest(req.headers)) {
        targetSessions.set(sessionId, target);
      }
      const headers = sanitizeResponseHeaders(upstream.headers, true);
      headers["cache-control"] = "no-store";
      const location = rewriteLocation(headers["location"], target);
      if (location) headers["location"] = location;
      reply.code(upstream.statusCode).headers(headers);
      let body: string;
      try {
        body = decodeBody(await upstream.body.arrayBuffer(), encoding);
      } catch (err) {
        req.log.warn({ err, encoding }, "decompression failed");
        return reply.code(502).send({ error: "Failed to decode upstream response" });
      }
      const rewritten = contentType.includes("text/html")
        ? rewriteHtml(body, target.href)
        : rewriteCss(body, target.href);
      return reply.send(rewritten);
    }
    // Everything else (images, fonts, media) streams straight through
    // compressed, untouched, with its original content-encoding header.
    const headers = sanitizeResponseHeaders(upstream.headers);
    const location = rewriteLocation(headers["location"], target);
    if (location) headers["location"] = location;
    reply.code(upstream.statusCode).headers(headers);
    return reply.send(upstream.body);
    },
  });
}

function decodeBody(buf: ArrayBuffer, encoding: string): string {
  const bytes = Buffer.from(buf);
  if (encoding === "gzip") return gunzipSync(bytes).toString("utf8");
  if (encoding === "deflate") return inflateSync(bytes).toString("utf8");
  if (encoding === "br") return brotliDecompressSync(bytes).toString("utf8");
  return bytes.toString("utf8");
}

/**
 * Some sites replace a form action after the document is rewritten. If that
 * form submits to /proxy without our token, the originating proxy URL remains
 * in Referer and gives us the intended target without trusting form fields.
 */
export function findProxyToken(
  query: Record<string, string | string[] | undefined>,
  referer: string | undefined,
): string | undefined {
  const direct = query.__prism;
  if (typeof direct === "string") return direct;
  // Older rewritten documents used `url` for the token. Only accept it when it
  // decodes to a web URL, so an ordinary target-site field named `url` cannot
  // be mistaken for proxy state.
  const legacy = query.url;
  if (typeof legacy === "string" && isWebToken(legacy)) return legacy;
  if (!referer) return undefined;
  try {
    const source = new URL(referer);
    return source.searchParams.get("__prism") ?? source.searchParams.get("url") ?? undefined;
  } catch {
    return undefined;
  }
}

function isWebToken(token: string): boolean {
  try {
    const url = new URL(decodeTarget(token));
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function readSessionId(cookieHeader: string | undefined): string | undefined {
  const match = cookieHeader?.match(/(?:^|;\s*)prism_sid=([^;]+)/);
  return match?.[1];
}

export function isGoogleHomeSearch(
  target: URL,
  query: Record<string, string | string[] | undefined>,
): boolean {
  return (
    (target.hostname === "www.google.com" || target.hostname.endsWith(".google.com")) &&
    (target.pathname === "/" || target.pathname === "/webhp") &&
    typeof query.q === "string" &&
    query.q.length > 0
  );
}

function isDocumentRequest(headers: Record<string, string | string[] | undefined>): boolean {
  const destination = headers["sec-fetch-dest"];
  const accept = headers.accept;
  return destination === "document" || (destination === undefined && String(accept).includes("text/html"));
}

function isBlocked(hostname: string, config: ProxyConfig): boolean {
  const host = hostname.toLowerCase();
  return config.blocklist.some((b) => host === b || host.endsWith(`.${b}`));
}

export type { FastifyReply };

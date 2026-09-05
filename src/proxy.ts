import type { FastifyInstance, FastifyReply } from "fastify";
import { Agent, request as upstreamRequest } from "undici";
import { gunzipSync, inflateSync, brotliDecompressSync } from "node:zlib";
import { decodeTarget, encodeTarget } from "./codec.js";
import type { ProxyConfig } from "./config.js";
import { rewriteCss } from "./rewrite/css.js";
import { rewriteLocation, sanitizeResponseHeaders } from "./rewrite/headers.js";
import { rewriteHtml } from "./rewrite/html.js";
import { LANDING_PAGE } from "./landing.js";

// Reuse TCP/TLS connections to origin servers instead of handshaking per asset.
const upstreamAgent = new Agent({
  keepAliveTimeout: 10_000,
  keepAliveMaxTimeout: 60_000,
  connections: 128,
});

export function registerProxyRoutes(app: FastifyInstance, config: ProxyConfig): void {
  app.get("/", (_req, reply) => reply.type("text/html").send(LANDING_PAGE));
  app.get("/health", (_req, reply) => reply.send({ status: "ok" }));

  // Landing-page form target: normalize the user's input and bounce to a token URL.
  app.get("/go", (req, reply) => {
    const { url } = req.query as { url?: string };
    if (!url) return reply.code(400).send({ error: "Missing ?url=" });
    const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
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
    const { __prism: token, ...browserQuery } = req.query as Record<string, string | undefined>;

    let target: URL;
    try {
      if (!token) throw new Error("Missing proxy URL");
      target = new URL(decodeTarget(token));
    } catch {
      return reply.code(400).send({ error: "Invalid proxy token" });
    }
    if (target.protocol !== "http:" && target.protocol !== "https:") {
      return reply.code(400).send({ error: "Only http(s) URLs can be proxied" });
    }
    if (isBlocked(target.hostname, config)) {
      return reply.code(403).send({ error: "That host is not allowed" });
    }

    // Carry the browser's query string onto the target — forms that submit via
    // GET (and search URLs like ?search=foo) depend on it.
    for (const [key, value] of Object.entries(browserQuery)) {
      if (value !== undefined) target.searchParams.append(key, value);
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

    const contentType = String(upstream.headers["content-type"] ?? "");
    const encoding = String(upstream.headers["content-encoding"] ?? "").toLowerCase();
    const needsRewrite =
      contentType.includes("text/html") || contentType.includes("text/css");

    if (needsRewrite) {
      const headers = sanitizeResponseHeaders(upstream.headers, true);
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

function isBlocked(hostname: string, config: ProxyConfig): boolean {
  const host = hostname.toLowerCase();
  return config.blocklist.some((b) => host === b || host.endsWith(`.${b}`));
}

export type { FastifyReply };

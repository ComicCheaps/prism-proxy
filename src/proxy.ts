import type { FastifyInstance, FastifyReply } from "fastify";
import { Agent, request as upstreamRequest } from "undici";
import { gunzipSync, inflateSync, brotliDecompressSync } from "node:zlib";
import { decodeTarget, encodeTarget } from "./codec.js";
import type { ProxyConfig } from "./config.js";
import { rewriteCss } from "./rewrite/css.js";
import { rewriteLocation, sanitizeResponseHeaders } from "./rewrite/headers.js";
import { rewriteHtml } from "./rewrite/html.js";

// Reuse TCP/TLS connections to origin servers instead of handshaking per asset.
const upstreamAgent = new Agent({
  keepAliveTimeout: 10_000,
  keepAliveMaxTimeout: 60_000,
  connections: 128,
});

const LANDING_PAGE = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>prism-proxy</title>
    <style>
      body { font-family: system-ui, sans-serif; display: grid; place-items: center; min-height: 100vh; margin: 0; background: #111827; color: #e5e7eb; }
      form { display: flex; gap: 0.5rem; width: min(90vw, 560px); }
      input { flex: 1; padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid #374151; background: #1f2937; color: inherit; font-size: 1rem; }
      button { padding: 0.75rem 1.25rem; border-radius: 8px; border: 0; background: #6366f1; color: white; font-size: 1rem; cursor: pointer; }
    </style>
  </head>
  <body>
    <form action="/go" method="get">
      <input name="url" type="text" placeholder="https://example.com" required autofocus />
      <button type="submit">Go</button>
    </form>
  </body>
</html>`;

export function registerProxyRoutes(app: FastifyInstance, config: ProxyConfig): void {
  app.get("/", (_req, reply) => reply.type("text/html").send(LANDING_PAGE));

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
    return reply.redirect(`/proxy/${encodeTarget(normalized)}`);
  });

  // Handles both GET and POST so forms (Wikipedia search, login boxes) work.
  app.route({
    method: ["GET", "POST"],
    url: "/proxy/:token",
    handler: async (req, reply) => {
    const { token } = req.params as { token: string };

    let target: URL;
    try {
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
    const browserQuery = req.url.split("?")[1];
    if (browserQuery) {
      const extra = new URLSearchParams(browserQuery);
      for (const [k, v] of extra) target.searchParams.append(k, v);
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

    const headers = sanitizeResponseHeaders(upstream.headers);
    const location = rewriteLocation(headers["location"], target);
    if (location) headers["location"] = location;
    reply.code(upstream.statusCode).headers(headers);

    const contentType = String(upstream.headers["content-type"] ?? "");
    const encoding = String(upstream.headers["content-encoding"] ?? "").toLowerCase();
    const needsRewrite =
      contentType.includes("text/html") || contentType.includes("text/css");

    if (needsRewrite) {
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

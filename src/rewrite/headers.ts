import { encodeTarget } from "../codec.js";

/**
 * Headers that would break proxied browsing (framing/CSP), pin the browser
 * to the origin (HSTS), or are wrong once we transform the body.
 */
const STRIPPED_RESPONSE_HEADERS = new Set([
  "content-security-policy",
  "content-security-policy-report-only",
  "x-frame-options",
  "strict-transport-security",
  "cross-origin-opener-policy",
  "cross-origin-embedder-policy",
  "cross-origin-resource-policy",
  "transfer-encoding",
  "connection",
]);

// Forwarded as-is; everything else hop-by-hop or identity-related is dropped.
const ALLOWED_RESPONSE_HEADERS = new Set([
  "content-type",
  "cache-control",
  "etag",
  "last-modified",
  "expires",
  "location",
  "set-cookie",
  "www-authenticate",
  "vary",
  "age",
  "date",
  "content-length",
  "content-encoding",
  "content-range",
  "accept-ranges",
  "content-disposition",
]);

export function sanitizeResponseHeaders(
  headers: Record<string, string | string[] | undefined>,
  transformed = false,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined) continue;
    const name = key.toLowerCase();
    if (STRIPPED_RESPONSE_HEADERS.has(name)) continue;
    if (transformed && (name === "content-length" || name === "content-encoding")) continue;
    if (!ALLOWED_RESPONSE_HEADERS.has(name)) continue;
    // NOTE: joining set-cookie like this is wrong for multi-cookie responses;
    // the per-session cookie jar (v0.2) will replace this entirely.
    out[name] = Array.isArray(value) ? value.join(", ") : String(value);
  }
  return out;
}

/** Rewrites a `Location` header so redirects stay inside the proxy. */
export function rewriteLocation(location: string | undefined, base: URL): string | undefined {
  if (!location) return undefined;
  try {
    const absolute = new URL(location, base);
    return `/proxy?__prism=${encodeURIComponent(encodeTarget(absolute.href))}`;
  } catch {
    return undefined;
  }
}

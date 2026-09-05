import * as cheerio from "cheerio";
import { encodeTarget } from "../codec.js";
import { clientShim } from "./client-shim.js";

const URL_ATTRS: ReadonlyArray<readonly [string, string]> = [
  ["a", "href"],
  ["link", "href"],
  ["img", "src"],
  ["script", "src"],
  ["iframe", "src"],
  ["frame", "src"],
  ["embed", "src"],
  ["form", "action"],
  ["video", "src"],
  ["video", "poster"],
  ["audio", "src"],
  ["source", "src"],
  ["track", "src"],
  ["area", "href"],
  // Deliberately no ["base", "href"]: we inject our own <base> pointing at the
  // true origin, and rewriting it would pin the page to a /proxy/ self-loop.
];

const SRCSET_ATTRS: ReadonlyArray<readonly [string, string]> = [
  ["img", "srcset"],
  ["source", "srcset"],
];

const SKIP_PREFIXES = ["data:", "javascript:", "mailto:", "tel:", "blob:", "about:"];

/** Resolves `value` against the page's base URL and routes it through the proxy. */
export function proxifyUrl(value: string, baseUrl: string, prefix = "/proxy"): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith("#")) return value;
  if (SKIP_PREFIXES.some((p) => trimmed.toLowerCase().startsWith(p))) return value;
  // Protocol-relative URLs inherit the page's scheme.
  const resolved = trimmed.startsWith("//")
    ? `${new URL(baseUrl).protocol}${trimmed}`
    : trimmed;
  try {
    return `${prefix}?url=${encodeURIComponent(encodeTarget(new URL(resolved, baseUrl).href))}`;
  } catch {
    return value;
  }
}

/** Rewrites every candidate in a `srcset` attribute, preserving descriptors. */
export function rewriteSrcset(value: string, baseUrl: string, prefix = "/proxy"): string {
  return value
    .split(",")
    .map((candidate) => {
      const parts = candidate.trim().split(/\s+/);
      if (!parts[0]) return candidate;
      parts[0] = proxifyUrl(parts[0], baseUrl, prefix);
      return parts.join(" ");
    })
    .join(", ");
}

export function rewriteHtml(html: string, baseUrl: string, prefix = "/proxy"): string {
  const $ = cheerio.load(html);

  for (const [tag, attr] of URL_ATTRS) {
    $(tag).each((_i, el) => {
      const current = $(el).attr(attr);
      if (current) $(el).attr(attr, proxifyUrl(current, baseUrl, prefix));
    });
  }

  // Browsers submit a form without an action to the current proxy URL. Send
  // those forms to the equivalent target URL instead, preserving their method.
  $("form:not([action])").attr("action", `${prefix}?url=${encodeURIComponent(encodeTarget(baseUrl))}`);

  // Must run before the page's own scripts so dynamically created API requests
  // resolve against the target URL and route back through Prism.
  if ($("head").length) $("head").prepend(clientShim(baseUrl, prefix));

  for (const [tag, attr] of SRCSET_ATTRS) {
    $(tag).each((_i, el) => {
      const current = $(el).attr(attr);
      if (current) $(el).attr(attr, rewriteSrcset(current, baseUrl, prefix));
    });
  }

  // <meta http-equiv="refresh" content="5; url=https://...">
  $('meta[http-equiv="refresh"]').each((_i, el) => {
    const content = $(el).attr("content");
    if (!content) return;
    const match = content.match(/^(.*?url=)(.+)$/i);
    if (match) $(el).attr("content", match[1] + proxifyUrl(match[2], baseUrl, prefix));
  });

  // Subresource integrity hashes never match rewritten/rerouted assets.
  $("[integrity]").removeAttr("integrity");

  return $.html();
}

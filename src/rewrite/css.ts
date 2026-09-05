import { proxifyUrl } from "./html.js";

/**
 * Rewrites `url(...)` and `@import` references in stylesheets.
 * Deliberately regex-based for now — a real CSS parser is on the roadmap
 * once the fixture test suite documents the edge cases.
 */
export function rewriteCss(css: string, baseUrl: string, prefix = "/proxy"): string {
  const withUrls = css.replace(
    /url\(\s*(["']?)([^"')]+)\1\s*\)/g,
    (_match, quote: string, raw: string) =>
      `url(${quote}${proxifyUrl(raw, baseUrl, prefix)}${quote})`,
  );
  return withUrls.replace(
    /@import\s+(["'])([^"']+)\1/g,
    (_match, quote: string, raw: string) =>
      `@import ${quote}${proxifyUrl(raw, baseUrl, prefix)}${quote}`,
  );
}

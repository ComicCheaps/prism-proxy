import { describe, expect, it } from "vitest";
import { decodeTarget } from "../src/codec.js";
import { rewriteLocation, sanitizeResponseHeaders } from "../src/rewrite/headers.js";

describe("sanitizeResponseHeaders", () => {
  it("preserves encoding and range metadata for streamed assets", () => {
    const headers = sanitizeResponseHeaders({
      "content-encoding": "br",
      "content-length": "2084",
      "content-range": "bytes 0-2083/10000",
      "accept-ranges": "bytes",
      "content-type": "image/webp",
    });
    expect(headers).toMatchObject({
      "content-encoding": "br",
      "content-length": "2084",
      "content-range": "bytes 0-2083/10000",
      "accept-ranges": "bytes",
    });
  });

  it("drops stale content metadata for rewritten bodies", () => {
    const headers = sanitizeResponseHeaders({
      "content-encoding": "gzip",
      "content-length": "99",
      "cache-control": "public, max-age=3600",
      etag: "origin-version",
    }, true);
    expect(headers).not.toHaveProperty("content-encoding");
    expect(headers).not.toHaveProperty("content-length");
    expect(headers).not.toHaveProperty("cache-control");
    expect(headers).not.toHaveProperty("etag");
  });
});

describe("rewriteLocation", () => {
  it("uses a query-based proxy URL for long redirect targets", () => {
    const location = rewriteLocation("/next?" + "a=".repeat(1000), new URL("https://example.com"));
    const token = new URL(`https://prism.test${location}`).searchParams.get("__prism");
    expect(token).toBeTruthy();
    expect(decodeTarget(token as string)).toMatch(/^https:\/\/example\.com\/next\?/);
  });
});
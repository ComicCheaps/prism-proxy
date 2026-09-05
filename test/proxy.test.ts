import { describe, expect, it } from "vitest";
import { encodeTarget } from "../src/codec.js";
import { findProxyToken, isGoogleHomeSearch } from "../src/proxy.js";

describe("findProxyToken", () => {
  it("uses the reserved query parameter", () => {
    const token = encodeTarget("https://www.google.com/search?q=prism");
    expect(findProxyToken({ __prism: token }, undefined)).toBe(token);
  });

  it("recovers a target from the proxy page referrer", () => {
    const token = encodeTarget("https://en.wikipedia.org/wiki/Main_Page");
    const referer = `http://localhost:3000/proxy?__prism=${token}`;
    expect(findProxyToken({ search: "proxy" }, referer)).toBe(token);
  });

  it("does not mistake an ordinary url field for a proxy token", () => {
    expect(findProxyToken({ url: "https://example.com" }, undefined)).toBeUndefined();
  });

  it("accepts valid legacy url tokens from cached Prism pages", () => {
    const token = encodeTarget("https://www.google.com/search");
    expect(findProxyToken({ url: token, q: "proxy" }, undefined)).toBe(token);
  });

  it("recognizes a tokenless Google home-page search", () => {
    expect(isGoogleHomeSearch(new URL("https://www.google.com/"), { q: "wikipedia" })).toBe(true);
    expect(isGoogleHomeSearch(new URL("https://www.google.com/"), { q: "" })).toBe(false);
    expect(isGoogleHomeSearch(new URL("https://example.com/"), { q: "wikipedia" })).toBe(false);
  });
});
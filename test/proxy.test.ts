import { describe, expect, it } from "vitest";
import { encodeTarget } from "../src/codec.js";
import { findProxyToken } from "../src/proxy.js";

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
});
import { describe, expect, it } from "vitest";
import { decodeTarget, encodeTarget } from "../src/codec.js";

describe("codec", () => {
  it("round-trips URLs", () => {
    const url = "https://example.com/path?q=1&x=2#frag";
    expect(decodeTarget(encodeTarget(url))).toBe(url);
  });

  it("produces URL-safe tokens", () => {
    expect(encodeTarget("https://example.com/+/?==")).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

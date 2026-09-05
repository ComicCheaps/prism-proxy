import { describe, expect, it } from "vitest";
import { resolveStartTarget } from "../src/start-target.js";

describe("resolveStartTarget", () => {
  it("uses DuckDuckGo for ordinary search text", () => {
    expect(resolveStartTarget("coolmath games")).toBe(
      "https://html.duckduckgo.com/html/?q=coolmath%20games",
    );
  });

  it("preserves a full URL", () => {
    expect(resolveStartTarget("https://example.com/docs")).toBe("https://example.com/docs");
  });

  it("recognizes bare domains as direct navigation", () => {
    expect(resolveStartTarget("coolmathgames.com")).toBe("https://coolmathgames.com");
  });
});
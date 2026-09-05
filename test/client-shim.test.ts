import { describe, expect, it } from "vitest";
import { clientShim } from "../src/rewrite/client-shim.js";

describe("clientShim", () => {
  it("preserves absolute URLs that already target Prism", () => {
    const shim = clientShim("https://www.google.com/search");
    expect(shim).toContain("resolved.origin===location.origin");
    expect(shim).toContain('resolved.searchParams.has("__prism")');
  });

  it("installs a capture-phase form submit handler", () => {
    expect(clientShim("https://en.wikipedia.org/wiki/Main_Page")).toContain(
      'document.addEventListener("submit"',
    );
  });

  it("routes programmatic native form submissions", () => {
    const shim = clientShim("https://www.google.com/");
    expect(shim).toContain("HTMLFormElement.prototype.submit=function()");
    expect(shim).toContain("HTMLFormElement.prototype.requestSubmit=function()");
  });

  it("provides a same-tab Prism navigation function", () => {
    expect(clientShim("https://duckduckgo.com/")).toContain("window.__prismNavigate=function(value)");
  });
});
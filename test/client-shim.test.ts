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

  it("routes dynamically created links and popup requests", () => {
    const shim = clientShim("https://www.coolmathgames.com/");
    expect(shim).toContain("new MutationObserver");
    expect(shim).toContain("window.open=function(url)");
    expect(shim).toContain("event.target.closest");
  });

  it("routes dynamically assigned game-frame URLs through Prism", () => {
    const shim = clientShim("https://www.coolmathgames.com/");
    expect(shim).toContain("function routeFrame(frame)");
    expect(shim).toContain('[id=html5game][src]');
    expect(shim).toContain('attributeFilter:["src"]');
  });

  it("rewrites frame src assignments before frames load", () => {
    const shim = clientShim("https://www.coolmathgames.com/");
    expect(shim).toContain("Element.prototype.setAttribute=function(name,value)");
    expect(shim).toContain('Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype,"src")');
  });
});
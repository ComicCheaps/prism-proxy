import { describe, expect, it } from "vitest";
import { decodeTarget } from "../src/codec.js";
import { rewriteCss } from "../src/rewrite/css.js";
import { rewriteHtml } from "../src/rewrite/html.js";

const BASE = "https://example.com/articles/index.html";

function firstToken(output: string): string {
  const token = output.match(/\/proxy\?__prism=([A-Za-z0-9_-]+)/)?.[1];
  expect(token, "expected a /proxy?__prism= token in output").toBeDefined();
  return token as string;
}

describe("rewriteHtml", () => {
  it("rewrites relative links against the base URL", () => {
    const out = rewriteHtml(`<a href="../about">About</a>`, BASE);
    expect(decodeTarget(firstToken(out))).toBe("https://example.com/about");
  });

  it("removes target base URLs so Prism paths keep the proxy origin", () => {
    const out = rewriteHtml(`<base href="https://example.com/"><script src="/game.js"></script>`, BASE);
    expect(out).not.toContain("<base");
    expect(decodeTarget(firstToken(out))).toBe("https://example.com/game.js");
  });

  it("keeps rewritten new-tab links in the current Prism tab", () => {
    const out = rewriteHtml(`<a href="https://coolmathgames.com" target="_blank">Games</a>`, BASE);
    expect(out).not.toContain("target=\"_blank\"");
    expect(decodeTarget(firstToken(out))).toBe("https://coolmathgames.com/");
  });

  it("keeps inline location redirects inside Prism", () => {
    const out = rewriteHtml(
      `<script>window.parent.location.replace("https://coolmathgames.com")</script>`,
      BASE,
    );
    expect(out).toContain('window.__prismNavigate("https://coolmathgames.com")');
    expect(out).not.toContain("window.parent.location.replace");
  });

  it("leaves data:, javascript:, and fragment URLs alone", () => {
    const out = rewriteHtml(
      `<img src="data:image/png;base64,AAAA"><a href="#top">top</a><a href="javascript:void(0)">x</a>`,
      BASE,
    );
    expect(out).toContain("data:image/png;base64,AAAA");
    expect(out).toContain('href="#top"');
    expect(out).toContain("javascript:void(0)");
  });

  it("rewrites srcset candidates and preserves descriptors", () => {
    const out = rewriteHtml(`<img srcset="/a.png 1x, /b.png 2x">`, BASE);
    const srcset = out.match(/srcset="([^"]+)"/)?.[1] ?? "";
    expect(srcset.match(/\/proxy\?__prism=/g)).toHaveLength(2);
    expect(srcset).toContain("1x");
    expect(srcset).toContain("2x");
  });

  it("sends forms without an action to the proxied target page", () => {
    const out = rewriteHtml(`<form method="get"><input name="search"></form>`, BASE);
    expect(decodeTarget(firstToken(out))).toBe(BASE);
  });

  it("sends forms with a blank action to the proxied target page", () => {
    const out = rewriteHtml(`<form action=""><input name="search"></form>`, BASE);
    expect(decodeTarget(firstToken(out))).toBe(BASE);
  });

  it("rewrites meta refresh URLs", () => {
    const out = rewriteHtml(
      `<meta http-equiv="refresh" content="5; url=/next">`,
      BASE,
    );
    expect(decodeTarget(firstToken(out))).toBe("https://example.com/next");
  });

  it("strips integrity attributes", () => {
    const out = rewriteHtml(`<script src="/app.js" integrity="sha256-deadbeef"></script>`, BASE);
    expect(out).not.toContain("integrity");
  });
});

describe("rewriteCss", () => {
  it("rewrites url() references", () => {
    const out = rewriteCss(`a{background:url("/bg.png")}`, BASE);
    expect(decodeTarget(firstToken(out))).toBe("https://example.com/bg.png");
  });

  it("rewrites @import statements", () => {
    const out = rewriteCss(`@import "theme.css";`, BASE);
    expect(decodeTarget(firstToken(out))).toBe("https://example.com/articles/theme.css");
  });
});

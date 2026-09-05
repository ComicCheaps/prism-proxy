import { describe, expect, it } from "vitest";
import { decodeTarget } from "../src/codec.js";
import { rewriteCss } from "../src/rewrite/css.js";
import { rewriteHtml } from "../src/rewrite/html.js";

const BASE = "https://example.com/articles/index.html";

function firstToken(output: string): string {
  const token = output.match(/\/proxy\?url=([A-Za-z0-9_-]+)/)?.[1];
  expect(token, "expected a /proxy?url= token in output").toBeDefined();
  return token as string;
}

describe("rewriteHtml", () => {
  it("rewrites relative links against the base URL", () => {
    const out = rewriteHtml(`<a href="../about">About</a>`, BASE);
    expect(decodeTarget(firstToken(out))).toBe("https://example.com/about");
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
    expect(srcset.match(/\/proxy\?url=/g)).toHaveLength(2);
    expect(srcset).toContain("1x");
    expect(srcset).toContain("2x");
  });

  it("sends forms without an action to the proxied target page", () => {
    const out = rewriteHtml(`<form method="get"><input name="search"></form>`, BASE);
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

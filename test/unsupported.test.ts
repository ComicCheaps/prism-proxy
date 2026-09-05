import { describe, expect, it } from "vitest";
import { isUnsupportedHost, unsupportedPage } from "../src/unsupported.js";

describe("unsupported targets", () => {
  it("detects protected domains and their subdomains", () => {
    expect(isUnsupportedHost("www.youtube.com")).toBe(true);
    expect(isUnsupportedHost("www.google.com")).toBe(true);
    expect(isUnsupportedHost("www.recaptcha.net")).toBe(true);
    expect(isUnsupportedHost("coolmathgames.com")).toBe(false);
  });

  it("renders an explanatory page without injecting the host as markup", () => {
    expect(unsupportedPage("www.youtube.com")).toContain("cannot run through Prism");
    expect(unsupportedPage("<script>")).toContain("&lt;script&gt;");
  });
});
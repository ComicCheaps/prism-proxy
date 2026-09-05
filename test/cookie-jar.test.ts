import { describe, expect, it } from "vitest";
import { SessionCookieJar } from "../src/cookie-jar.js";

describe("SessionCookieJar", () => {
  it("keeps target-site cookies isolated by Prism session", () => {
    const jar = new SessionCookieJar();
    const target = new URL("https://example.com/account");
    jar.store("one", target, "visitor=first; Path=/; Secure");
    jar.store("two", target, "visitor=second; Path=/; Secure");
    expect(jar.getHeader("one", target)).toBe("visitor=first");
    expect(jar.getHeader("two", target)).toBe("visitor=second");
  });

  it("honors secure and path restrictions", () => {
    const jar = new SessionCookieJar();
    jar.store("session", new URL("https://example.com/account/login"), "auth=yes; Path=/account; Secure");
    expect(jar.getHeader("session", new URL("https://example.com/account/profile"))).toBe("auth=yes");
    expect(jar.getHeader("session", new URL("http://example.com/account/profile"))).toBeUndefined();
    expect(jar.getHeader("session", new URL("https://example.com/other"))).toBeUndefined();
  });
});
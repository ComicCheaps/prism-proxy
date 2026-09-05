import { describe, expect, it } from "vitest";
import { TargetSessionStore } from "../src/target-session.js";

describe("TargetSessionStore", () => {
  it("keeps the most recent target isolated by browser session", () => {
    const store = new TargetSessionStore();
    store.set("one", new URL("https://en.wikipedia.org/w/index.php"));
    store.set("two", new URL("https://www.google.com/search"));
    expect(store.get("one")).toBe("https://en.wikipedia.org/w/index.php");
    expect(store.get("two")).toBe("https://www.google.com/search");
  });
});
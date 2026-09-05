import { describe, expect, it } from "vitest";
import { SERVICE_WORKER } from "../src/service-worker.js";

describe("Prism service worker", () => {
  it("claims clients and routes runtime requests through the proxy", () => {
    expect(SERVICE_WORKER).toContain("self.clients.claim()");
    expect(SERVICE_WORKER).toContain('event.request.method !== "GET"');
    expect(SERVICE_WORKER).toContain('"/go"');
    expect(SERVICE_WORKER).toContain('"/proxy?__prism="');
    expect(SERVICE_WORKER).toContain("bases.get(event.clientId)");
  });
});
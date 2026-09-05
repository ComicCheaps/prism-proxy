import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { EMULATOR_PAGE } from "../src/emulator.js";

describe("local emulator", () => {
  it("offers the requested systems and browser-local file selection", () => {
    expect(EMULATOR_PAGE).toContain('value="gba"');
    expect(EMULATOR_PAGE).toContain('value="gb"');
    expect(EMULATOR_PAGE).toContain('value="psx"');
    expect(EMULATOR_PAGE).toContain('value="nds"');
    expect(EMULATOR_PAGE).toContain('type="file"');
    expect(EMULATOR_PAGE).toContain("URL.createObjectURL(file)");
  });

  it("includes the self-hosted loader and selected core runtime files", () => {
    const coreDirectory = join(process.cwd(), "vendor", "emulatorjs", "data", "cores");
    expect(existsSync(join(process.cwd(), "vendor", "emulatorjs", "data", "loader.js"))).toBe(true);
    for (const core of ["mgba", "gambatte", "pcsx_rearmed", "melonds"]) {
      expect(existsSync(join(coreDirectory, `${core}-wasm.data`))).toBe(true);
    }
  });
});
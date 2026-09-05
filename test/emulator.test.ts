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
    expect(EMULATOR_PAGE).toContain("window.EJS_gameID");
    expect(EMULATOR_PAGE).toContain("URL.createObjectURL(file)");
    expect(EMULATOR_PAGE).toContain("addEventListener('beforeunload'");
    expect(EMULATOR_PAGE).toContain('id="status"');
    expect(EMULATOR_PAGE).toContain("Checking emulator core");
    expect(EMULATOR_PAGE).toContain("The selected game file is empty");
    expect(EMULATOR_PAGE).toContain(".ejs_start_button");
    expect(EMULATOR_PAGE).toContain('id="start-game"');
    expect(EMULATOR_PAGE).toContain("Emulator ready to start");
    expect(EMULATOR_PAGE).toContain("Press Start game below");
    expect(EMULATOR_PAGE).toContain("window.EJS_onGameStart");
    expect(EMULATOR_PAGE).toContain("Game started");
    expect(EMULATOR_PAGE).toContain("Display surface created");
    expect(EMULATOR_PAGE).toContain("Video frames detected");
    expect(EMULATOR_PAGE).toContain("No video frames detected");
    expect(EMULATOR_PAGE).toContain("canvas.toDataURL('image/png')");
    expect(EMULATOR_PAGE).toContain("function ignorableError(error)");
    expect(EMULATOR_PAGE).toContain("Game core did not start");
    expect(EMULATOR_PAGE).not.toContain("loader.onload = () => URL.revokeObjectURL");
  });

  it("includes the self-hosted loader and selected core runtime files", () => {
    const coreDirectory = join(process.cwd(), "vendor", "emulatorjs", "data", "cores");
    expect(existsSync(join(process.cwd(), "vendor", "emulatorjs", "data", "loader.js"))).toBe(true);
    expect(existsSync(join(process.cwd(), "vendor", "emulatorjs", "data", "emulator.min.js"))).toBe(true);
    for (const core of ["mgba", "gambatte", "pcsx_rearmed", "melonds"]) {
      expect(existsSync(join(coreDirectory, `${core}-wasm.data`))).toBe(true);
    }
  });
});
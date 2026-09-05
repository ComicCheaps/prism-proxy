# EmulatorJS Runtime

This directory vendors the EmulatorJS runtime and only the cores used by
Prism's local emulator feature.

- Upstream: https://github.com/EmulatorJS/EmulatorJS
- Frontend source: v4.2.4; generated `emulator.min.js` and `emulator.min.css`
  are included for production use.
- Core packages: v4.2.3, the latest stable core release at integration time.
- License: GPL-3.0-only; see `LICENSE` in this directory.
- Included cores: `mgba` (GBA), `gambatte` (GBC), `pcsx_rearmed` (PSX), and
  `melonds` (Nintendo DS).

No games, BIOS files, or other copyrighted game content are included. The
launcher accepts a file selected locally by the visitor and does not upload it.
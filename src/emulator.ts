export const EMULATOR_PAGE = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#e9f3f1" />
    <title>Emulator | prism-proxy</title>
    <style>
      :root { font-family: Georgia, "Times New Roman", serif; color: #162a2a; background: #e9f3f1; }
      * { box-sizing: border-box; }
      body { min-height: 100vh; margin: 0; background: repeating-linear-gradient(135deg,#e9f3f1 0,#e9f3f1 18px,#e3efec 19px,#e3efec 20px); }
      header, main { width: min(960px, calc(100% - 40px)); margin: 0 auto; }
      header { padding: 28px 0; display: flex; justify-content: space-between; align-items: center; font: 700 14px ui-monospace, monospace; text-transform: uppercase; letter-spacing: .04em; }
      header a { color: #162a2a; text-decoration: none; }
      .mark { color: #e65a3f; } main { padding: 40px 0 70px; }
      h1 { margin: 0; font-size: clamp(42px, 7vw, 78px); font-weight: 500; line-height: .98; } h1 em { color: #0d9273; }
      .lede { max-width: 620px; color: #47615e; font-size: 18px; line-height: 1.55; }
      .launcher { margin-top: 34px; padding: 18px; border: 1px solid #b9ceca; background: #fffdf8; box-shadow: 7px 7px 0 #b9ceca; display: grid; gap: 16px; }
      .systems { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; } label { display: grid; gap: 6px; font: 700 12px ui-monospace, monospace; color: #47615e; text-transform: uppercase; letter-spacing: .04em; }
      select, input { width: 100%; padding: 13px; border: 1px solid #b9ceca; border-radius: 0; color: #162a2a; background: #f7fbfa; font: 15px ui-monospace, monospace; }
      button { border: 0; padding: 14px 18px; background: #e65a3f; color: #fffdf8; font: 700 13px ui-monospace, monospace; text-transform: uppercase; letter-spacing: .05em; cursor: pointer; } button:disabled { background: #9da9a6; cursor: not-allowed; }
      .notice { margin: 0; color: #47615e; font: 13px ui-monospace, monospace; line-height: 1.6; } #game { min-height: 0; margin-top: 34px; } .hidden { display: none; }
      @media (max-width: 650px) { header, main { width: min(100% - 28px,960px); } .systems { grid-template-columns: repeat(2,1fr); } }
    </style>
  </head>
  <body>
    <header><a href="/"><span class="mark">p</span> prism-proxy</a><span>Local emulator</span></header>
    <main>
      <h1>Play your own <em>library.</em></h1>
      <p class="lede">Choose a platform and a game file from this device. Files stay in your browser and are never uploaded to Prism.</p>
      <section class="launcher" aria-label="Emulator launcher">
        <div class="systems">
          <label>System<select id="system"><option value="gba">Game Boy Advance</option><option value="gb">Game Boy Color</option><option value="psx">PlayStation</option><option value="nds">Nintendo DS</option></select></label>
          <label>Game file<input id="rom" type="file" accept=".gba,.gb,.gbc,.bin,.cue,.chd,.iso,.nds" /></label>
        </div>
        <button id="launch" type="button" disabled>Load game</button>
        <p class="notice">Use only homebrew, public-domain, or game files you are legally authorized to use. No game files are included with Prism.</p>
      </section>
      <div id="game" class="hidden"></div>
    </main>
    <script>
      const rom = document.getElementById('rom');
      const system = document.getElementById('system');
      const launch = document.getElementById('launch');
      const game = document.getElementById('game');
      rom.addEventListener('change', () => { launch.disabled = !rom.files.length; });
      launch.addEventListener('click', () => {
        const file = rom.files[0]; if (!file) return;
        launch.disabled = true; game.classList.remove('hidden'); game.replaceChildren();
        window.EJS_player = '#game'; window.EJS_core = system.value;
        window.EJS_gameID = system.value + '-' + file.name + '-' + file.size;
        window.EJS_gameUrl = URL.createObjectURL(file); window.EJS_pathtodata = '/emulatorjs/data/';
        const loader = document.createElement('script'); loader.src = '/emulatorjs/data/loader.js'; loader.onload = () => URL.revokeObjectURL(window.EJS_gameUrl); document.body.appendChild(loader);
      });
    </script>
  </body>
</html>`;
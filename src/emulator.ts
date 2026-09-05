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
      .notice { margin: 0; color: #47615e; font: 13px ui-monospace, monospace; line-height: 1.6; } .status { display: grid; gap: 7px; border-top: 1px solid #b9ceca; padding-top: 14px; color: #47615e; font: 12px ui-monospace, monospace; } .status strong { color: #162a2a; } .status[data-state="error"] strong { color: #bd3f2b; } .status[data-state="ready"] strong { color: #0d9273; } #emulator-stage { position: relative; min-height: 0; margin-top: 34px; } #start-overlay { position: absolute; inset: 0; z-index: 5; display: grid; place-items: center; min-height: 360px; background: rgba(12, 25, 25, .84); } #start-overlay button { min-width: 180px; background: #e65a3f; } #start-overlay p { margin: 12px 24px 0; color: #d7e6e1; font: 13px ui-monospace, monospace; text-align: center; } #start-overlay.hidden { display: none; } .hidden { display: none; }
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
        <div id="status" class="status" data-state="idle" role="status" aria-live="polite"><strong>Waiting for a game file</strong><span id="status-detail">EmulatorJS runs locally from this Prism deployment.</span></div>
        <p class="notice">Use only homebrew, public-domain, or game files you are legally authorized to use. No game files are included with Prism.</p>
      </section>
      <div id="emulator-stage" class="hidden"><div id="game"></div><div id="start-overlay" class="hidden"><div><button id="start-game" type="button">Start game</button><p>Starts the embedded EmulatorJS player with your local file.</p></div></div></div>
    </main>
    <script>
      const rom = document.getElementById('rom');
      const system = document.getElementById('system');
      const launch = document.getElementById('launch');
      const game = document.getElementById('game');
      const stage = document.getElementById('emulator-stage');
      const overlay = document.getElementById('start-overlay');
      const start = document.getElementById('start-game');
      const status = document.getElementById('status');
      const statusTitle = status.querySelector('strong');
      const statusDetail = document.getElementById('status-detail');
      const cores = { gba: 'mgba', gb: 'gambatte', psx: 'pcsx_rearmed', nds: 'melonds' };
      let activeGameUrl;
      let startupTimer;
      function setStatus(state, title, detail) { status.dataset.state = state; statusTitle.textContent = title; statusDetail.textContent = detail; }
      function fail(error) { launch.disabled = false; setStatus('error', 'Emulator stopped', error instanceof Error ? error.message : String(error)); }
      rom.addEventListener('change', () => {
        launch.disabled = !rom.files.length;
        const file = rom.files[0];
        if (file) setStatus('ready', 'Game file selected', file.name + ' (' + Math.ceil(file.size / 1024) + ' KiB).');
      });
      addEventListener('error', event => {
        if (stage.classList.contains('hidden') || /wake lock permission/i.test(event.message || '')) return;
        fail(event.message || 'A browser error interrupted emulation.');
      });
      addEventListener('unhandledrejection', event => { if (!stage.classList.contains('hidden')) fail(event.reason || 'An emulator request failed.'); });
      launch.addEventListener('click', async () => {
        const file = rom.files[0]; if (!file) return;
        clearTimeout(startupTimer);
        launch.disabled = true; stage.classList.remove('hidden'); overlay.classList.add('hidden'); game.replaceChildren();
        const core = cores[system.value];
        setStatus('loading', 'Checking local game file', 'Reading ' + file.name + ' before the emulator starts.');
        try {
          if (file.size === 0) throw new Error('The selected game file is empty. Choose a valid ' + system.options[system.selectedIndex].text + ' file.');
          await file.slice(0, 16).arrayBuffer();
          setStatus('loading', 'Checking emulator core', 'Loading self-hosted ' + core + ' runtime.');
          const coreResponse = await fetch('/emulatorjs/data/cores/' + core + '-wasm.data', { cache: 'no-store' });
          if (!coreResponse.ok) throw new Error('The ' + core + ' core could not be loaded (' + coreResponse.status + ').');
          setStatus('loading', 'Starting EmulatorJS', 'The local game file and ' + core + ' core are ready.');
        } catch (error) { fail(error); return; }
        window.EJS_player = '#game'; window.EJS_core = system.value;
        window.EJS_gameID = system.value + '-' + file.name + '-' + file.size;
        if (activeGameUrl) URL.revokeObjectURL(activeGameUrl);
        activeGameUrl = URL.createObjectURL(file);
        window.EJS_gameUrl = activeGameUrl; window.EJS_pathtodata = '/emulatorjs/data/';
        const loader = document.createElement('script');
        loader.src = '/emulatorjs/data/loader.js';
        loader.onerror = () => fail(new Error('EmulatorJS loader could not be downloaded from this Prism deployment.'));
        loader.onload = () => {
          setStatus('loading', 'Emulator interface loaded', 'Starting the ' + system.options[system.selectedIndex].text + ' core.');
          const observer = new MutationObserver(() => {
            const startButton = game.querySelector('.ejs_start_button');
            if (!startButton) return;
            observer.disconnect();
            overlay.classList.remove('hidden');
            setStatus('ready', 'Emulator ready to start', 'Press Start game below to begin the embedded player.');
            start.addEventListener('click', () => {
              overlay.remove();
              setStatus('loading', 'Starting game core', 'EmulatorJS is loading the local file with ' + core + '.');
              startButton.click();
              watchForGameDisplay();
            }, { once: true });
          });
          function watchForGameDisplay() {
            const displayObserver = new MutationObserver(() => {
              if (!game.querySelector('canvas')) return;
              clearTimeout(startupTimer); displayObserver.disconnect();
              setStatus('ready', 'Core display initialized', 'The ' + core + ' core created its game display.');
            });
            displayObserver.observe(game, { childList: true, subtree: true });
            startupTimer = setTimeout(() => {
              displayObserver.disconnect();
              setStatus('error', 'Game core did not start', 'The emulator loaded, but no game display appeared. Check that this is a valid ' + system.options[system.selectedIndex].text + ' file.');
              launch.disabled = false;
            }, 20000);
          }
          observer.observe(game, { childList: true, subtree: true });
        };
        document.body.appendChild(loader);
      });
      addEventListener('beforeunload', () => { clearTimeout(startupTimer); if (activeGameUrl) URL.revokeObjectURL(activeGameUrl); });
    </script>
  </body>
</html>`;
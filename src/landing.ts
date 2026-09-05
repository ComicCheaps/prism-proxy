export const LANDING_PAGE = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#e9f3f1" />
    <title>prism-proxy</title>
    <style>
      :root { color-scheme: light; font-family: Georgia, "Times New Roman", serif; background: #e9f3f1; color: #162a2a; }
      * { box-sizing: border-box; }
      body { min-height: 100vh; margin: 0; display: grid; grid-template-rows: auto 1fr auto; background: repeating-linear-gradient(135deg, #e9f3f1 0, #e9f3f1 18px, #e3efec 19px, #e3efec 20px); }
      header, footer { width: min(1120px, calc(100% - 40px)); margin: 0 auto; display: flex; align-items: center; justify-content: space-between; }
      header { padding: 28px 0; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 14px; }
      .brand { display: flex; align-items: center; gap: 10px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; }
      .mark { width: 24px; height: 24px; display: grid; place-items: center; border: 2px solid #e65a3f; color: #e65a3f; font-size: 16px; line-height: 1; transform: rotate(45deg); }
      .mark span { transform: rotate(-45deg); }
      .status { display: flex; align-items: center; gap: 8px; color: #47615e; }
      .status::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: #0d9273; box-shadow: 0 0 0 4px #d0e8e1; }
      main { width: min(1120px, calc(100% - 40px)); margin: auto; padding: 42px 0 60px; }
      .eyebrow, .notice, footer { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
      .eyebrow { margin: 0 0 18px; color: #e65a3f; font-size: 13px; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; }
      h1 { max-width: 820px; margin: 0; font-size: clamp(48px, 8vw, 96px); font-weight: 500; line-height: .96; letter-spacing: 0; }
      h1 em { color: #0d9273; font-style: italic; }
      .lede { max-width: 550px; margin: 24px 0 34px; color: #47615e; font-size: 18px; line-height: 1.55; }
      form { width: min(100%, 760px); display: grid; grid-template-columns: 1fr auto; gap: 10px; padding: 10px; background: #fffdf8; border: 1px solid #b9ceca; box-shadow: 7px 7px 0 #b9ceca; }
      input { min-width: 0; padding: 15px 16px; border: 1px solid #b9ceca; border-radius: 0; background: #f7fbfa; color: #162a2a; font: 16px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; outline: none; }
      input:focus { border-color: #0d9273; box-shadow: inset 0 0 0 1px #0d9273; }
      button { min-width: 120px; border: 0; border-radius: 0; padding: 14px 20px; background: #e65a3f; color: #fffdf8; cursor: pointer; font: 700 14px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; text-transform: uppercase; letter-spacing: .05em; }
      button:hover, button:focus-visible { background: #bd3f2b; }
      .notice { width: min(100%, 760px); margin-top: 28px; padding-top: 16px; border-top: 1px solid #b9ceca; color: #47615e; font-size: 12px; line-height: 1.6; }
      footer { padding: 24px 0; border-top: 1px solid #b9ceca; color: #47615e; font-size: 12px; }
      footer a { color: inherit; }
      @media (max-width: 560px) { header, footer, main { width: min(100% - 28px, 1120px); } header { padding: 18px 0; } .status { font-size: 0; } main { padding: 24px 0 42px; } h1 { font-size: 52px; } form { grid-template-columns: 1fr; box-shadow: 4px 4px 0 #b9ceca; } button { min-height: 50px; } }
    </style>
  </head>
  <body>
    <header>
      <div class="brand"><span class="mark"><span>p</span></span> prism-proxy</div>
      <div class="status">Proxy ready</div>
    </header>
    <main>
      <p class="eyebrow">Open web access</p>
      <h1>Browse through the <em>prism.</em></h1>
      <p class="lede">Enter a website and Prism fetches it through a protected, open-source gateway.</p>
      <form action="/go" method="get">
        <input name="url" type="text" inputmode="url" autocomplete="url" placeholder="https://example.com" aria-label="Website URL" required autofocus />
        <button type="submit">Open site</button>
      </form>
      <p class="notice">Some complex, login-required, or media-heavy sites may not be compatible yet. Never enter passwords or private information in a public proxy.</p>
    </main>
    <footer><span>AGPL-3.0</span><a href="https://github.com/ComicCheaps/prism-proxy">Source code</a></footer>
  </body>
</html>`;
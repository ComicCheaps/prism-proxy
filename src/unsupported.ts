const BLOCKED_HOSTS = [
  "google.com",
  "youtube.com",
  "youtu.be",
  "googlevideo.com",
  "gstatic.com",
  "recaptcha.net",
];

export function isUnsupportedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return BLOCKED_HOSTS.some((blocked) => host === blocked || host.endsWith(`.${blocked}`));
}

export function unsupportedPage(hostname: string): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Site unavailable | prism-proxy</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#e9f3f1;color:#162a2a;font-family:Georgia,serif}.panel{width:min(560px,calc(100% - 40px));border:1px solid #b9ceca;background:#fffdf8;padding:32px;box-shadow:7px 7px 0 #b9ceca}p{color:#47615e;line-height:1.55}a{display:inline-block;margin-top:12px;color:#fffdf8;background:#e65a3f;padding:12px 16px;text-decoration:none;font:700 13px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.05em}</style></head>
<body><main class="panel"><p>Prism compatibility notice</p><h1>This site cannot run through Prism.</h1><p>${escapeHtml(hostname)} uses browser-origin security checks such as reCAPTCHA, signed media, or protected login flows. Those checks require the site to run on its own domain, not a proxy domain.</p><a href="/">Return to Prism</a></main></body></html>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}
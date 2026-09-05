# prism-proxy

An open source web proxy: enter a URL, and the server fetches, rewrites, and
serves the page so all requests flow through the proxy.

> **Status:** early development. Static navigation, forms, and common runtime
> `fetch`/XHR requests are proxied; protected media and login-heavy services are
> not yet supported. See [PLANNING.md](PLANNING.md) for the architecture and roadmap.

## Compatibility

Prism is designed for public websites, documentation, blogs, and other sites
that do not require a browser-origin challenge. It intentionally declines
Google, YouTube, reCAPTCHA, and related protected domains: their security
controls require code to execute on the site's own domain and cannot operate
reliably from a web-rewriting proxy.

Search-result links that specify `target="_blank"` are opened in the current
Prism tab so navigation remains inside the proxy.

## Quickstart

```bash
npm install
npm run dev
```

Open http://localhost:3000, enter a URL, and browse.

### Docker

```bash
docker build -t prism-proxy .
docker run -p 3000:3000 prism-proxy
```

## Configuration

| Variable         | Default                          | Description                        |
| ---------------- | -------------------------------- | ---------------------------------- |
| `PORT`           | `3000`                           | Port to listen on                  |
| `HOST`           | `0.0.0.0`                        | Bind address                       |
| `BLOCKLIST`      | `localhost,127.0.0.1,::1,0.0.0.0` | Comma-separated hostnames to refuse |
| `MAX_BODY_BYTES` | `26214400` (25 MiB)              | Response size limit                |

## Deployment

GitHub hosts this repo — it does **not** host the proxy. GitHub Pages is
static-only, and a web proxy needs a live backend. Run it on a VPS, Railway,
Render, Fly.io, or anywhere a Docker container can live.

### Render

The repository includes `render.yaml` for a GitHub-connected Render Web Service:

1. Sign in to [Render](https://render.com/), choose **New +** then **Blueprint**.
2. Connect `ComicCheaps/prism-proxy` and accept the detected blueprint.
3. Render will build and deploy the service, then show a public `onrender.com`
	URL. New commits to `main` deploy automatically.

Render's free tier can spin down idle services. Use a paid plan or VPS for an
always-on public instance.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Please read
[SECURITY.md](SECURITY.md) before reporting vulnerabilities — do **not** open
public issues for security problems.

## License

[AGPL-3.0-only](LICENSE). If you host a modified version publicly, you must
publish your source.

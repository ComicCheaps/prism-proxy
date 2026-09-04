# prism-proxy

An open source web proxy: enter a URL, and the server fetches, rewrites, and
serves the page so all requests flow through the proxy.

> **Status:** early scaffold (v0.1 MVP in progress). See [PLANNING.md](PLANNING.md)
> for the architecture and roadmap.

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

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Please read
[SECURITY.md](SECURITY.md) before reporting vulnerabilities — do **not** open
public issues for security problems.

## License

[AGPL-3.0-only](LICENSE). If you host a modified version publicly, you must
publish your source.

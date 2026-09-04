# Contributing to prism-proxy

Thanks for your interest! This project is in its early days, so the best way
to help right now is hardening the rewrite engine and expanding test coverage.

## Getting started

```bash
git clone https://github.com/<your-user>/prism-proxy.git
cd prism-proxy
npm install
npm run dev
```

## Development workflow

1. Fork and create a branch from `main`.
2. Make your change. Keep modules focused (see PLANNING.md for the map).
3. Run the checks before opening a PR:

   ```bash
   npm run lint
   npm run typecheck
   npm test
   npm run build
   ```

4. Open a pull request against `main`. CI runs the same checks.

## Testing

- Unit tests live in `test/` and run with Vitest.
- Any change to the rewrite engine **must** add a test covering the case.
  Rewriting rules are where compatibility bugs live.

## Code style

- TypeScript strict mode, ESM, explicit types at module boundaries.
- Prettier handles formatting (`npm run format`).

## Security

Do not open public issues for security vulnerabilities. See
[SECURITY.md](SECURITY.md).

## License

By contributing, you agree your contributions are licensed under AGPL-3.0-only.

# Security Policy

A web proxy is a sensitive piece of infrastructure: it fetches arbitrary URLs
on behalf of users and serves third-party content under its own domain.
Please report vulnerabilities responsibly.

## Reporting a vulnerability

**Do not open a public GitHub issue.**

Instead, report privately via GitHub's
[private vulnerability reporting](../../security/advisories/new) on this
repository. Include:

- What the issue is and how to reproduce it
- Impact (SSRF, header injection, cross-user cookie leakage, etc.)
- A suggested fix, if you have one

We aim to acknowledge reports within 72 hours.

## Scope notes

Issues we especially care about:

- **SSRF bypasses** of the host blocklist (e.g., DNS rebinding, alternate IP
  encodings, redirects to private ranges)
- **Cross-user state leakage** (cookies/sessions)
- **Header injection or smuggling** through the gateway
- **Sandbox escapes** that let proxied content attack the proxy origin itself

## Supported versions

Only the latest commit on `main` is supported until v1.0 is released.

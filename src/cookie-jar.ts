interface StoredCookie {
  domain: string;
  path: string;
  name: string;
  value: string;
  secure: boolean;
  expiresAt?: number;
}

/** A deliberately small, per-session cookie jar for upstream websites. */
export class SessionCookieJar {
  private readonly sessions = new Map<string, Map<string, StoredCookie>>();

  getHeader(sessionId: string, url: URL): string | undefined {
    const cookies = this.sessions.get(sessionId);
    if (!cookies) return undefined;
    const now = Date.now();
    const values: string[] = [];
    for (const [key, cookie] of cookies) {
      if (cookie.expiresAt !== undefined && cookie.expiresAt <= now) {
        cookies.delete(key);
        continue;
      }
      if (cookie.secure && url.protocol !== "https:") continue;
      if (!domainMatches(url.hostname, cookie.domain) || !url.pathname.startsWith(cookie.path)) continue;
      values.push(`${cookie.name}=${cookie.value}`);
    }
    return values.length ? values.join("; ") : undefined;
  }

  store(sessionId: string, url: URL, setCookie: string | string[] | undefined): void {
    if (!setCookie) return;
    const jar = this.sessions.get(sessionId) ?? new Map<string, StoredCookie>();
    this.sessions.set(sessionId, jar);
    for (const header of Array.isArray(setCookie) ? setCookie : [setCookie]) {
      const cookie = parseCookie(header, url);
      if (!cookie) continue;
      const key = `${cookie.domain}|${cookie.path}|${cookie.name}`;
      if (cookie.expiresAt !== undefined && cookie.expiresAt <= Date.now()) jar.delete(key);
      else jar.set(key, cookie);
    }
  }
}

function parseCookie(header: string, url: URL): StoredCookie | undefined {
  const [pair, ...attributes] = header.split(";");
  const equals = pair.indexOf("=");
  if (equals <= 0) return undefined;
  const cookie: StoredCookie = {
    name: pair.slice(0, equals).trim(),
    value: pair.slice(equals + 1).trim(),
    domain: url.hostname.toLowerCase(),
    path: defaultPath(url.pathname),
    secure: false,
  };
  for (const attribute of attributes) {
    const [rawName, ...rawValue] = attribute.trim().split("=");
    const name = rawName.toLowerCase();
    const value = rawValue.join("=").trim();
    if (name === "domain" && value && domainMatches(url.hostname, value.replace(/^\./, ""))) {
      cookie.domain = value.replace(/^\./, "").toLowerCase();
    } else if (name === "path" && value.startsWith("/")) cookie.path = value;
    else if (name === "secure") cookie.secure = true;
    else if (name === "max-age" && /^-?\d+$/.test(value)) cookie.expiresAt = Date.now() + Number(value) * 1000;
    else if (name === "expires") {
      const expiresAt = Date.parse(value);
      if (!Number.isNaN(expiresAt)) cookie.expiresAt = expiresAt;
    }
  }
  return cookie;
}

function domainMatches(hostname: string, domain: string): boolean {
  const host = hostname.toLowerCase();
  const normalized = domain.toLowerCase();
  return host === normalized || host.endsWith(`.${normalized}`);
}

function defaultPath(pathname: string): string {
  const slash = pathname.lastIndexOf("/");
  return slash <= 0 ? "/" : pathname.slice(0, slash);
}
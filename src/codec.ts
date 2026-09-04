/**
 * Encodes a target URL into an opaque, URL-safe token.
 * Every link, asset, redirect, and form action must round-trip through
 * these functions so a proxied page never references the target directly.
 */
export function encodeTarget(url: string): string {
  return Buffer.from(url, "utf8").toString("base64url");
}

export function decodeTarget(token: string): string {
  return Buffer.from(token, "base64url").toString("utf8");
}

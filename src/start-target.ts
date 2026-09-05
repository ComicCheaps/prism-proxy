const DUCKDUCKGO_SEARCH = "https://html.duckduckgo.com/html/?q=";

/** Resolves home-page input as either an address or a DuckDuckGo search query. */
export function resolveStartTarget(input: string): string {
  const value = input.trim();
  if (!value) throw new Error("Missing URL or search query");
  if (/^https?:\/\//i.test(value)) return value;
  if (/^[^\s/]+(?:\.[^\s/]+)+(?:[/:?#].*)?$/i.test(value)) return `https://${value}`;
  return `${DUCKDUCKGO_SEARCH}${encodeURIComponent(value)}`;
}
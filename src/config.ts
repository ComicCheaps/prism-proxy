export interface ProxyConfig {
  host: string;
  port: number;
  /**
   * Hostnames that may never be proxied (exact or suffix match).
   * Ships with loopback only — a production deployment should also block
   * private ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16) and cloud
   * metadata endpoints (169.254.169.254) to prevent SSRF.
   */
  blocklist: string[];
  /** Abort responses larger than this many bytes. */
  maxBodyBytes: number;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ProxyConfig {
  return {
    host: env.HOST ?? "0.0.0.0",
    port: Number(env.PORT ?? 3000),
    blocklist: (env.BLOCKLIST ?? "localhost,127.0.0.1,::1,0.0.0.0")
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean),
    maxBodyBytes: Number(env.MAX_BODY_BYTES ?? 25 * 1024 * 1024),
  };
}

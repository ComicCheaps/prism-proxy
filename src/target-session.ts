/** Retains the most recently proxied target for each browser session. */
export class TargetSessionStore {
  private readonly targets = new Map<string, string>();

  get(sessionId: string): string | undefined {
    return this.targets.get(sessionId);
  }

  set(sessionId: string, target: URL): void {
    this.targets.set(sessionId, target.href);
  }
}
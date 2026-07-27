import type { IdempotencyKey, ReferenceId } from "@ryvra/contracts";

export const payReplayKey = (referenceId: ReferenceId, idempotencyKey: IdempotencyKey): string =>
  `${referenceId}::${idempotencyKey}`;

export const callbackDedupeKey = (input: {
  providerEventId?: string;
  referenceId: ReferenceId;
  idempotencyKey: IdempotencyKey;
  eventType: string;
}): string =>
  input.providerEventId ?? `${input.referenceId}::${input.idempotencyKey}::${input.eventType}`;

export class InMemoryIdempotencyCache<T> {
  private readonly entries = new Map<string, Promise<T>>();

  async dedupe(key: string, producer: () => Promise<T>): Promise<T> {
    const existing = this.entries.get(key);
    if (existing) {
      return existing;
    }

    const pending = producer().catch((error) => {
      this.entries.delete(key);
      throw error;
    });

    this.entries.set(key, pending);
    return pending;
  }

  get(key: string): Promise<T> | undefined {
    return this.entries.get(key);
  }
}

export class InMemoryCallbackDedupeStore {
  private readonly entries = new Map<string, number>();

  constructor(private readonly ttlMs: number) {}

  seen(key: string, nowMs: number): boolean {
    this.prune(nowMs);
    const expiresAt = this.entries.get(key);
    return typeof expiresAt === "number" && expiresAt > nowMs;
  }

  mark(key: string, nowMs: number): void {
    this.prune(nowMs);
    this.entries.set(key, nowMs + this.ttlMs);
  }

  private prune(nowMs: number): void {
    for (const [key, expiresAt] of this.entries) {
      if (expiresAt <= nowMs) {
        this.entries.delete(key);
      }
    }
  }
}

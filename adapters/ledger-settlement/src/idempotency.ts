import type { IdempotencyKey, ReferenceId } from "@ryvra/contracts";

export const ledgerSettlementReplayKey = (referenceId: ReferenceId, idempotencyKey: IdempotencyKey): string =>
  `${referenceId}::${idempotencyKey}`;

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
}

import type { IdempotencyKey, PolicyDecisionOutput, ReferenceId } from "@ryvra/contracts";

export const policyReplayKey = (referenceId: ReferenceId, idempotencyKey: IdempotencyKey): string =>
  `${referenceId}::${idempotencyKey}`;

export class InMemoryIdempotencyCache {
  private readonly entries = new Map<string, Promise<PolicyDecisionOutput>>();

  async dedupe(key: string, producer: () => Promise<PolicyDecisionOutput>): Promise<PolicyDecisionOutput> {
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

import { createHash } from 'node:crypto';
import type {
  LedgerEntry,
  LedgerEntryWithHash,
  LedgerEventType,
  LedgerQueryOptions,
  LedgerQueryResult,
} from './types/index.js';

export interface LedgerStorage {
  insert(entry: LedgerEntryWithHash): Promise<void>;
  getLatest(): Promise<LedgerEntryWithHash | null>;
  findByTxRef(txRef: string): Promise<LedgerEntryWithHash | null>;
  query(options: LedgerQueryOptions): Promise<{ entries: LedgerEntryWithHash[]; total: number }>;
  getUnsettled(): Promise<LedgerEntryWithHash[]>;
  markSettled(ids: string[], batchId: string): Promise<void>;
}

const GENESIS_HASH = 'genesis';

export class EarningsLedger {
  private readonly storage: LedgerStorage;

  constructor(storage: LedgerStorage) {
    this.storage = storage;
  }

  async record(entry: LedgerEntry): Promise<LedgerEntryWithHash> {
    // Idempotency: if txRef exists, return existing
    if (entry.txRef) {
      const existing = await this.storage.findByTxRef(entry.txRef);
      if (existing) return existing;
    }

    const latest = await this.storage.getLatest();
    const previousHash = latest?.entryHash ?? GENESIS_HASH;
    const entryHash = this.computeHash(entry, previousHash);

    const entryWithHash: LedgerEntryWithHash = {
      ...entry,
      entryHash,
      previousHash,
    };

    await this.storage.insert(entryWithHash);
    return entryWithHash;
  }

  async query(options: LedgerQueryOptions): Promise<LedgerQueryResult> {
    const { entries, total } = await this.storage.query(options);
    const limit = options.limit ?? 50;
    return {
      entries,
      total,
      hasMore: total > (options.offset ?? 0) + limit,
    };
  }

  async verifyChain(entries: readonly LedgerEntryWithHash[]): Promise<boolean> {
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]!;
      const expectedPrev = i === 0 ? GENESIS_HASH : entries[i - 1]!.entryHash;
      if (entry.previousHash !== expectedPrev) return false;

      const { entryHash: _hash, previousHash: _prev, ...base } = entry;
      const computed = this.computeHash(base as LedgerEntry, entry.previousHash);
      if (computed !== entry.entryHash) return false;
    }
    return true;
  }

  async getUnsettled(): Promise<LedgerEntryWithHash[]> {
    return this.storage.getUnsettled();
  }

  async markSettled(ids: readonly string[], batchId: string): Promise<void> {
    await this.storage.markSettled([...ids], batchId);
  }

  private computeHash(entry: LedgerEntry, previousHash: string): string {
    const data = JSON.stringify({ ...entry, previousHash });
    return createHash('sha256').update(data).digest('hex');
  }
}

/**
 * In-memory storage for development/testing.
 */
export class InMemoryLedgerStorage implements LedgerStorage {
  private entries: LedgerEntryWithHash[] = [];
  private settled = new Map<string, string>(); // id → batchId

  async insert(entry: LedgerEntryWithHash): Promise<void> {
    this.entries.push(entry);
  }

  async getLatest(): Promise<LedgerEntryWithHash | null> {
    return this.entries[this.entries.length - 1] ?? null;
  }

  async findByTxRef(txRef: string): Promise<LedgerEntryWithHash | null> {
    return this.entries.find((e) => e.txRef === txRef) ?? null;
  }

  async query(options: LedgerQueryOptions): Promise<{ entries: LedgerEntryWithHash[]; total: number }> {
    let filtered = [...this.entries];

    if (options.toolId) filtered = filtered.filter((e) => e.toolId === options.toolId);
    if (options.callerWallet) filtered = filtered.filter((e) => e.callerWallet === options.callerWallet);
    if (options.eventType) filtered = filtered.filter((e) => e.eventType === options.eventType);
    if (options.startDate) {
      const start = new Date(options.startDate).getTime();
      filtered = filtered.filter((e) => new Date(e.createdAt).getTime() >= start);
    }
    if (options.endDate) {
      const end = new Date(options.endDate).getTime();
      filtered = filtered.filter((e) => new Date(e.createdAt).getTime() <= end);
    }

    const total = filtered.length;
    const offset = options.offset ?? 0;
    const limit = options.limit ?? 50;
    const entries = filtered.slice(offset, offset + limit);

    return { entries, total };
  }

  async getUnsettled(): Promise<LedgerEntryWithHash[]> {
    return this.entries.filter(
      (e) => e.eventType === 'payment.validated' && !this.settled.has(e.id),
    );
  }

  async markSettled(ids: string[], batchId: string): Promise<void> {
    for (const id of ids) {
      this.settled.set(id, batchId);
    }
  }
}

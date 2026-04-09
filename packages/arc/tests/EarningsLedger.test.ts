import { describe, it, expect } from 'vitest';
import { EarningsLedger, InMemoryLedgerStorage } from '../src/EarningsLedger.js';
import type { LedgerEntry } from '../src/types/index.js';

function makeEntry(overrides?: Partial<LedgerEntry>): LedgerEntry {
  return {
    id: `entry-${Math.random().toString(36).slice(2)}`,
    eventType: 'payment.validated',
    toolId: 'search',
    callerWallet: '0xcaller',
    amount: '0.005',
    currency: 'USDC',
    txRef: `tx-${Math.random().toString(36).slice(2)}`,
    protocol: 'x402',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('EarningsLedger', () => {
  it('records payment with correct hash', async () => {
    const storage = new InMemoryLedgerStorage();
    const ledger = new EarningsLedger(storage);
    const entry = await ledger.record(makeEntry());
    expect(entry.entryHash).toBeDefined();
    expect(entry.entryHash.length).toBe(64); // SHA-256 hex
    expect(entry.previousHash).toBe('genesis');
  });

  it('chains hashes correctly', async () => {
    const storage = new InMemoryLedgerStorage();
    const ledger = new EarningsLedger(storage);
    const first = await ledger.record(makeEntry({ id: 'e1', txRef: 'tx-1' }));
    const second = await ledger.record(makeEntry({ id: 'e2', txRef: 'tx-2' }));
    expect(second.previousHash).toBe(first.entryHash);
    expect(second.entryHash).not.toBe(first.entryHash);
  });

  it('verifies intact chain', async () => {
    const storage = new InMemoryLedgerStorage();
    const ledger = new EarningsLedger(storage);
    const e1 = await ledger.record(makeEntry({ id: 'e1', txRef: 'tx-1' }));
    const e2 = await ledger.record(makeEntry({ id: 'e2', txRef: 'tx-2' }));
    const e3 = await ledger.record(makeEntry({ id: 'e3', txRef: 'tx-3' }));
    expect(await ledger.verifyChain([e1, e2, e3])).toBe(true);
  });

  it('detects tampered chain', async () => {
    const storage = new InMemoryLedgerStorage();
    const ledger = new EarningsLedger(storage);
    const e1 = await ledger.record(makeEntry({ id: 'e1', txRef: 'tx-1' }));
    const e2 = await ledger.record(makeEntry({ id: 'e2', txRef: 'tx-2' }));
    // Tamper with e1's hash
    const tampered = { ...e1, entryHash: 'tampered_hash' };
    expect(await ledger.verifyChain([tampered, e2])).toBe(false);
  });

  it('idempotent on duplicate txRef', async () => {
    const storage = new InMemoryLedgerStorage();
    const ledger = new EarningsLedger(storage);
    const entry = makeEntry({ txRef: 'tx-dup' });
    const first = await ledger.record(entry);
    const second = await ledger.record(entry);
    expect(first.entryHash).toBe(second.entryHash);
  });

  it('queries by tool', async () => {
    const storage = new InMemoryLedgerStorage();
    const ledger = new EarningsLedger(storage);
    await ledger.record(makeEntry({ id: 'e1', txRef: 'tx-1', toolId: 'search' }));
    await ledger.record(makeEntry({ id: 'e2', txRef: 'tx-2', toolId: 'analyze' }));
    await ledger.record(makeEntry({ id: 'e3', txRef: 'tx-3', toolId: 'search' }));
    const result = await ledger.query({ toolId: 'search' });
    expect(result.entries).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('queries by date range', async () => {
    const storage = new InMemoryLedgerStorage();
    const ledger = new EarningsLedger(storage);
    await ledger.record(makeEntry({ id: 'e1', txRef: 'tx-1', createdAt: '2026-04-01T00:00:00Z' }));
    await ledger.record(makeEntry({ id: 'e2', txRef: 'tx-2', createdAt: '2026-04-05T00:00:00Z' }));
    await ledger.record(makeEntry({ id: 'e3', txRef: 'tx-3', createdAt: '2026-04-10T00:00:00Z' }));
    const result = await ledger.query({ startDate: '2026-04-03T00:00:00Z', endDate: '2026-04-07T00:00:00Z' });
    expect(result.entries).toHaveLength(1);
  });

  it('tracks unsettled entries', async () => {
    const storage = new InMemoryLedgerStorage();
    const ledger = new EarningsLedger(storage);
    await ledger.record(makeEntry({ id: 'e1', txRef: 'tx-1' }));
    await ledger.record(makeEntry({ id: 'e2', txRef: 'tx-2' }));
    const unsettled = await ledger.getUnsettled();
    expect(unsettled).toHaveLength(2);
    await ledger.markSettled(['e1'], 'batch-1');
    const remaining = await ledger.getUnsettled();
    expect(remaining).toHaveLength(1);
  });
});

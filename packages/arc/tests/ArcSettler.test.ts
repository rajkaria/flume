import { describe, it, expect, vi } from 'vitest';
import { ArcSettler } from '../src/ArcSettler.js';
import type { LedgerEntryWithHash } from '../src/types/index.js';

function makeEntry(id: string): LedgerEntryWithHash {
  return {
    id,
    eventType: 'payment.validated',
    toolId: 'search',
    callerWallet: '0xcaller',
    amount: '0.005',
    currency: 'USDC',
    txRef: `tx-${id}`,
    protocol: 'x402',
    createdAt: new Date().toISOString(),
    entryHash: `hash-${id}`,
    previousHash: 'genesis',
  };
}

describe('ArcSettler', () => {
  it('settles batch without contract (pre-deployment)', async () => {
    const settler = new ArcSettler();
    const result = await settler.settle({
      batchId: 'batch-1',
      entries: [makeEntry('1'), makeEntry('2')],
      totalAmountUsdc: '0.010000',
      settlementWallet: '0xsettle',
    });
    expect(result.success).toBe(true);
    expect(result.merkleRoot).toBeDefined();
    expect(result.entryCount).toBe(2);
  });

  it('settles batch with contract', async () => {
    const contract = {
      anchorSettlement: vi.fn().mockResolvedValue({ txHash: '0xtxhash' }),
    };
    const settler = new ArcSettler(contract);
    const result = await settler.settle({
      batchId: 'batch-2',
      entries: [makeEntry('3')],
      totalAmountUsdc: '0.005000',
      settlementWallet: '0xsettle',
    });
    expect(result.success).toBe(true);
    expect(result.arcTxHash).toBe('0xtxhash');
    expect(contract.anchorSettlement).toHaveBeenCalledOnce();
  });

  it('handles contract failure gracefully', async () => {
    const contract = {
      anchorSettlement: vi.fn().mockRejectedValue(new Error('chain error')),
    };
    const settler = new ArcSettler(contract);
    const result = await settler.settle({
      batchId: 'batch-3',
      entries: [makeEntry('4')],
      totalAmountUsdc: '0.005000',
      settlementWallet: '0xsettle',
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain('chain error');
  });
});

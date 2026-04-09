import { describe, it, expect } from 'vitest';
import type {
  PaymentProof,
  ValidationResult,
  LedgerEntryWithHash,
  WalletInfo,
  RelayHealth,
  SettlementResult,
} from '../src/types/index.js';

describe('@flume/arc types', () => {
  it('PaymentProof shape is valid', () => {
    const proof: PaymentProof = {
      txRef: 'tx-001',
      callerWallet: '0x1234',
      recipientWallet: '0xabcd',
      amount: '0.005',
      currency: 'USDC',
      nonce: 'nonce-1',
      timestamp: Date.now(),
      signature: '0xsig',
      toolId: 'tool-1',
    };
    expect(proof.currency).toBe('USDC');
  });

  it('ValidationResult shape is valid', () => {
    const result: ValidationResult = {
      valid: true,
      txRef: 'tx-001',
      checkedAt: Date.now(),
    };
    expect(result.valid).toBe(true);
  });

  it('LedgerEntryWithHash shape is valid', () => {
    const entry: LedgerEntryWithHash = {
      id: 'entry-1',
      eventType: 'payment.validated',
      toolId: 'tool-1',
      callerWallet: '0x1234',
      amount: '0.005',
      currency: 'USDC',
      txRef: 'tx-001',
      protocol: 'x402',
      createdAt: new Date().toISOString(),
      entryHash: 'sha256-hash',
      previousHash: 'genesis',
    };
    expect(entry.previousHash).toBe('genesis');
  });

  it('RelayHealth shape is valid', () => {
    const health: RelayHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        circle: { status: 'ok', latencyMs: 43 },
        supabase: { status: 'ok', latencyMs: 12 },
        redis: { status: 'ok', latencyMs: 2 },
        arc: { status: 'ok', latencyMs: 100 },
      },
      queue: {
        pendingPayments: 147,
        nextSettlementIn: '8m 32s',
      },
    };
    expect(health.status).toBe('healthy');
  });
});

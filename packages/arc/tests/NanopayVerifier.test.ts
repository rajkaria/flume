import { describe, it, expect, vi } from 'vitest';
import { NanopayVerifier } from '../src/NanopayVerifier.js';
import { InMemoryNonceRegistry } from '../src/NonceRegistry.js';
import type { PaymentProof, ValidationRequest } from '../src/types/index.js';

function makeProof(overrides?: Partial<PaymentProof>): PaymentProof {
  return {
    txRef: 'tx-001',
    callerWallet: '0xcaller',
    recipientWallet: '0xrecipient',
    amount: '0.005',
    currency: 'USDC',
    nonce: `nonce-${Math.random().toString(36).slice(2)}`,
    timestamp: Date.now(),
    signature: '0xvalidsig123',
    toolId: 'search',
    ...overrides,
  };
}

function makeRequest(proof: PaymentProof): ValidationRequest {
  return { proof, expectedPrice: '0.005', priceTolerance: 0.01 };
}

describe('NanopayVerifier', () => {
  function createVerifier(circleValid = true) {
    const nonceRegistry = new InMemoryNonceRegistry();
    const circleClient = {
      validatePayment: vi.fn().mockResolvedValue({
        valid: circleValid,
        txRef: 'tx-001',
        ...(!circleValid ? { error: 'circle error' } : {}),
      }),
    };
    const verifier = new NanopayVerifier({
      nonceRegistry,
      circleClient,
      timestampWindowMs: 30_000,
      nonceTtlSeconds: 300,
    });
    return { verifier, circleClient, nonceRegistry };
  }

  it('validates a correct payment', async () => {
    const { verifier } = createVerifier();
    const result = await verifier.validate(makeRequest(makeProof()));
    expect(result.valid).toBe(true);
    expect(result.txRef).toBeDefined();
  });

  it('rejects expired timestamp', async () => {
    const { verifier } = createVerifier();
    const proof = makeProof({ timestamp: Date.now() - 60_000 });
    const result = await verifier.validate(makeRequest(proof));
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('timestamp');
  });

  it('rejects duplicate nonce (replay)', async () => {
    const { verifier } = createVerifier();
    const proof = makeProof({ nonce: 'same-nonce' });
    await verifier.validate(makeRequest(proof));
    const result = await verifier.validate(makeRequest(proof));
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('replay');
  });

  it('rejects invalid signature', async () => {
    const { verifier } = createVerifier();
    const proof = makeProof({ signature: '' });
    const result = await verifier.validate(makeRequest(proof));
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('signature');
  });

  it('rejects amount mismatch', async () => {
    const { verifier } = createVerifier();
    const proof = makeProof({ amount: '1.00' });
    const result = await verifier.validate(makeRequest(proof));
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('amount');
  });

  it('handles Circle rejection', async () => {
    const { verifier } = createVerifier(false);
    const result = await verifier.validate(makeRequest(makeProof()));
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('circle error');
  });

  it('handles Circle API unavailable', async () => {
    const nonceRegistry = new InMemoryNonceRegistry();
    const circleClient = {
      validatePayment: vi.fn().mockRejectedValue(new Error('network error')),
    };
    const verifier = new NanopayVerifier({ nonceRegistry, circleClient });
    const result = await verifier.validate(makeRequest(makeProof()));
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('unavailable');
  });
});

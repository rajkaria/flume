import { describe, it, expect } from 'vitest';
import type {
  FlumeConfig,
  ToolConfig,
  PaymentCheckResult,
  Http402Response,
  PolicyCheckResult,
  PriceQuote,
  SessionToken,
} from '../src/types/index.js';

describe('@flume/gateway types', () => {
  it('FlumeConfig shape is valid', () => {
    const config: FlumeConfig = {
      version: '1',
      relay: 'https://relay.flume.xyz',
      ownerWallet: '0x1234567890abcdef1234567890abcdef12345678',
      tools: [
        {
          toolId: 'test-tool',
          name: 'Test Tool',
          protocol: 'x402',
          pricing: { strategy: 'static', staticPriceUsdc: '0.005' },
          settlementWallet: '0xabcdef1234567890abcdef1234567890abcdef12',
        },
      ],
      spendingPolicy: {
        maxPerCallUsdc: '1.00',
        maxDailyPerCallerUsdc: '100.00',
      },
    };
    expect(config.version).toBe('1');
    expect(config.tools).toHaveLength(1);
  });

  it('PaymentCheckResult shape is valid', () => {
    const result: PaymentCheckResult = {
      valid: true,
      txRef: 'tx-123',
      price: '0.005',
    };
    expect(result.valid).toBe(true);
  });

  it('Http402Response shape is valid', () => {
    const response: Http402Response = {
      price: '0.005',
      currency: 'USDC',
      relay: 'https://relay.flume.xyz',
      recipient: '0xabcdef',
      protocol: 'x402',
      nonce: 'abc123',
      toolId: 'test-tool',
      timestamp: Date.now(),
      expiresAt: Date.now() + 30_000,
      accepts: ['circle-nanopay'],
    };
    expect(response.currency).toBe('USDC');
  });

  it('SessionToken shape is valid', () => {
    const token: SessionToken = {
      sessionId: 'sess-1',
      callerWallet: '0x1234',
      toolIds: ['*'],
      budgetUsdc: '10.00',
      spentUsdc: '0.00',
      expiresAt: Date.now() + 3600_000,
      createdAt: Date.now(),
    };
    expect(token.toolIds).toContain('*');
  });
});

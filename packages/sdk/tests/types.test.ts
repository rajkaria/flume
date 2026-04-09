import { describe, it, expect } from 'vitest';
import type {
  FlumeClientConfig,
  SpendingState,
  ToolCallResult,
  AggregatorConfig,
  AggregatedSpending,
} from '../src/types/index.js';

describe('@flume/sdk types', () => {
  it('FlumeClientConfig shape is valid', () => {
    const config: FlumeClientConfig = {
      relayUrl: 'https://relay.flume.xyz',
      walletAddress: '0x1234',
      privateKey: '0xprivkey',
      budget: {
        maxPerCallUsdc: '1.00',
        maxDailyUsdc: '100.00',
      },
    };
    expect(config.relayUrl).toBe('https://relay.flume.xyz');
  });

  it('ToolCallResult shape is valid', () => {
    const result: ToolCallResult<{ answer: string }> = {
      data: { answer: '42' },
      price: '0.005',
      txRef: 'tx-001',
      latencyMs: 234,
      protocol: 'x402',
    };
    expect(result.data.answer).toBe('42');
  });

  it('AggregatedSpending shape is valid', () => {
    const spending: AggregatedSpending = {
      totalSpent: '5.00',
      callCount: 100,
      byServer: {
        'server-a': '3.00',
        'server-b': '2.00',
      },
    };
    expect(spending.callCount).toBe(100);
  });
});

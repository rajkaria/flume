import { describe, it, expect } from 'vitest';
import type {
  InitAnswers,
  StatusReport,
  AuditSummary,
} from '../src/types/index.js';

describe('@flume/cli types', () => {
  it('InitAnswers shape is valid', () => {
    const answers: InitAnswers = {
      projectType: 'mcp',
      toolNames: ['search', 'analyze'],
      defaultPriceUsdc: '0.005',
      pricingStrategy: 'static',
      maxPerCallUsdc: '1.00',
      maxDailyPerCallerUsdc: '100.00',
      createWallet: true,
    };
    expect(answers.toolNames).toHaveLength(2);
  });

  it('StatusReport shape is valid', () => {
    const report: StatusReport = {
      configValid: true,
      relay: { reachable: true, latencyMs: 50 },
      circle: { connected: true, environment: 'sandbox' },
      arc: { connected: true, blockNumber: 1000 },
      tools: [
        {
          toolId: 'search',
          name: 'Search Tool',
          currentPrice: '0.005',
          strategy: 'static',
          active: true,
        },
      ],
      walletBalance: '50.00',
    };
    expect(report.configValid).toBe(true);
  });
});

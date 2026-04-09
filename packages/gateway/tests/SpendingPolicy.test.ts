import { describe, it, expect } from 'vitest';
import { SpendingPolicy } from '../src/SpendingPolicy.js';

const basePolicy = {
  maxPerCallUsdc: '1.00',
  maxDailyPerCallerUsdc: '10.00',
};

describe('SpendingPolicy', () => {
  it('allows call under limits', () => {
    const policy = new SpendingPolicy(basePolicy);
    const result = policy.check('0xcaller1', '0.50');
    expect(result.allowed).toBe(true);
  });

  it('rejects call exceeding per-call limit', () => {
    const policy = new SpendingPolicy(basePolicy);
    const result = policy.check('0xcaller1', '1.50');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('per-call limit');
  });

  it('rejects when daily limit exceeded', () => {
    const policy = new SpendingPolicy(basePolicy);
    // Spend 9.50 first
    policy.check('0xcaller1', '9.50');
    policy.record('0xcaller1', '9.50');
    // Try another 1.00 — should exceed 10.00 limit
    const result = policy.check('0xcaller1', '1.00');
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('daily per-caller limit exceeded');
  });

  it('allowlist bypasses all limits', () => {
    const policy = new SpendingPolicy({
      ...basePolicy,
      allowlist: ['0xvip'],
    });
    const result = policy.check('0xvip', '999.00');
    expect(result.allowed).toBe(true);
  });

  it('blocklist hard-rejects', () => {
    const policy = new SpendingPolicy({
      ...basePolicy,
      blocklist: ['0xbad'],
    });
    const result = policy.check('0xbad', '0.01');
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('caller is blocklisted');
  });

  it('fresh caller gets full budget', () => {
    const policy = new SpendingPolicy(basePolicy);
    const result = policy.check('0xnewcaller', '0.50');
    expect(result.allowed).toBe(true);
    expect(parseFloat(result.remainingBudget!)).toBeCloseTo(9.50, 2);
  });

  it('global daily limit enforced', () => {
    const policy = new SpendingPolicy({
      ...basePolicy,
      maxDailyGlobalUsdc: '5.00',
    });
    policy.check('0xa', '3.00');
    policy.record('0xa', '3.00');
    policy.check('0xb', '2.50');
    policy.record('0xb', '2.50');
    const result = policy.check('0xc', '0.50');
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('global daily limit exceeded');
  });

  it('tracks state correctly', () => {
    const policy = new SpendingPolicy(basePolicy);
    policy.check('0xcaller1', '1.00');
    policy.record('0xcaller1', '1.00');
    const state = policy.getState('0xcaller1');
    expect(state.callerWallet).toBe('0xcaller1');
    expect(parseFloat(state.dailySpentUsdc)).toBeCloseTo(1.0, 2);
    expect(state.callCountToday).toBe(1);
  });
});

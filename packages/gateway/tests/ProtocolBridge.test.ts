import { describe, it, expect } from 'vitest';
import { ProtocolBridge, InMemorySessionStore } from '../src/ProtocolBridge.js';

describe('ProtocolBridge', () => {
  function createBridge() {
    const store = new InMemorySessionStore();
    const bridge = new ProtocolBridge(store);
    return bridge;
  }

  it('opens a session', async () => {
    const bridge = createBridge();
    const session = await bridge.openSession({
      callerWallet: '0xcaller',
      toolIds: ['search', 'analyze'],
      budgetUsdc: '10.00',
      durationSeconds: 3600,
      signature: '0xsig',
    });
    expect(session.sessionId).toBeDefined();
    expect(session.callerWallet).toBe('0xcaller');
    expect(session.budgetUsdc).toBe('10.00');
    expect(session.spentUsdc).toBe('0.000000');
  });

  it('validates call within session budget', async () => {
    const bridge = createBridge();
    const session = await bridge.openSession({
      callerWallet: '0xcaller',
      toolIds: ['*'],
      budgetUsdc: '1.00',
      durationSeconds: 3600,
      signature: '0xsig',
    });
    const result = await bridge.validateSession(session.sessionId, 'search', '0.10');
    expect(result.valid).toBe(true);
  });

  it('rejects unauthorized tool', async () => {
    const bridge = createBridge();
    const session = await bridge.openSession({
      callerWallet: '0xcaller',
      toolIds: ['search'],
      budgetUsdc: '1.00',
      durationSeconds: 3600,
      signature: '0xsig',
    });
    const result = await bridge.validateSession(session.sessionId, 'analyze', '0.10');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('not authorized');
  });

  it('rejects when budget exceeded', async () => {
    const bridge = createBridge();
    const session = await bridge.openSession({
      callerWallet: '0xcaller',
      toolIds: ['*'],
      budgetUsdc: '0.50',
      durationSeconds: 3600,
      signature: '0xsig',
    });
    // Spend most of budget
    await bridge.validateSession(session.sessionId, 'search', '0.45');
    // Try to exceed
    const result = await bridge.validateSession(session.sessionId, 'search', '0.10');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('budget exceeded');
  });

  it('tracks spending across multiple calls', async () => {
    const bridge = createBridge();
    const session = await bridge.openSession({
      callerWallet: '0xcaller',
      toolIds: ['*'],
      budgetUsdc: '1.00',
      durationSeconds: 3600,
      signature: '0xsig',
    });

    for (let i = 0; i < 5; i++) {
      const result = await bridge.validateSession(session.sessionId, 'search', '0.10');
      expect(result.valid).toBe(true);
    }

    const updated = await bridge.getSession(session.sessionId);
    expect(parseFloat(updated!.spentUsdc)).toBeCloseTo(0.50, 2);
  });

  it('closes session and returns summary', async () => {
    const bridge = createBridge();
    const session = await bridge.openSession({
      callerWallet: '0xcaller',
      toolIds: ['*'],
      budgetUsdc: '1.00',
      durationSeconds: 3600,
      signature: '0xsig',
    });
    await bridge.validateSession(session.sessionId, 'search', '0.30');
    const result = await bridge.closeSession(session.sessionId);
    expect(result).not.toBeNull();
    expect(result!.totalSpent).toBe('0.300000');
  });

  it('rejects calls on expired session', async () => {
    const store = new InMemorySessionStore();
    const bridge = new ProtocolBridge(store);
    // Create expired session directly
    await store.set({
      sessionId: 'expired-session',
      callerWallet: '0xcaller',
      toolIds: ['*'],
      budgetUsdc: '10.00',
      spentUsdc: '0.000000',
      expiresAt: Date.now() - 1000, // already expired
      createdAt: Date.now() - 60_000,
    });
    const result = await bridge.validateSession('expired-session', 'search', '0.10');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('expired');
  });

  it('returns null for unknown session', async () => {
    const bridge = createBridge();
    const result = await bridge.validateSession('nonexistent', 'search', '0.10');
    expect(result.valid).toBe(false);
  });
});

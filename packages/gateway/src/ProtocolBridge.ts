import { randomBytes } from 'node:crypto';
import type { SessionToken, SessionOpenRequest, SessionCloseResult } from './types/index.js';

export interface SessionStore {
  get(sessionId: string): Promise<SessionToken | null>;
  set(session: SessionToken): Promise<void>;
  delete(sessionId: string): Promise<SessionToken | null>;
}

export class InMemorySessionStore implements SessionStore {
  private sessions = new Map<string, SessionToken>();

  async get(sessionId: string): Promise<SessionToken | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return null;
    }
    return session;
  }

  async set(session: SessionToken): Promise<void> {
    this.sessions.set(session.sessionId, session);
  }

  async delete(sessionId: string): Promise<SessionToken | null> {
    const session = this.sessions.get(sessionId);
    this.sessions.delete(sessionId);
    return session ?? null;
  }
}

export class ProtocolBridge {
  private readonly store: SessionStore;

  constructor(store: SessionStore) {
    this.store = store;
  }

  async openSession(request: SessionOpenRequest): Promise<SessionToken> {
    const sessionId = randomBytes(16).toString('hex');
    const now = Date.now();
    const session: SessionToken = {
      sessionId,
      callerWallet: request.callerWallet,
      toolIds: request.toolIds,
      budgetUsdc: request.budgetUsdc,
      spentUsdc: '0.000000',
      expiresAt: now + request.durationSeconds * 1000,
      createdAt: now,
    };
    await this.store.set(session);
    return session;
  }

  async validateSession(sessionId: string, toolId: string, amount: string): Promise<{ valid: boolean; reason?: string }> {
    const session = await this.store.get(sessionId);
    if (!session) {
      return { valid: false, reason: 'session not found or expired' };
    }

    if (Date.now() > session.expiresAt) {
      return { valid: false, reason: 'session expired' };
    }

    // Check tool authorization
    if (!session.toolIds.includes('*') && !session.toolIds.includes(toolId)) {
      return { valid: false, reason: `tool ${toolId} not authorized in this session` };
    }

    // Check budget
    const spent = parseFloat(session.spentUsdc);
    const budget = parseFloat(session.budgetUsdc);
    const cost = parseFloat(amount);
    if (spent + cost > budget) {
      return { valid: false, reason: 'session budget exceeded' };
    }

    // Increment spent
    const updated: SessionToken = {
      ...session,
      spentUsdc: (spent + cost).toFixed(6),
    };
    await this.store.set(updated);

    return { valid: true };
  }

  async closeSession(sessionId: string): Promise<SessionCloseResult | null> {
    const session = await this.store.delete(sessionId);
    if (!session) return null;

    const spent = parseFloat(session.spentUsdc);
    const budget = parseFloat(session.budgetUsdc);

    return {
      sessionId,
      totalSpent: session.spentUsdc,
      callCount: 0, // Would be tracked in production
    };
  }

  async getSession(sessionId: string): Promise<SessionToken | null> {
    return this.store.get(sessionId);
  }
}

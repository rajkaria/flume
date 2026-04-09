import type { NonceRegistry } from './types/index.js';

/**
 * In-memory nonce registry for development/testing.
 * Production uses Redis via Upstash.
 */
export class InMemoryNonceRegistry implements NonceRegistry {
  private readonly nonces = new Map<string, number>(); // nonce → expiresAt

  async checkAndStore(nonce: string, ttlSeconds: number): Promise<boolean> {
    this.cleanup();
    if (this.nonces.has(nonce)) {
      return false; // nonce already used
    }
    this.nonces.set(nonce, Date.now() + ttlSeconds * 1000);
    return true;
  }

  async exists(nonce: string): Promise<boolean> {
    this.cleanup();
    return this.nonces.has(nonce);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [nonce, expiresAt] of this.nonces) {
      if (now >= expiresAt) {
        this.nonces.delete(nonce);
      }
    }
  }
}

/**
 * Redis-backed nonce registry for production.
 */
export class RedisNonceRegistry implements NonceRegistry {
  private readonly redis: { get: (k: string) => Promise<string | null>; set: (k: string, v: string, opts: { ex: number }) => Promise<unknown> };

  constructor(redis: { get: (k: string) => Promise<string | null>; set: (k: string, v: string, opts: { ex: number }) => Promise<unknown> }) {
    this.redis = redis;
  }

  async checkAndStore(nonce: string, ttlSeconds: number): Promise<boolean> {
    const key = `flume:nonce:${nonce}`;
    const existing = await this.redis.get(key);
    if (existing !== null) {
      return false;
    }
    await this.redis.set(key, '1', { ex: ttlSeconds });
    return true;
  }

  async exists(nonce: string): Promise<boolean> {
    const key = `flume:nonce:${nonce}`;
    const val = await this.redis.get(key);
    return val !== null;
  }
}

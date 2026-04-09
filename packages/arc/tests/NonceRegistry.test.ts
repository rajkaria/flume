import { describe, it, expect } from 'vitest';
import { InMemoryNonceRegistry } from '../src/NonceRegistry.js';

describe('InMemoryNonceRegistry', () => {
  it('allows first use of nonce', async () => {
    const registry = new InMemoryNonceRegistry();
    const result = await registry.checkAndStore('nonce-1', 300);
    expect(result).toBe(true);
  });

  it('rejects second use of same nonce', async () => {
    const registry = new InMemoryNonceRegistry();
    await registry.checkAndStore('nonce-1', 300);
    const result = await registry.checkAndStore('nonce-1', 300);
    expect(result).toBe(false);
  });

  it('reports existence correctly', async () => {
    const registry = new InMemoryNonceRegistry();
    expect(await registry.exists('nonce-1')).toBe(false);
    await registry.checkAndStore('nonce-1', 300);
    expect(await registry.exists('nonce-1')).toBe(true);
  });
});

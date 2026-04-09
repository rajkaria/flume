import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import type { Server } from 'node:http';
import { FlumeRelay } from '../src/FlumeRelay.js';
import { InMemoryLedgerStorage } from '../src/EarningsLedger.js';
import { InMemoryNonceRegistry } from '../src/NonceRegistry.js';

function createRelay() {
  return new FlumeRelay({
    ledgerStorage: new InMemoryLedgerStorage(),
    nonceRegistry: new InMemoryNonceRegistry(),
    circleClient: {
      validatePayment: vi.fn().mockResolvedValue({ valid: true, txRef: 'tx-relay-1' }),
    },
    walletClient: {
      createWallet: vi.fn().mockResolvedValue({ address: '0xnew' }),
      getBalance: vi.fn().mockResolvedValue({ balance: '100.00' }),
      listWallets: vi.fn().mockResolvedValue([]),
    },
  });
}

async function request(
  server: Server,
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; body: unknown }> {
  const port = (server.address() as { port: number }).port;
  const res = await fetch(`http://localhost:${port}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, body: json };
}

describe('FlumeRelay', () => {
  let relay: FlumeRelay;
  let server: Server;

  beforeAll(async () => {
    relay = createRelay();
    server = relay.getApp().listen(0);
    await new Promise((r) => server.on('listening', r));
  });

  afterAll(() => { server.close(); });

  it('GET /v1/status returns healthy', async () => {
    const { status, body } = await request(server, 'GET', '/v1/status');
    expect(status).toBe(200);
    expect((body as Record<string, unknown>).status).toBe('healthy');
  });

  it('GET /health returns full health', async () => {
    const { status, body } = await request(server, 'GET', '/health');
    expect(status).toBe(200);
    const b = body as Record<string, unknown>;
    expect(b.status).toBe('healthy');
    expect(b.services).toBeDefined();
  });

  it('POST /v1/validate validates payment', async () => {
    const { status, body } = await request(server, 'POST', '/v1/validate', {
      proof: {
        txRef: 'tx-test',
        callerWallet: '0xcaller',
        recipientWallet: '0xrecipient',
        amount: '0.005',
        currency: 'USDC',
        nonce: `nonce-${Date.now()}`,
        timestamp: Date.now(),
        signature: '0xvalidsig',
        toolId: 'search',
      },
      expectedPrice: '0.005',
    });
    expect(status).toBe(200);
    expect((body as Record<string, unknown>).valid).toBe(true);
  });

  it('POST /v1/validate rejects missing proof', async () => {
    const { status } = await request(server, 'POST', '/v1/validate', {});
    expect(status).toBe(400);
  });

  it('POST /v1/wallets/create creates wallet', async () => {
    const { status, body } = await request(server, 'POST', '/v1/wallets/create', {
      type: 'tool-owner',
      label: 'Test Wallet',
    });
    expect(status).toBe(201);
    expect((body as Record<string, unknown>).address).toBe('0xnew');
  });

  it('GET /v1/nonce returns nonce', async () => {
    const { status, body } = await request(server, 'GET', '/v1/nonce');
    expect(status).toBe(200);
    expect((body as Record<string, unknown>).nonce).toBeDefined();
  });

  it('POST /v1/tools/register registers tool', async () => {
    const { status, body } = await request(server, 'POST', '/v1/tools/register', {
      toolId: 'search',
      ownerWallet: '0xowner',
      settlementWallet: '0xsettle',
      pricePerCall: '0.005',
    });
    expect(status).toBe(201);
  });

  it('GET /v1/tools/:toolId/price returns price', async () => {
    const { status, body } = await request(server, 'GET', '/v1/tools/search/price');
    expect(status).toBe(200);
    expect((body as Record<string, unknown>).price).toBeDefined();
  });
});

describe('FlumeRelay settlement', () => {
  it('settles unsettled entries', async () => {
    const relay = createRelay();
    const app = relay.getApp();
    const server = app.listen(0);
    await new Promise((r) => server.on('listening', r));

    // Create some validated payments
    for (let i = 0; i < 5; i++) {
      await request(server, 'POST', '/v1/validate', {
        proof: {
          txRef: `tx-settle-${i}`,
          callerWallet: '0xcaller',
          recipientWallet: '0xrecipient',
          amount: '0.005',
          currency: 'USDC',
          nonce: `nonce-settle-${i}-${Date.now()}`,
          timestamp: Date.now(),
          signature: '0xvalidsig',
          toolId: 'search',
        },
        expectedPrice: '0.005',
      });
    }

    // Run settlement
    await relay.runSettlement();

    // Run again — should be no-op since all settled
    await relay.runSettlement();

    server.close();
  });
});

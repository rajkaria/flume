import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import { PaymentGate } from '../src/PaymentGate.js';
import type { FlumeConfig, PaymentProofHeader } from '../src/types/index.js';

// Using dynamic import for supertest-like testing with raw HTTP
async function makeRequest(
  app: express.Express,
  method: 'get' | 'post',
  path: string,
  options?: { headers?: Record<string, string>; body?: unknown },
): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const port = (server.address() as { port: number }).port;
      const url = `http://localhost:${port}${path}`;
      const init: RequestInit = {
        method: method.toUpperCase(),
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      };
      if (options?.body) {
        init.body = JSON.stringify(options.body);
      }
      fetch(url, init)
        .then(async (res) => {
          const body = await res.json().catch(() => null);
          server.close();
          resolve({ status: res.status, body });
        })
        .catch(() => {
          server.close();
          resolve({ status: 500, body: null });
        });
    });
  });
}

const testConfig: FlumeConfig = {
  version: '1',
  relay: 'https://relay.flume.xyz',
  ownerWallet: '0xowner',
  tools: [
    {
      toolId: 'search',
      name: 'Search',
      protocol: 'x402',
      pricing: { strategy: 'static', staticPriceUsdc: '0.005' },
      settlementWallet: '0xsettle',
    },
    {
      toolId: 'free-tool',
      name: 'Free Tool',
      protocol: 'free',
      pricing: { strategy: 'static', staticPriceUsdc: '0' },
      settlementWallet: '0xsettle',
    },
  ],
  spendingPolicy: {
    maxPerCallUsdc: '1.00',
    maxDailyPerCallerUsdc: '100.00',
  },
};

describe('PaymentGate', () => {
  function createApp(validator?: { validate: (p: PaymentProofHeader) => Promise<{ valid: boolean; reason?: string; txRef?: string }> }) {
    const app = express();
    app.use(express.json());
    const gate = new PaymentGate(testConfig, validator);
    app.use(gate.middleware());
    app.post('/tools/search', (_req, res) => { res.json({ result: 'found it' }); });
    app.post('/tools/free-tool', (_req, res) => { res.json({ result: 'free data' }); });
    app.get('/other', (_req, res) => { res.json({ ok: true }); });
    return app;
  }

  it('returns 402 when no payment header on gated tool', async () => {
    const app = createApp();
    const { status, body } = await makeRequest(app, 'post', '/tools/search');
    expect(status).toBe(402);
    const b = body as Record<string, unknown>;
    expect(b.price).toBe('0.005');
    expect(b.currency).toBe('USDC');
    expect(b.protocol).toBe('x402');
    expect(b.toolId).toBe('search');
    expect(b.relay).toBe('https://relay.flume.xyz');
    expect(b.nonce).toBeDefined();
  });

  it('passes through free-protocol tools', async () => {
    const app = createApp();
    const { status, body } = await makeRequest(app, 'post', '/tools/free-tool');
    expect(status).toBe(200);
    expect((body as Record<string, unknown>).result).toBe('free data');
  });

  it('passes through non-tool routes', async () => {
    const app = createApp();
    const { status, body } = await makeRequest(app, 'get', '/other');
    expect(status).toBe(200);
    expect((body as Record<string, unknown>).ok).toBe(true);
  });

  it('forwards call when valid payment proof provided', async () => {
    const mockValidator = {
      validate: vi.fn().mockResolvedValue({ valid: true, txRef: 'tx-123' }),
    };
    const app = createApp(mockValidator);

    const proof: PaymentProofHeader = {
      txRef: 'tx-123',
      callerWallet: '0xcaller',
      amount: '0.005',
      currency: 'USDC',
      nonce: 'nonce-1',
      timestamp: Date.now(),
      signature: '0xsig',
    };
    const paymentHeader = Buffer.from(JSON.stringify(proof)).toString('base64');

    const { status, body } = await makeRequest(app, 'post', '/tools/search', {
      headers: { 'X-Flume-Payment': paymentHeader },
    });
    expect(status).toBe(200);
    expect((body as Record<string, unknown>).result).toBe('found it');
    expect(mockValidator.validate).toHaveBeenCalledOnce();
  });

  it('returns 402 when validator rejects payment', async () => {
    const mockValidator = {
      validate: vi.fn().mockResolvedValue({ valid: false, reason: 'invalid signature' }),
    };
    const app = createApp(mockValidator);

    const proof: PaymentProofHeader = {
      txRef: 'tx-bad',
      callerWallet: '0xcaller',
      amount: '0.005',
      currency: 'USDC',
      nonce: 'nonce-2',
      timestamp: Date.now(),
      signature: '0xbadsig',
    };
    const paymentHeader = Buffer.from(JSON.stringify(proof)).toString('base64');

    const { status, body } = await makeRequest(app, 'post', '/tools/search', {
      headers: { 'X-Flume-Payment': paymentHeader },
    });
    expect(status).toBe(402);
    expect((body as Record<string, unknown>).reason).toBe('invalid signature');
  });

  it('rejects blocklisted caller with 403', async () => {
    const config: FlumeConfig = {
      ...testConfig,
      spendingPolicy: {
        ...testConfig.spendingPolicy,
        blocklist: ['0xblockedcaller'],
      },
    };
    const app = express();
    app.use(express.json());
    const gate = new PaymentGate(config);
    app.use(gate.middleware());
    app.post('/tools/search', (_req, res) => { res.json({ result: 'ok' }); });

    const proof: PaymentProofHeader = {
      txRef: 'tx-x',
      callerWallet: '0xblockedcaller',
      amount: '0.005',
      currency: 'USDC',
      nonce: 'nonce-3',
      timestamp: Date.now(),
      signature: '0xsig',
    };
    const paymentHeader = Buffer.from(JSON.stringify(proof)).toString('base64');

    const { status, body } = await makeRequest(app, 'post', '/tools/search', {
      headers: { 'X-Flume-Payment': paymentHeader },
    });
    expect(status).toBe(403);
    expect((body as Record<string, unknown>).error).toBe('spending_policy_violation');
  });

  it('handles MCP JSON-RPC requests', async () => {
    const app = express();
    app.use(express.json());
    const gate = new PaymentGate(testConfig);
    app.use(gate.middleware());
    app.post('/', (_req, res) => { res.json({ result: 'mcp response' }); });

    const { status, body } = await makeRequest(app, 'post', '/', {
      body: { jsonrpc: '2.0', method: 'search', params: {} },
    });
    expect(status).toBe(402);
    expect((body as Record<string, unknown>).toolId).toBe('search');
  });
});

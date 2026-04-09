import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import express from 'express';
import type { Server } from 'node:http';
import { FlumeClient } from '../src/FlumeClient.js';
import { FlumeMaxPriceExceededError, FlumeBudgetExhaustedError } from '../src/errors.js';

describe('FlumeClient', () => {
  let toolServer: Server;
  let relayServer: Server;
  let toolPort: number;
  let relayPort: number;

  beforeAll(async () => {
    // Mock tool server with PaymentGate behavior
    const toolApp = express();
    toolApp.use(express.json());
    toolApp.post('/tools/search', (req, res) => {
      if (req.headers['x-flume-payment']) {
        res.json({ result: 'search results' });
      } else {
        res.status(402).json({
          price: '0.005',
          currency: 'USDC',
          relay: '', // will be set below
          recipient: '0xrecipient',
          protocol: 'x402',
          nonce: 'test-nonce',
          toolId: 'search',
          timestamp: Date.now(),
          expiresAt: Date.now() + 30000,
          accepts: ['circle-nanopay'],
        });
      }
    });
    toolApp.post('/tools/expensive', (_req, res) => {
      res.status(402).json({
        price: '50.00',
        currency: 'USDC',
        relay: '',
        recipient: '0xrecipient',
        protocol: 'x402',
        nonce: 'test-nonce-2',
        toolId: 'expensive',
        timestamp: Date.now(),
        expiresAt: Date.now() + 30000,
        accepts: ['circle-nanopay'],
      });
    });
    toolApp.post('/tools/free-tool', (_req, res) => {
      res.json({ result: 'free data' });
    });

    // Mock relay server
    const relayApp = express();
    relayApp.use(express.json());
    relayApp.post('/v1/validate', (_req, res) => {
      res.json({ valid: true, txRef: 'tx-mock', checkedAt: Date.now() });
    });

    toolServer = toolApp.listen(0);
    relayServer = relayApp.listen(0);
    await Promise.all([
      new Promise((r) => toolServer.on('listening', r)),
      new Promise((r) => relayServer.on('listening', r)),
    ]);
    toolPort = (toolServer.address() as { port: number }).port;
    relayPort = (relayServer.address() as { port: number }).port;
  });

  afterAll(() => {
    toolServer.close();
    relayServer.close();
  });

  function createClient(overrides?: Partial<{ maxPerCallUsdc: string; maxDailyUsdc: string }>) {
    return new FlumeClient({
      relayUrl: `http://localhost:${relayPort}`,
      walletAddress: '0xcaller',
      privateKey: '0xprivkey',
      budget: {
        maxPerCallUsdc: overrides?.maxPerCallUsdc ?? '1.00',
        maxDailyUsdc: overrides?.maxDailyUsdc ?? '100.00',
      },
    });
  }

  it('auto-pays and returns result for x402 tool', async () => {
    const client = createClient();
    const result = await client.callTool<{ result: string }>(
      `http://localhost:${toolPort}`,
      'search',
    );
    expect(result.data.result).toBe('search results');
    expect(result.protocol).toBe('x402');
    expect(parseFloat(result.price)).toBeCloseTo(0.005);
  });

  it('returns free tool result without payment', async () => {
    const client = createClient();
    const result = await client.callTool<{ result: string }>(
      `http://localhost:${toolPort}`,
      'free-tool',
    );
    expect(result.data.result).toBe('free data');
    expect(result.protocol).toBe('free');
  });

  it('throws FlumeMaxPriceExceededError when price exceeds maxPrice', async () => {
    const client = createClient({ maxPerCallUsdc: '0.001' });
    await expect(
      client.callTool(`http://localhost:${toolPort}`, 'search'),
    ).rejects.toThrow(FlumeMaxPriceExceededError);
  });

  it('tracks spending state across calls', async () => {
    const client = createClient();
    await client.callTool(`http://localhost:${toolPort}`, 'search');
    await client.callTool(`http://localhost:${toolPort}`, 'search');
    const state = client.getSpendingState();
    expect(state.callCount).toBe(2);
    expect(parseFloat(state.totalSpent)).toBeCloseTo(0.01, 3);
  });

  it('throws FlumeBudgetExhaustedError when daily budget exceeded', async () => {
    const client = createClient({ maxDailyUsdc: '0.008' });
    await client.callTool(`http://localhost:${toolPort}`, 'search');
    await expect(
      client.callTool(`http://localhost:${toolPort}`, 'search'),
    ).rejects.toThrow(FlumeBudgetExhaustedError);
  });
});

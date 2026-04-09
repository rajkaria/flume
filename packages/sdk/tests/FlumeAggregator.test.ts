import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import type { Server } from 'node:http';
import { FlumeAggregator } from '../src/FlumeAggregator.js';

describe('FlumeAggregator', () => {
  let serverA: Server;
  let serverB: Server;
  let portA: number;
  let portB: number;
  let relayServer: Server;
  let relayPort: number;

  beforeAll(async () => {
    // Server A — price 0.003
    const appA = express();
    appA.use(express.json());
    appA.post('/tools/search', (req, res) => {
      if (req.headers['x-flume-payment']) {
        res.json({ result: 'from-A' });
      } else {
        res.status(402).json({
          price: '0.003', currency: 'USDC', relay: '', recipient: '0xA',
          protocol: 'x402', nonce: 'n1', toolId: 'search',
          timestamp: Date.now(), expiresAt: Date.now() + 30000, accepts: ['circle-nanopay'],
        });
      }
    });
    appA.get('/v1/tools/search/price', (_req, res) => {
      res.json({ price: '0.003' });
    });

    // Server B — price 0.005
    const appB = express();
    appB.use(express.json());
    appB.post('/tools/search', (req, res) => {
      if (req.headers['x-flume-payment']) {
        res.json({ result: 'from-B' });
      } else {
        res.status(402).json({
          price: '0.005', currency: 'USDC', relay: '', recipient: '0xB',
          protocol: 'x402', nonce: 'n2', toolId: 'search',
          timestamp: Date.now(), expiresAt: Date.now() + 30000, accepts: ['circle-nanopay'],
        });
      }
    });
    appB.get('/v1/tools/search/price', (_req, res) => {
      res.json({ price: '0.005' });
    });

    // Relay
    const relayApp = express();
    relayApp.use(express.json());
    relayApp.post('/v1/validate', (_req, res) => {
      res.json({ valid: true, txRef: 'tx-agg', checkedAt: Date.now() });
    });

    serverA = appA.listen(0);
    serverB = appB.listen(0);
    relayServer = relayApp.listen(0);
    await Promise.all([
      new Promise((r) => serverA.on('listening', r)),
      new Promise((r) => serverB.on('listening', r)),
      new Promise((r) => relayServer.on('listening', r)),
    ]);
    portA = (serverA.address() as { port: number }).port;
    portB = (serverB.address() as { port: number }).port;
    relayPort = (relayServer.address() as { port: number }).port;
  });

  afterAll(() => {
    serverA.close();
    serverB.close();
    relayServer.close();
  });

  function createAggregator(strategy: 'cheapest' | 'fastest' | 'round-robin' | 'manual') {
    return new FlumeAggregator({
      servers: [
        { name: 'A', url: `http://localhost:${portA}` },
        { name: 'B', url: `http://localhost:${portB}` },
      ],
      strategy,
      relayUrl: `http://localhost:${relayPort}`,
      budget: { maxPerCallUsdc: '1.00', maxDailyUsdc: '100.00' },
      walletAddress: '0xcaller',
      privateKey: '0xprivkey',
    });
  }

  it('round-robin distributes calls evenly', async () => {
    const agg = createAggregator('round-robin');
    const r1 = await agg.callTool<{ result: string }>('search');
    const r2 = await agg.callTool<{ result: string }>('search');
    // One from A, one from B
    const results = [r1.data.result, r2.data.result].sort();
    expect(results).toEqual(['from-A', 'from-B']);
  });

  it('manual selects specific server', async () => {
    const agg = createAggregator('manual');
    const result = await agg.callTool<{ result: string }>('search', {}, { serverName: 'B' });
    expect(result.data.result).toBe('from-B');
  });

  it('tracks per-server spending', async () => {
    const agg = createAggregator('round-robin');
    await agg.callTool('search');
    await agg.callTool('search');
    const spending = agg.getSpending();
    expect(spending.callCount).toBe(2);
    expect(parseFloat(spending.totalSpent)).toBeGreaterThan(0);
  });

  it('queryPrices returns all server prices', async () => {
    const agg = createAggregator('cheapest');
    const prices = await agg.queryPrices('search');
    expect(prices).toHaveLength(2);
    expect(prices.find((p) => p.serverName === 'A')?.price).toBe('0.003');
    expect(prices.find((p) => p.serverName === 'B')?.price).toBe('0.005');
  });
});

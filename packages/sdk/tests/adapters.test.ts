import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import type { Server } from 'node:http';
import { FlumeClient } from '../src/FlumeClient.js';
import { FlumeMcpAdapter } from '../src/adapters/mcp.js';
import { createFlumeTool } from '../src/adapters/vercel-ai.js';

describe('FlumeMcpAdapter', () => {
  let server: Server;
  let relay: Server;
  let port: number;
  let relayPort: number;

  beforeAll(async () => {
    const app = express();
    app.use(express.json());
    app.post('/tools/mcp-tool', (req, res) => {
      if (req.headers['x-flume-payment']) {
        res.json({ result: 'mcp response' });
      } else {
        res.status(402).json({
          price: '0.002', currency: 'USDC', relay: '', recipient: '0xr',
          protocol: 'x402', nonce: 'n', toolId: 'mcp-tool',
          timestamp: Date.now(), expiresAt: Date.now() + 30000, accepts: ['circle-nanopay'],
        });
      }
    });

    const relayApp = express();
    relayApp.use(express.json());
    relayApp.post('/v1/validate', (_req, res) => {
      res.json({ valid: true, txRef: 'tx-mcp', checkedAt: Date.now() });
    });

    server = app.listen(0);
    relay = relayApp.listen(0);
    await Promise.all([
      new Promise((r) => server.on('listening', r)),
      new Promise((r) => relay.on('listening', r)),
    ]);
    port = (server.address() as { port: number }).port;
    relayPort = (relay.address() as { port: number }).port;
  });

  afterAll(() => {
    server.close();
    relay.close();
  });

  it('wraps MCP tool call with payment', async () => {
    const client = new FlumeClient({
      relayUrl: `http://localhost:${relayPort}`,
      walletAddress: '0xcaller',
      privateKey: '0xprivkey',
      budget: { maxPerCallUsdc: '1.00', maxDailyUsdc: '100.00' },
    });
    const adapter = new FlumeMcpAdapter(client);
    const result = await adapter.callTool<{ result: string }>({
      serverUrl: `http://localhost:${port}`,
      method: 'mcp-tool',
    });
    expect(result.data.result).toBe('mcp response');
  });
});

describe('createFlumeTool', () => {
  it('creates a tool definition with execute method', () => {
    const client = new FlumeClient({
      relayUrl: 'http://localhost:3001',
      walletAddress: '0xcaller',
      privateKey: '0xprivkey',
      budget: { maxPerCallUsdc: '1.00', maxDailyUsdc: '100.00' },
    });
    const tool = createFlumeTool(client, {
      name: 'search',
      description: 'Search tool',
      parameters: { query: { type: 'string' } },
      flumeServerUrl: 'http://localhost:3000',
    });
    expect(tool.name).toBe('search');
    expect(typeof tool.execute).toBe('function');
  });
});

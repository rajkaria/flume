import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { StatusReport, ToolStatus } from '../types/index.js';

export interface StatusOptions {
  cwd?: string;
  relayUrl?: string;
}

export async function statusCommand(options: StatusOptions = {}): Promise<StatusReport> {
  const cwd = options.cwd ?? process.cwd();
  const configPath = join(cwd, 'flume.config.json');

  // Check config
  let configValid = false;
  let configErrors: string[] | undefined;
  let tools: ToolStatus[] = [];

  if (existsSync(configPath)) {
    try {
      const raw = JSON.parse(readFileSync(configPath, 'utf-8'));
      configValid = raw.version === '1' && Array.isArray(raw.tools);
      if (configValid && Array.isArray(raw.tools)) {
        tools = raw.tools.map((t: { toolId: string; name: string; pricing?: { staticPriceUsdc?: string; strategy?: string } }) => ({
          toolId: t.toolId,
          name: t.name,
          currentPrice: t.pricing?.staticPriceUsdc ?? '0.000000',
          strategy: t.pricing?.strategy ?? 'static',
          active: true,
        }));
      }
    } catch {
      configErrors = ['Failed to parse flume.config.json'];
    }
  } else {
    configErrors = ['flume.config.json not found'];
  }

  // Check relay
  const relayUrl = options.relayUrl ?? 'https://relay.flume.xyz';
  let relayReachable = false;
  let relayLatency: number | undefined;

  try {
    const start = Date.now();
    const res = await fetch(`${relayUrl}/v1/status`, { signal: AbortSignal.timeout(5000) });
    relayLatency = Date.now() - start;
    relayReachable = res.ok;
  } catch {
    relayReachable = false;
  }

  return {
    configValid,
    configErrors,
    relay: {
      reachable: relayReachable,
      latencyMs: relayLatency,
    },
    circle: {
      connected: false, // Would check Circle API in production
      environment: 'sandbox',
    },
    arc: {
      connected: false, // Would check Arc RPC in production
    },
    tools,
  };
}

import type {
  AggregatorConfig,
  AggregatedSpending,
  ServerPriceInfo,
  CallOptions,
  ToolCallResult,
} from './types/index.js';
import { FlumeClient } from './FlumeClient.js';
import { FlumeToolUnavailableError } from './errors.js';

export class FlumeAggregator {
  private readonly config: AggregatorConfig;
  private readonly clients: Map<string, FlumeClient>;
  private roundRobinIndex = 0;
  private spending: { totalSpent: string; callCount: number; byServer: Record<string, string> };

  constructor(config: AggregatorConfig) {
    this.config = config;
    this.clients = new Map();
    this.spending = {
      totalSpent: '0.000000',
      callCount: 0,
      byServer: {},
    };

    for (const server of config.servers) {
      this.clients.set(server.name, new FlumeClient({
        relayUrl: config.relayUrl,
        walletAddress: config.walletAddress,
        privateKey: config.privateKey,
        budget: config.budget,
      }));
      this.spending.byServer[server.name] = '0.000000';
    }
  }

  async callTool<T = unknown>(
    toolId: string,
    params: Record<string, unknown> = {},
    options?: CallOptions & { serverName?: string },
  ): Promise<ToolCallResult<T>> {
    const server = await this.selectServer(toolId, options?.serverName);
    const client = this.clients.get(server.serverName);
    if (!client) throw new FlumeToolUnavailableError(toolId);

    const result = await client.callTool<T>(server.url, toolId, params, options);

    // Track spending per server
    const serverSpent = parseFloat(this.spending.byServer[server.serverName] ?? '0');
    this.spending.byServer[server.serverName] = (serverSpent + parseFloat(result.price)).toFixed(6);
    this.spending.totalSpent = (parseFloat(this.spending.totalSpent) + parseFloat(result.price)).toFixed(6);
    this.spending.callCount++;

    return result;
  }

  async queryPrices(toolId: string): Promise<ServerPriceInfo[]> {
    const results: ServerPriceInfo[] = [];
    for (const server of this.config.servers) {
      const start = Date.now();
      try {
        const res = await fetch(`${server.url}/v1/tools/${toolId}/price`);
        const data = await res.json() as { price: string };
        results.push({
          serverName: server.name,
          url: server.url,
          price: data.price,
          available: true,
          latencyMs: Date.now() - start,
        });
      } catch {
        results.push({
          serverName: server.name,
          url: server.url,
          price: '0',
          available: false,
          latencyMs: Date.now() - start,
        });
      }
    }
    return results;
  }

  getSpending(): AggregatedSpending {
    return { ...this.spending };
  }

  private async selectServer(
    toolId: string,
    manualServerName?: string,
  ): Promise<{ serverName: string; url: string }> {
    const servers = this.config.servers;
    if (servers.length === 0) throw new FlumeToolUnavailableError(toolId);

    switch (this.config.strategy) {
      case 'manual': {
        const server = servers.find((s) => s.name === manualServerName);
        if (!server) throw new FlumeToolUnavailableError(toolId);
        return { serverName: server.name, url: server.url };
      }

      case 'round-robin': {
        const server = servers[this.roundRobinIndex % servers.length]!;
        this.roundRobinIndex++;
        return { serverName: server.name, url: server.url };
      }

      case 'cheapest': {
        const prices = await this.queryPrices(toolId);
        const available = prices.filter((p) => p.available).sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        if (available.length === 0) throw new FlumeToolUnavailableError(toolId);
        return { serverName: available[0]!.serverName, url: available[0]!.url };
      }

      case 'fastest': {
        // Return first server (in production, would race all)
        const server = servers[0]!;
        return { serverName: server.name, url: server.url };
      }
    }
  }
}

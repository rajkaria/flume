# @flume/sdk

Agent-side client for calling Flume-wrapped tools with automatic payment.

## FlumeClient

```typescript
import { FlumeClient } from '@flume/sdk';

const client = new FlumeClient({
  relayUrl: 'https://relay.flume.xyz',
  walletAddress: '0xYourWallet',
  privateKey: '0xYourPrivateKey',
  budget: { maxPerCallUsdc: '1.00', maxDailyUsdc: '50.00' },
});

const result = await client.callTool<{ answer: string }>(
  'https://tool-server.example.com',
  'search',
  { query: 'TypeScript generics' },
);
```

### Auto-pay flow

1. Call tool → if `200`, return result
2. If `402` → parse price, check budget
3. If price OK → sign payment, validate with relay
4. Retry with `X-Flume-Payment` header
5. Update spending state

## FlumeAggregator

Multi-server routing with four strategies:

```typescript
import { FlumeAggregator } from '@flume/sdk';

const agg = new FlumeAggregator({
  servers: [
    { name: 'server-a', url: 'https://a.example.com' },
    { name: 'server-b', url: 'https://b.example.com' },
  ],
  strategy: 'cheapest', // 'cheapest' | 'fastest' | 'round-robin' | 'manual'
  relayUrl: 'https://relay.flume.xyz',
  budget: { maxPerCallUsdc: '1.00', maxDailyUsdc: '100.00' },
  walletAddress: '0x...',
  privateKey: '0x...',
});
```

## Adapters

### MCP

```typescript
import { FlumeMcpAdapter } from '@flume/sdk';
const adapter = new FlumeMcpAdapter(client);
const result = await adapter.callTool({ serverUrl, method: 'search' });
```

### Vercel AI SDK

```typescript
import { createFlumeTool } from '@flume/sdk';
const tool = createFlumeTool(client, { name: 'search', description: '...', parameters: {}, flumeServerUrl: '...' });
```

## Error handling

```typescript
import { FlumeMaxPriceExceededError, FlumeBudgetExhaustedError } from '@flume/sdk';

try {
  await client.callTool(url, toolId);
} catch (err) {
  if (err instanceof FlumeMaxPriceExceededError) { /* price too high */ }
  if (err instanceof FlumeBudgetExhaustedError) { /* daily budget spent */ }
}
```

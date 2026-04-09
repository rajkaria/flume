# Quickstart

Monetize your MCP server with USDC payments in 5 minutes.

## Prerequisites

- Node.js 20+
- pnpm
- An MCP-compatible tool server

## 1. Install

```bash
pnpm add @flume/gateway
```

## 2. Initialize config

Create `flume.config.json` in your project root:

```json
{
  "version": "1",
  "relay": "https://relay.flume.xyz",
  "ownerWallet": "YOUR_WALLET_ADDRESS",
  "tools": [
    {
      "toolId": "my-tool",
      "name": "My Tool",
      "protocol": "x402",
      "pricing": {
        "strategy": "static",
        "staticPriceUsdc": "0.005"
      },
      "settlementWallet": "YOUR_SETTLEMENT_WALLET"
    }
  ],
  "spendingPolicy": {
    "maxPerCallUsdc": "1.00",
    "maxDailyPerCallerUsdc": "100.00"
  }
}
```

## 3. Add middleware

```typescript
import express from 'express';
import { flumeMiddleware, loadConfig } from '@flume/gateway';

const app = express();
app.use(express.json());

const config = loadConfig('./flume.config.json');
app.use(flumeMiddleware(config));

// Your tool endpoint
app.post('/tools/my-tool', (req, res) => {
  res.json({ result: 'Hello from my tool!' });
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

## 4. Test it

Without payment:
```bash
curl -X POST http://localhost:3000/tools/my-tool
# Returns 402 with payment instructions
```

The 402 response tells the agent how to pay. The `@flume/sdk` FlumeClient handles this automatically.

## 5. Connect an agent

```typescript
import { FlumeClient } from '@flume/sdk';

const client = new FlumeClient({
  relayUrl: 'https://relay.flume.xyz',
  walletAddress: 'AGENT_WALLET',
  privateKey: 'AGENT_PRIVATE_KEY',
  budget: { maxPerCallUsdc: '1.00', maxDailyUsdc: '50.00' },
});

const result = await client.callTool('http://localhost:3000', 'my-tool');
console.log(result.data);   // { result: 'Hello from my tool!' }
console.log(result.price);  // '0.005000'
console.log(result.txRef);  // 'tx-...'
```

## Next steps

- [Dynamic Pricing](/guides/dynamic-pricing) — 6 pricing strategies
- [Spending Policies](/guides/spending-policies) — rate limiting and budgets
- [Dashboard](/guides/dashboard) — monitor earnings in real-time

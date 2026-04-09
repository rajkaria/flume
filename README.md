# Flume

**Payment infrastructure for AI agents.** Five composable npm packages that wrap any MCP server or HTTP API and make it chargeable per call in USDC, via Circle Nanopayments on Arc.

## Packages

| Package | Description |
|---------|-------------|
| `@flume/gateway` | Server middleware — PaymentGate, SpendingPolicy, DynamicPricing, ProtocolBridge |
| `@flume/arc` | Circle + Arc integration — NanopayVerifier, EarningsLedger, WalletManager, FlumeRelay |
| `@flume/sdk` | Agent-side client — FlumeClient, FlumeAggregator, MCP + Vercel AI adapters |
| `@flume/cli` | Developer CLI — `flume init`, `status`, `audit`, `wallet`, `deploy` |
| `@flume/contracts` | Solidity on Arc — FlumeRegistry, EscrowVault, RevenueSplit |

## Quick start

```bash
pnpm add @flume/gateway
```

```typescript
import { flumeMiddleware, loadConfig } from '@flume/gateway';

const config = loadConfig('./flume.config.json');
app.use(flumeMiddleware(config));
```

Your server now returns `402 Payment Required` with x402-compliant payment instructions. Any agent using `@flume/sdk` pays automatically.

## Key features

- **Six pricing strategies** — static, time-of-day, demand, tiered, A/B test, auto-negotiate
- **SpendingPolicy** — per-call limits, daily budgets, allowlist/blocklist
- **EarningsLedger** — tamper-evident SHA-256 hash-chained audit log
- **Session protocol** — pre-authorize a budget, make calls within session
- **Multi-server aggregation** — cheapest, fastest, round-robin, manual routing
- **Zero gas fees** — Circle Nanopayments on Arc

## Architecture

```
Agent (FlumeClient) → Tool Server (PaymentGate)
         ↓ 402                    ↓
    Pay via Relay ──────→ NanopayVerifier → EarningsLedger
         ↓                        ↓
    Retry with proof     ArcSettler → FlumeRegistry (on-chain)
```

## Development

```bash
pnpm install
pnpm test        # Run all tests
pnpm typecheck   # TypeScript strict mode
pnpm build       # Build all packages
```

## Examples

See `examples/` for runnable projects:
- `mcp-server` — MCP server with 3 tools
- `http-api` — Express REST API
- `agent-client` — Agent with budget tracking
- `aggregator` — Multi-server routing

## Built with

- Circle Nanopayments + Developer Wallets
- Arc (EVM L1)
- TypeScript (strict mode)
- Vitest (140+ tests)
- Express, Supabase, Upstash Redis, BullMQ

## License

MIT

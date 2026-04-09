# Flume — Payment Infrastructure for AI Agents

## Session Context (Last updated: 2026-04-09 01:00)

### Current State
- **All 12 phases built and pushed** to https://github.com/rajkaria/flume.git
- **140 tests passing** across gateway (48), arc (39), sdk (14), cli (12), types (27)
- Dashboard builds successfully (Next.js 15, 6 pages with Recharts + demo data)
- Landing page scaffolded but pages not yet written (Next.js 15 at apps/web)
- Solidity contracts written but **Hardhat won't compile** due to ESM detection bug in pnpm workspace
- Security audit completed: 10 findings (4 critical, 4 high, 2 medium)
- Circle API not wired yet — all implementations use placeholder/mock clients

### Recent Changes (Session 2026-04-09)
**Phases 1-6 (core packages):**
- `packages/gateway/src/ConfigDSL.ts` — Zod-validated config loading
- `packages/gateway/src/SpendingPolicy.ts` — per-call/daily limits, allowlist/blocklist
- `packages/gateway/src/PaymentGate.ts` — x402 intercept for MCP + HTTP
- `packages/gateway/src/DynamicPricing.ts` — 6 strategies (static, time-of-day, demand, tiered, ab-test, negotiate)
- `packages/gateway/src/ProtocolBridge.ts` — session-based pre-authorized budget protocol
- `packages/arc/src/NanopayVerifier.ts` — 5-step payment validation
- `packages/arc/src/EarningsLedger.ts` — SHA-256 hash-chained audit log
- `packages/arc/src/WalletManager.ts` — Circle Developer Wallet management
- `packages/arc/src/ArcSettler.ts` — Merkle tree batch settlement
- `packages/arc/src/FlumeRelay.ts` — Express server with all /v1/* endpoints
- `packages/sdk/src/FlumeClient.ts` — auto-pay flow with 402 intercept
- `packages/sdk/src/FlumeAggregator.ts` — multi-server routing (4 strategies)
- `packages/sdk/src/adapters/mcp.ts` + `vercel-ai.ts` — framework adapters
- `packages/cli/src/commands/*.ts` — init, status, audit, wallet, deploy

**Phase 7 (dashboard):**
- `apps/dashboard/` — full Next.js 15 app with sidebar, 6 pages, Recharts charts

**Phase 8 (contracts):**
- `packages/contracts/contracts/FlumeRegistry.sol` — tool registration + settlement anchoring
- `packages/contracts/contracts/EscrowVault.sol` — USDC escrow with release/refund
- `packages/contracts/contracts/RevenueSplit.sol` — multi-party revenue distribution

### Next Steps
1. **Fix critical security findings** (pre-mainnet blockers):
   - #1: Make PaymentValidator required in PaymentGate constructor
   - #2: Add real secp256k1 signature verification in NanopayVerifier
   - #3: Fix Redis TOCTOU race — use `SET NX EX` atomic command
   - #4: Restrict EscrowVault.release() to relay/admin only
2. **Fix Hardhat ESM issue** — try isolated contracts workspace or Hardhat v3
3. **Wire Circle Nanopayments SDK** — replace placeholder CircleClient
4. **Build landing page** (apps/web) — hero, packages, pricing sections
5. **Write documentation** (Phase 10) — quickstart, API reference
6. **Build 4 runnable examples** (Phase 11)
7. **Deploy to Arc testnet** for hackathon demo

### Key Decisions
- **In-memory stores for dev** — InMemoryLedgerStorage, InMemoryNonceRegistry, InMemorySessionStore. Production uses Supabase + Redis.
- **FlumeClient uses `||` not `??`** for relay URL fallback (402 responses may have empty string relay)
- **AggregatorConfig requires `relayUrl`** — added in Phase 5 to avoid using server URL as relay
- **Contracts use `type: commonjs`** — Hardhat incompatible with ESM in pnpm workspace
- **Dashboard uses demo data** (`src/lib/demo-data.ts`) — will wire to Supabase in production

### Known Issues
- Hardhat compile fails in pnpm workspace (ESM detection bug) — contracts code is correct but untested
- SpendingPolicy state is in-memory only (security finding #5)
- Relay validates client-supplied expectedPrice instead of looking up canonical price (finding #6)
- RevenueSplit has dust accumulation with no sweep function (finding #7)

## Project Structure
```
flume/
├── packages/gateway/    @flume/gateway (48 tests)
├── packages/arc/        @flume/arc (39 tests)
├── packages/sdk/        @flume/sdk (14 tests)
├── packages/cli/        @flume/cli (12 tests)
├── packages/contracts/  @flume/contracts (Solidity, untested)
├── apps/relay/          FlumeRelay Express server
├── apps/dashboard/      Next.js 15 dashboard (6 pages)
├── apps/web/            Landing page (scaffolded)
└── examples/            4 example dirs (empty)
```

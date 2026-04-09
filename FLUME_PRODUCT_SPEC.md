# Flume — Product Spec v1.0

> **The payment infrastructure layer for the agentic economy.**
> Five composable packages that turn any MCP server or HTTP API into a monetized service — charging per call in USDC via Circle Nanopayments on Arc, with no gas fees, no wallets to manage, and no human in the loop.

---

## THE ONE THING THAT DEFINES FLUME

> **Flume is the Stripe for AI agents — the infrastructure layer that makes any tool, API, or MCP server chargeable per call, with USDC flowing in milliseconds, fully autonomously.**

Not a payment app. Not a wallet. Flume is infrastructure — five composable packages that any developer wraps around their existing tool in minutes, and any agent pays through without a credit card, account signup, or human approval.

A flume is a precisely engineered channel — water (or value) flows through it in one direction, at a controlled rate, to exactly where it needs to go. Flume is that channel for the agentic economy: every tool call becomes a metered flow of USDC from agent to tool owner, measured to six decimal places, with nothing leaking and nothing blocked that should pass.

Just as Stripe made it trivial to accept payments on the internet, Flume makes it trivial to accept sub-cent USDC payments from AI agents. The unit economics that were previously impossible — $0.001 per tool call, $0.000001 per token — become viable infrastructure.

---

## THE PROBLEM

The agentic economy has a payment problem. Specifically, three of them.

**Problem 1: Tools are free or subscription-priced — neither works for agents.**
Every AI tool today either charges per-seat subscriptions (built for humans, not agents) or is entirely free (not sustainable at scale). There is no primitive for "charge $0.002 per call and collect it from any agent that calls you." This makes the agentic economy unmonetizable for the builders creating it.

**Problem 2: Agents have no payment identity.**
When an AI agent calls an API, it has no payment method. It cannot have a credit card. It cannot create an account. It cannot sign a subscription form. The only things an agent can natively do are: hold a crypto wallet, sign a transaction, or pass an API key provided by a human. Flume makes the first option the universal standard — and abstracts all the complexity away from both sides.

**Problem 3: Sub-cent transactions are economically impossible on traditional rails.**
An API call worth $0.002 cannot be charged via Stripe (minimum $0.30 fee), billed via invoice (overhead exceeds value), or settled per-transaction on a blockchain (gas costs dwarf the payment). Circle Nanopayments changes this by batching thousands of transactions into a single on-chain settlement on Arc — making $0.000001 payments economically viable for the first time. Flume is the developer-facing layer that makes this accessible without understanding Circle's SDK internals.

**The gap Flume fills:**
Circle Nanopayments is powerful infrastructure. Flume is the developer experience layer that makes it usable by any MCP server builder, API owner, or AI tool creator in under five minutes.

---

## WHO FLUME IS FOR

### Primary: MCP Server Builders
Developers who have built MCP servers providing tools to Claude, Cursor, and other AI agents. They have valuable tools — competitor intelligence, web scraping, code analysis, data enrichment — but no way to charge for them. Flume lets them wrap their server with five lines of config and start earning USDC per call.

*Arjun built a competitor intelligence MCP server. 200 people use it for free. He wants to charge $0.005 per query. Flume gives him a config file, a Circle Wallet, and a dashboard. He ships in 20 minutes.*

### Secondary: HTTP API Builders
Teams running HTTP APIs powering AI workflows — code execution, document parsing, image analysis, web search. They want per-call monetization without building a payment system. Flume gives them x402-compliant payment gating with a hosted facilitator and zero Circle integration code to write.

*A startup running a legal document analysis API wants to charge $0.01 per document. Flume gives them USDC collection from any agent, no Stripe account, no billing infrastructure to maintain.*

### Tertiary: Agent Developers
Developers building autonomous agents that need to pay for tools without human intervention. Flume gives them a Circle Wallet-backed treasury, a budget-aware client SDK, and automatic payment handling across any Flume-wrapped tool they call.

*A trading agent calls three tools per decision cycle: a price oracle ($0.001), an execution verifier ($0.005), and a news feed ($0.002). FlumeClient handles all three payments from the agent wallet, tracks spending against daily limits, and surfaces any policy violations.*

### Future: Enterprises
Companies deploying agent fleets at scale who need spending controls, tamper-evident audit trails, compliance reporting, and managed USDC payment infrastructure across dozens of agents. Flume's enterprise tier handles fleet-level budget guardrails, per-agent limits, allowlists, and ISO-standard payment receipts.

---

## CORE CONCEPTS

### 1. PaymentGate
The middleware that sits between an agent's tool call and the tool's execution. Every call passes through PaymentGate: if payment is confirmed, the call proceeds; if not, PaymentGate returns an HTTP 402 with price and payment instructions. The tool owner writes no payment logic.

### 2. SpendingPolicy
The trust primitive for agent payments. Enforces per-call limits, daily budgets, caller allowlists and blocklists, and anomaly detection — before payment is validated, not after. SpendingPolicy is what makes it safe to accept autonomous agent payments at scale.

### 3. EarningsLedger
Tamper-evident accounting for every payment event. Every validated payment, every rejection, every policy violation is recorded with a SHA-256 hash linking it to the previous entry — creating a cryptographically linked audit chain. Anchored periodically to Arc for external verifiability.

### 4. ProtocolBridge
Dual-protocol payment support. x402 for per-call payments (HTTP 402 → sign → retry, settled via Circle Nanopayments batch). Sessions for bulk payments (pre-authorize a budget, call freely within it, settle at session end). ProtocolBridge chooses the right protocol per tool call based on configuration.

### 5. ConfigDSL
Declarative JSON configuration for everything Flume controls: tools, prices, pricing strategies, spending policies, sessions, webhooks, API keys, and circuit breakers. No payment logic in application code — all payment behavior lives in one config file that can be changed without a deploy.

### 6. DynamicPricing
A pricing engine with six strategies: static (flat per-call), time-of-day (higher during peak), demand-based (higher when load is elevated), tiered volume (discounts for high-volume callers), A/B test (split traffic between two prices to find optimal), and auto-negotiation (agent SDK and server agree on price dynamically). Any tool can use any strategy independently.

---

## FIVE COMPOSABLE PACKAGES

Each package is independently useful. Together they form a complete agent revenue stack.

```
┌─────────────────────────────────────────────────────────────────────┐
│  @flume/gateway   Server middleware — PaymentGate, SpendingPolicy,  │
│                    ProtocolBridge, ConfigDSL, DynamicPricing,        │
│                    health routes, metrics, webhooks                   │
├─────────────────────────────────────────────────────────────────────┤
│  @flume/arc       Circle Nanopayments verifier, EarningsLedger,     │
│                    Arc anchoring, attestations, Circle Wallets        │
├─────────────────────────────────────────────────────────────────────┤
│  @flume/sdk       FlumeClient (agent), FlumeAggregator            │
│                    Auto-pay, budget tracking, multi-server routing    │
├─────────────────────────────────────────────────────────────────────┤
│  @flume/cli       flume init, flume status, flume deploy,        │
│                    flume audit, flume wallet                        │
├─────────────────────────────────────────────────────────────────────┤
│  @flume/contracts FlumeRegistry, EscrowVault, RevenueSplit          │
│                    Solidity on Arc — anchoring and settlement         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## PRODUCT ARCHITECTURE

```
┌──────────────────────────────────────────────────────────────────────┐
│                    AGENT LAYER (any framework)                        │
│    Claude / LangChain / AutoGPT / Eliza / CrewAI / custom agents     │
│                                                                        │
│    FlumeClient — auto-pay, budget tracking, multi-server aggregation │
│    Circle Wallet  — agent USDC treasury, no raw key exposure          │
└──────────────────────────────┬───────────────────────────────────────┘
                               │ Tool call (MCP JSON-RPC or HTTP)
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                  @flume/gateway                                       │
│                                                                        │
│  flume.config.json                                                   │
│  {                                                                     │
│    "network": "mainnet",                                              │
│    "settlementWallet": "0x...",                                       │
│    "tools": {                                                          │
│      "competitor_scan": {                                             │
│        "price": "0.005",                                             │
│        "pricingStrategy": "demand",                                  │
│        "protocol": "x402"                                            │
│      },                                                               │
│      "full_report": {                                                 │
│        "price": "0.05",                                              │
│        "pricingStrategy": "static",                                  │
│        "protocol": "session"                                         │
│      }                                                                │
│    },                                                                 │
│    "spendingPolicy": {                                               │
│      "maxPerCall": "0.10",                                           │
│      "maxDailyPerCaller": "1.00",                                    │
│      "maxDailyGlobal": "50.00"                                       │
│    }                                                                  │
│  }                                                                    │
│                                                                        │
│  PaymentGate intercepts every call:                                   │
│  1. SpendingPolicy check — reject if caller over budget               │
│  2. Check payment header — present or absent?                         │
│  3. If absent  → HTTP 402 { price, relay, recipient, protocol }      │
│  4. If present → validate via @flume/arc                             │
│  5. If valid   → forward to tool, log to EarningsLedger              │
│  6. If invalid → reject 402, log violation                           │
└──────────┬────────────────────────────────────┬──────────────────────┘
    No payment (fresh call)                       Payment header present
           │                                                │
           ▼                                                ▼
  HTTP 402 Response                      ┌──────────────────────────────┐
  {                                      │     @flume/arc              │
   price: "0.005",                       │     (Flume Relay Service)   │
   currency: "USDC",                     │                              │
   relay: "relay.flume.xyz",            │  POST /v1/validate           │
   recipient: "0x...",                   │  { proof, toolId, amount,    │
   protocol: "x402",                     │    agentWallet, nonce }      │
   nonce: "abc123"                       │                              │
  }                                      │  Circle Nanopayments         │
           │                             │  validatePayment()           │
           ▼                             │                              │
  FlumeClient pays:                     │  Nonce registry (Redis)      │
  Signs USDC via Circle Wallet           │  Timestamp window check      │
  Sends proof to Relay                   │  Signature verification      │
                                         │  Amount validation           │
                                         │  SpendingPolicy enforce      │
                                         │                              │
                                         │  → { valid: true, txRef }    │
                                         └──────────────┬───────────────┘
                                                        │
                                         ┌──────────────▼───────────────┐
                                         │  Circle Nanopayments         │
                                         │  Batch settlement engine     │
                                         │                              │
                                         │  1000s of micro-payments     │
                                         │  → single batch tx on Arc    │
                                         │  → tool owner wallet funded  │
                                         │  → zero gas per payment      │
                                         └──────────────┬───────────────┘
                                                        │
                                         ┌──────────────▼───────────────┐
                                         │  Arc (EVM L1)                │
                                         │  USDC batch settlements      │
                                         │  FlumeRegistry contract     │
                                         │  EarningsLedger anchoring    │
                                         │  Attestation receipts        │
                                         └──────────────┬───────────────┘
                                                        │
                                         ┌──────────────▼───────────────┐
                                         │  Flume Dashboard            │
                                         │  app.flume.xyz              │
                                         │  Revenue, analytics,         │
                                         │  audit log, settlements      │
                                         └──────────────────────────────┘
```

---

## @flume/gateway

The server middleware package. All payment logic lives here. Tool owners import this and nothing else for basic setup.

**Installation:**
```bash
npm install @flume/gateway
```

**Two-line integration (MCP server):**
```typescript
import { flumeMiddleware, loadConfig } from '@flume/gateway';

const config = loadConfig('./flume.config.json');
server.use(flumeMiddleware(config));  // PaymentGate active
```

**Two-line integration (Express HTTP API):**
```typescript
import { flumeMiddleware, loadConfig } from '@flume/gateway';

const config = loadConfig('./flume.config.json');
app.use('/api', flumeMiddleware(config));  // All /api/* routes gated
```

**flume.config.json — the ConfigDSL:**
```json
{
  "network": "mainnet",
  "settlementWallet": "0x...",
  "facilitatorUrl": "https://relay.flume.xyz",

  "tools": {
    "competitor_scan": {
      "price": "0.005",
      "currency": "USDC",
      "protocol": "x402",
      "pricingStrategy": "demand",
      "freeTier": { "callsPerDay": 5, "per": "caller" }
    },
    "full_report": {
      "price": "0.05",
      "currency": "USDC",
      "protocol": "session",
      "pricingStrategy": "tiered",
      "tiers": [
        { "minCalls": 0,   "maxCalls": 100,  "price": "0.05" },
        { "minCalls": 101, "maxCalls": 500,  "price": "0.04" },
        { "minCalls": 501, "maxCalls": null, "price": "0.03" }
      ]
    },
    "health_check": {
      "price": "0",
      "protocol": "free"
    }
  },

  "spendingPolicy": {
    "maxPerCall": "0.10",
    "maxDailyPerCaller": "2.00",
    "maxDailyGlobal": "100.00",
    "allowlist": [],
    "blocklist": [],
    "anomalyMultiplier": 3.0
  },

  "pricing": {
    "timeOfDay": {
      "enabled": true,
      "peakHours": [9, 10, 11, 14, 15, 16],
      "peakMultiplier": 1.5
    },
    "abTest": {
      "enabled": false,
      "variantA": { "price": "0.005", "weight": 0.5 },
      "variantB": { "price": "0.008", "weight": 0.5 }
    }
  },

  "webhooks": [
    {
      "url": "https://your-server.com/webhooks/flume",
      "events": ["payment.validated", "policy.violation", "budget.exhausted", "settlement.completed"],
      "secret": "whsec_..."
    }
  ],

  "apiKeys": [
    { "key": "sk_...", "name": "production", "scopes": ["read", "write"] }
  ]
}
```

**Health Routes (auto-created):**
```
GET  /health              Overall health: relay status, Circle API, Arc connectivity
GET  /health/tools        All tools with current prices and availability
GET  /health/cost/:tool   Current price for a specific tool (for agents to query)
GET  /metrics             Prometheus metrics endpoint
```

**What @flume/gateway exports:**
- `flumeMiddleware(config)` — main middleware
- `loadConfig(path)` — config loader with validation
- `createHealthRoutes(config)` — health + cost endpoints
- `PaymentGate` — standalone class for custom integrations
- `SpendingPolicy` — standalone policy enforcer
- `DynamicPricing` — standalone pricing engine
- `ConfigDSL` — config parser and validator
- Types: `FlumeConfig`, `ToolConfig`, `SpendingPolicyConfig`, `PricingStrategy`

---

## @flume/arc

The Arc and Circle integration package. Handles payment validation, EarningsLedger, on-chain anchoring, and Circle Wallet management.

**Installation:**
```bash
npm install @flume/arc
```

**EarningsLedger — tamper-evident accounting:**
Every payment event is recorded with a SHA-256 hash linking it to the previous entry — forming a cryptographically linked chain. If any record is modified, the chain breaks. Anchored to Arc every N minutes for external verifiability.

```typescript
import { EarningsLedger } from '@flume/arc';

const ledger = new EarningsLedger({ supabaseUrl, supabaseKey });

// Record a payment (called internally by PaymentGate)
await ledger.record({
  type: 'payment.validated',
  txRef: 'np_...',
  toolId: 'competitor_scan',
  callerWallet: '0x...',
  amount: '0.005',
  currency: 'USDC',
  protocol: 'x402',
});

// Hash chain: each entry includes SHA-256(previousHash + currentData)
// If entry 47 is altered, entries 48+ all become invalid — tamper-evident

// Anchor to Arc (called by settlement engine every 15 min)
const anchorTx = await ledger.anchorToArc();
// anchorTx.hash: Arc transaction containing merkle root of last N entries
```

**Circle Nanopayments Verifier:**
```typescript
import { NanopayVerifier } from '@flume/arc';

const verifier = new NanopayVerifier({
  circleApiKey: process.env.CIRCLE_API_KEY,
  network: 'mainnet',
});

const result = await verifier.validate({
  paymentProof, toolId, amount, callerWallet, nonce, timestamp
});
// result.valid: boolean
// result.txRef: string (reference for EarningsLedger)
// result.batchId: string (Circle Nanopayments batch)
```

**Circle Wallet Management:**
```typescript
import { WalletManager } from '@flume/arc';

const wallets = new WalletManager({ circleApiKey: process.env.CIRCLE_API_KEY });

// Create tool owner settlement wallet
const toolWallet = await wallets.createToolWallet({ label: 'My MCP Server' });
// toolWallet.address: "0x..."  — fund this to start; payments flow here

// Create agent wallet
const agentWallet = await wallets.createAgentWallet({
  agentId: 'trading-agent-v1',
  initialBalance: 1.00,  // USDC
  autoFund: {
    triggerBalance: 0.10,
    refillAmount: 1.00,
    sourceWallet: '0x...',
  }
});
```

**Attestation Generation:**
```typescript
import { Attestor } from '@flume/arc';

const attestor = new Attestor({ relaySigningKey: process.env.RELAY_KEY });

// Generate signed payment receipt
const receipt = await attestor.generate({
  txRef, toolId, callerWallet, amount, timestamp, arcAnchor, merkleProof
});

// Anyone can verify without trusting Flume
const valid = await Attestor.verify(receipt);
```

**What @flume/arc exports:**
- `NanopayVerifier` — Circle Nanopayments payment validation
- `EarningsLedger` — tamper-evident payment audit log
- `WalletManager` — Circle Developer Wallet creation and management
- `Attestor` — signed payment receipt generation and verification
- `ArcSettler` — batch settlement anchoring to Arc contracts
- `FlumeRelay` — full hosted relay server (what relay.flume.xyz runs)

---

## @flume/sdk

The agent-side package. FlumeClient handles the entire payment flow: detects 402, signs USDC payment from Circle Wallet, retries with proof, tracks spending against budget. Zero payment logic in agent code.

**Installation:**
```bash
npm install @flume/sdk
```

**FlumeClient — single-server agent:**
```typescript
import { FlumeClient } from '@flume/sdk';

const client = new FlumeClient({
  walletAddress: process.env.AGENT_WALLET,
  circleApiKey: process.env.CIRCLE_API_KEY,
  budget: {
    maxPerCall: '0.10',     // Refuse calls priced above this
    maxDaily: '5.00',       // Pause after $5.00/day
    maxSession: '1.00',     // Session cap (for session protocol)
  }
});

// Call any Flume-wrapped MCP tool — payment is invisible
const result = await client.callTool('competitor_scan', { domain: 'stripe.com' });

// Budget tracking
const spending = client.getSpending();
// { totalSpent: '0.035', callCount: 7, lastCall: '2026-04-20T...' }
```

**FlumeAggregator — multi-server agent:**
```typescript
import { FlumeAggregator } from '@flume/sdk';

const aggregator = new FlumeAggregator({
  walletAddress: process.env.AGENT_WALLET,
  circleApiKey: process.env.CIRCLE_API_KEY,
  servers: [
    { url: 'https://watchdog.example.com', name: 'watchdog' },
    { url: 'https://bench.example.com',    name: 'bench' },
    { url: 'https://newsapi.example.com',  name: 'news' },
  ],
  budget: { maxDaily: '10.00' },
  routing: 'cheapest',  // 'cheapest' | 'fastest' | 'round-robin' | 'manual'
});

// Call tool by name — aggregator finds the right server, handles payment
const result = await aggregator.callTool('competitor_scan', { domain: 'stripe.com' });

// Unified spending across all servers
const spending = aggregator.getSpending();
// { totalSpent: '0.127', byServer: { watchdog: '0.05', bench: '0.077' } }
```

**Framework Adapters (bundled in @flume/sdk):**
```typescript
// Claude MCP adapter
import { FlumeMCPAdapter } from '@flume/sdk/adapters/mcp';
const client = new FlumeMCPAdapter({ walletAddress, circleApiKey });
const wrappedClient = client.wrap(existingMcpClient);

// LangChain adapter
import { FlumeToolkit } from '@flume/sdk/adapters/langchain';
const toolkit = new FlumeToolkit({ walletAddress, circleApiKey });
const tools = toolkit.wrap(existingTools);

// Vercel AI SDK adapter
import { withFlume } from '@flume/sdk/adapters/vercel-ai';
const tools = withFlume(existingTools, { walletAddress, circleApiKey });

// Eliza plugin
import { FlumeElizaPlugin } from '@flume/sdk/adapters/eliza';
```

**What @flume/sdk exports:**
- `FlumeClient` — single-server agent client with auto-pay and budget tracking
- `FlumeAggregator` — multi-server aggregation with routing strategies
- Framework adapters: MCP, LangChain, Vercel AI SDK, Eliza
- Types: `SpendingState`, `BudgetConfig`, `RoutingStrategy`

---

## @flume/cli

Developer CLI for project scaffolding, status checks, and operations.

**Installation:**
```bash
npm install -g @flume/cli
# or
npx @flume/cli <command>
```

**Commands:**

`flume init`
Scaffold a new Flume project. Prompts for: MCP or HTTP API, tool names and prices, pricing strategies, spending policy. Outputs a `flume.config.json` and updated `package.json`. Creates a Circle Wallet and writes the address to config. Start from zero to earning-ready in under 5 minutes.

```bash
$ flume init
? Project type: MCP Server
? Tool names (comma-separated): competitor_scan, quick_lookup, full_report
? Default price per call (USDC): 0.005
? Pricing strategy: demand-based
? Create Circle Wallet now? Yes
✓ Created settlement wallet: 0x3a4f...
✓ Written flume.config.json
✓ Ready — fund 0x3a4f... with USDC and start your server
```

`flume status`
Validate config, check relay connectivity, show current pricing and tool availability. Catches config errors before runtime.

```bash
$ flume status
Config:       ✓ Valid (3 tools)
Relay:        ✓ Connected (relay.flume.xyz, 43ms)
Circle API:   ✓ Connected
Arc:          ✓ Connected (block 4,829,441)
Wallet:       0x3a4f...  Balance: 12.45 USDC

Tools:
  competitor_scan   $0.007 (demand, peak hours active)
  quick_lookup      $0.001 (static)
  full_report       $0.05  (session protocol)
  health_check      FREE
```

`flume audit`
View EarningsLedger with filter options. Shows payments, rejections, policy violations. Exports to CSV.

```bash
$ flume audit --last 24h
Period: last 24 hours

Payments:    147 validated
Rejected:      3 (policy violations)
Earned:     $0.847 USDC
Settled:    $0.712 USDC (2 batches, Arc txns: 0xab12..., 0xcd34...)
Pending:    $0.135 USDC (next settlement in 8 min)

Recent events:
  10:47:23  PAYMENT  competitor_scan  0x8f2a...  $0.007  ✓
  10:46:11  REJECTED quick_lookup     0xbad1...  OVER_DAILY_LIMIT
  10:45:59  PAYMENT  quick_lookup     0x8f2a...  $0.001  ✓
```

`flume wallet`
Manage Circle Wallets. Create tool or agent wallets, check balances, initiate withdrawals.

```bash
$ flume wallet status
Tool wallet:   0x3a4f...  12.45 USDC  (settlement target)
Agent wallet:  0x9b2c...   1.87 USDC  (test agent)

$ flume wallet withdraw --amount 10 --to 0xmywallet
✓ Withdraw initiated: 10 USDC → 0xmywallet (Arc tx: 0xef56...)
```

`flume deploy`
Deploy the Flume relay and dashboard to production. Handles environment variable setup, health checks, and first deployment verification.

**What @flume/cli exports:**
- `init` command — project scaffolding
- `status` command — config + connectivity validation
- `audit` command — EarningsLedger viewer and exporter
- `wallet` command — Circle Wallet management
- `deploy` command — production deployment helper

---

## @flume/contracts

Solidity smart contracts deployed on Arc. Handles on-chain tool registration, batch settlement anchoring, escrow for high-value calls, and revenue splitting.

**Installation:**
```bash
npm install @flume/contracts
```

**FlumeRegistry.sol:**
```solidity
contract FlumeRegistry {
  struct Tool {
    address owner;
    address settlementWallet;
    uint256 pricePerCallWei;   // USDC (6 decimals)
    string  metadataURI;       // IPFS: tool name, description, category
    bool    active;
  }

  mapping(bytes32 => Tool) public tools;

  // Register a tool on-chain
  function registerTool(
    bytes32 toolId,
    address settlementWallet,
    uint256 pricePerCallWei,
    string calldata metadataURI
  ) external;

  // Anchor a batch settlement (called by Flume Relay every 15 min)
  function anchorSettlement(
    bytes32 batchId,
    bytes32 earningsLedgerRoot,  // Merkle root of EarningsLedger entries
    address[] calldata owners,
    uint256[] calldata amounts
  ) external;

  // Verify a payment is in an anchored batch
  function verifyPayment(
    bytes32 paymentId,
    bytes32[] calldata merkleProof,
    bytes32 batchId
  ) external view returns (bool);

  // Deactivate a tool (emergency stop)
  function deactivateTool(bytes32 toolId) external;
}
```

**EscrowVault.sol (for high-value calls):**
```solidity
contract EscrowVault {
  // Agent locks USDC in escrow before a high-value call
  function deposit(bytes32 callId, uint256 amount) external;

  // Tool owner releases on successful delivery
  function release(bytes32 callId) external;

  // Agent refunds if tool fails to deliver
  function refund(bytes32 callId) external;

  // Dispute resolution (third-party arbitration hook)
  function dispute(bytes32 callId, address arbitrator) external;
}
```

**RevenueSplit.sol (for multi-party revenue sharing):**
```solidity
contract RevenueSplit {
  struct Split {
    address[] recipients;
    uint256[] basisPoints;  // Must sum to 10000 (100%)
  }

  mapping(bytes32 => Split) public splits;

  // Configure a revenue split for a tool
  function configureSplit(
    bytes32 toolId,
    address[] calldata recipients,
    uint256[] calldata basisPoints
  ) external;

  // Execute split on settlement (called by Relay)
  function executeSplit(bytes32 toolId, uint256 totalAmount) external;
}
```

**What @flume/contracts exports:**
- Compiled contract artifacts (ABI + bytecode)
- TypeChain-generated TypeScript bindings
- Deployment scripts for Arc mainnet and testnet
- `FlumeRegistry`, `EscrowVault`, `RevenueSplit` interfaces

---

## DYNAMIC PRICING ENGINE — DETAILED

The DynamicPricing module in @flume/gateway implements six strategies. Any tool can use any strategy, independently.

### Strategy 1: Static
Flat price per call. No variation.
```json
{ "pricingStrategy": "static", "price": "0.005" }
```

### Strategy 2: Time-of-Day
Higher price during configured peak hours. Useful for tools where demand is predictable by time.
```json
{
  "pricingStrategy": "time-of-day",
  "price": "0.003",
  "peakHours": [9, 10, 11, 14, 15, 16],
  "peakMultiplier": 1.8
}
// Base: $0.003. Peak hours: $0.0054. Incentivizes off-peak usage.
```

### Strategy 3: Demand-Based
Price rises with current load (calls per minute). Smoothly throttles demand without hard rate limits.
```json
{
  "pricingStrategy": "demand",
  "price": "0.005",
  "demandCurve": [
    { "cpm": 0,  "multiplier": 1.0 },
    { "cpm": 50, "multiplier": 1.5 },
    { "cpm": 100,"multiplier": 2.5 },
    { "cpm": 200,"multiplier": 5.0 }
  ]
}
```

### Strategy 4: Tiered Volume
Per-caller discount based on how many calls they've made in the billing period. Rewards high-volume, loyal callers.
```json
{
  "pricingStrategy": "tiered",
  "tiers": [
    { "minCalls": 0,    "maxCalls": 100,  "price": "0.005" },
    { "minCalls": 101,  "maxCalls": 500,  "price": "0.004" },
    { "minCalls": 501,  "maxCalls": 2000, "price": "0.003" },
    { "minCalls": 2001, "maxCalls": null, "price": "0.002" }
  ]
}
```

### Strategy 5: A/B Test
Route a percentage of traffic to a different price point. Lets tool owners find optimal pricing without guesswork.
```json
{
  "pricingStrategy": "ab-test",
  "variants": [
    { "price": "0.003", "weight": 0.6, "label": "control" },
    { "price": "0.008", "weight": 0.4, "label": "variant" }
  ],
  "metric": "revenue"  // 'revenue' | 'volume' | 'conversion'
}
// Dashboard shows per-variant revenue to find the winner
```

### Strategy 6: Auto-Negotiation
Agent SDK proposes a price; server accepts or counter-offers. Useful for high-value calls where market price is unclear.
```json
{
  "pricingStrategy": "negotiate",
  "floor": "0.005",    // Never accept below this
  "ceiling": "0.05",   // Never charge above this
  "default": "0.02"    // Starting offer if no agent proposal
}
```

---

## FLUME RELAY SERVICE

The Flume Relay (relay.flume.xyz) is the hosted x402 facilitator. It runs `FlumeRelay` from `@flume/arc`. Tool owners point their middleware config at this URL. Agents send payment proofs here.

**Relay API:**
```
POST   /v1/validate              Core: validate payment proof
GET    /v1/status                Relay health, Circle API, Arc status
POST   /v1/wallets/create        Create Circle Wallet (tool owner or agent)
GET    /v1/wallets/:address      Balance + transaction history
GET    /v1/tools/:toolId/price   Current price (includes dynamic pricing)
POST   /v1/tools/register        Register tool with relay
GET    /v1/nonce                 Fresh nonce for payment signing
GET    /v1/attestation/:txRef    Get signed payment receipt
POST   /v1/webhooks              Register webhook endpoint
```

**Validation Flow (target: sub-200ms p50):**
1. Parse `{ paymentProof, toolId, amount, callerWallet, nonce, timestamp }`
2. Reject if timestamp > 30 seconds old
3. Check nonce hasn't been seen (Redis, 5-minute TTL)
4. Verify secp256k1 signature matches callerWallet
5. Verify amount matches tool's current dynamic price (within 1% tolerance)
6. Run SpendingPolicy check (per-caller and global limits)
7. Call Circle Nanopayments `validatePayment()`
8. Write to EarningsLedger with hash-chained entry
9. Return `{ valid: true, txRef, authorizedUntil }`

**Settlement Engine:**
BullMQ queue processes accumulated micro-payments every 15 minutes. Circle Nanopayments batch call → USDC credited to tool owner Circle Wallet → settlement anchored to Arc via FlumeRegistry contract → EarningsLedger updated with Arc tx hash → webhook emitted to tool owner.

**Production SLA:**
- 99.9% uptime (UptimeRobot + PagerDuty)
- sub-200ms validation p50, sub-500ms p99
- Redis nonce registry for replay protection
- Multi-region: US-East primary, EU-West failover
- TLS 1.3 on all endpoints
- Complete audit log retained 90 days

---

## FLUME DASHBOARD (app.flume.xyz)

**Overview:**
Real-time revenue metrics — total USDC earned (all-time, 30d, 7d, 24h), calls per minute live chart, unique callers, pending vs settled balance, next settlement countdown.

**Tool Management:**
Add/remove tools, adjust pricing config, toggle pricing strategies, enable/disable free tiers, set rate limits per tool, emergency deactivate. All changes push to ConfigDSL without server restart.

**DynamicPricing Lab:**
Visual A/B test result dashboard showing revenue per variant. Price sensitivity chart for tiered pricing. Demand curve visualization for demand-based pricing. "Recommend optimal price" button that analyzes last 7 days of call volume and suggests the revenue-maximizing price point.

**Caller Analytics:**
Top callers by spend, call frequency histograms, new vs returning agent cohorts, policy violation breakdown by caller, geographic distribution by relay request origin.

**EarningsLedger Viewer:**
Full paginated audit log — every payment, rejection, and policy violation. Filter by tool, caller, date range, event type. Download as CSV. Click any entry to verify its hash chain position. Click any Arc settlement link to view on-chain batch receipt.

**Settlement Management:**
Pending balance by tool, settlement history with Arc tx hashes, configure settlement wallet, configure frequency (default 15 min), manual settlement trigger, withdraw to any address.

**Webhooks:**
Register endpoints, select event subscriptions, view delivery log, retry failures, test endpoint.

**API Keys:**
Create scoped keys, view usage logs, instant revocation.

**Prometheus Dashboard:**
Embedded Grafana-compatible metrics view — request counts per tool, payment amounts histogram, validation latency, policy rejection rate, budget exhaustion events. All metrics also available at `/metrics` on the server (Prometheus-scrapable).

---

## AAPS STANDARD

The Arc Agent Payment Standard is a proposed open specification for interoperable agent payments on EVM chains. Flume is the reference implementation.

AAPS defines:
- The 402 response format (price, currency, relay URL, protocol, nonce)
- The payment proof format (signature scheme, nonce structure, timestamp window)
- The relay validation interface (what any compliant facilitator must implement)
- The session pre-authorization format (budget, scope, duration, settlement)
- The EarningsLedger hash-chain format (for auditable, portable accounting)

Any developer can implement AAPS without using Flume. Any agent implementing AAPS can pay any AAPS-compliant tool. The standard is to Flume what x402 is to Coinbase's facilitator — an open protocol with a reference hosted service.

**Why propose a standard:**
The same reason Stripe benefited from the existence of credit card standards. If AAPS becomes the interoperability layer, every tool implementing it creates demand for AAPS-compatible agents — and Flume is the default hosted relay. The standard creates the market; Flume captures value from the infrastructure.

AAPS will be published at aaps.flume.xyz as an open spec with a reference test suite.

---

## ASPIRATIONAL FEATURES — v2 and Beyond

### A1: Flume Registry — The Discovery Layer
A public marketplace of all Flume-registered tools. Agents discover any tool, see its pricing and pricing strategy, and call it — from one directory with unified payment. Think: npm registry for paid AI tools. Tool registration on Flume appears in Registry automatically (opt-out available). Browse by category, price range, volume, and quality score.

Flywheel: more tools → more agents discover and use → more revenue for tool owners → more tools register → Registry becomes the default way to discover paid AI tools.

### A2: Session Tokens — Bulk Pre-Authorization
Pre-authorize a USDC budget for a session. Within the session, calls proceed without 402 round-trips. At session end, actual usage settles against the pre-authorization.

```typescript
const session = await client.openSession({
  server: 'https://watchdog.example.com',
  budget: '0.10',
  tools: ['competitor_scan', 'quick_lookup'],
  duration: 300,  // 5 minutes
});
// All calls within session: no 402 overhead
// Latency: ~5ms instead of ~200ms per call
await session.close();  // Settle actual usage
```

Cuts per-call latency from ~200ms to ~5ms for high-frequency agents. Enables entirely new agent patterns where tools are called 50+ times in a workflow.

### A3: Streaming Micropayments — Pay Per Token or Per Second
Payment channel that stays open during a streaming tool response. USDC debits accumulate as tokens stream; channel settles when stream closes.

```typescript
// Server: charge per token generated
flume.streamTool('generate_analysis', async (input, stream) => {
  for await (const token of llm.stream(input)) {
    stream.emit(token);
    stream.charge('0.000001');  // $0.000001 per token
  }
  stream.close();
});
```

True usage-aligned billing: a 5,000-token report costs $0.005, a 200-token summary costs $0.0002. The agent pays exactly for what it consumed.

### A4: Revenue Sharing — Multi-Party Splits
Split each payment automatically between tool owner, Flume platform, registry listing, and any upstream services the tool calls.

```json
{
  "revenueSplit": {
    "toolOwner": 0.85,
    "platform": 0.10,
    "registry": 0.05
  },
  "upstreamPayments": [
    { "server": "https://datapartner.com", "tool": "enrich", "price": "0.001" }
  ]
}
```

Enables multi-agent payment graphs where value flows automatically across multiple hops — all settled in a single batch.

### A5: Multi-Chain USDC — Pay From Any Chain
Agents with USDC on Base, Arbitrum, Optimism, or any Circle Gateway-supported chain pay Flume-wrapped tools without bridging. Flume accepts payment on any chain via Circle CCTP; tool owners settle on Arc.

```
Agent on Base (has USDC on Base)
  → Calls Flume tool (settles on Arc)
  → Relay accepts payment proof on Base via Circle Gateway
  → Circle CCTP bridges to Arc
  → Tool owner receives on Arc
  → Agent never manually bridges
```

### A6: Cryptographic Attestations
Every payment generates a signed receipt anchored on Arc. Verifiable proof that "Agent X paid $Y to Tool Z at timestamp T" — without trusting Flume.

```typescript
const receipt = await flume.getAttestation(txRef);
// receipt.signature: relay secp256k1 signature
// receipt.arcAnchor: Arc batch tx hash
// receipt.merkleProof: proof this payment is in the batch

const valid = await Flume.verifyAttestation(receipt);
// Verifiable by anyone, on-chain, without calling Flume
```

### A7: Budget Guardrails — Agent Fleet Management
Enterprise-grade spending controls for agent fleets.

```typescript
const fleet = await Flume.createFleet({
  dailyLimit: '100.00',
  perAgentDailyLimit: '5.00',
  perCallLimit: '0.10',
  allowedTools: ['flume:verified:*'],
  blockedTools: ['*:beta_*'],
  alertThreshold: 0.80,
  agents: ['agent-1', 'agent-2', 'agent-3'],
});
```

Circuit breaker: auto-pause any agent spending 3x their rolling 7-day average within any 15-minute window. Pause reversible by fleet admin. Prevents runaway agent or compromised wallet scenarios.

### A8: Cost Oracle — Live Pricing Feed
Public API returning real-time pricing for any registered Flume tool, plus market-wide statistics.

```
GET /oracle/price/:toolId         Current price (includes dynamic pricing)
GET /oracle/price/:toolId/history Price history over time
GET /oracle/market/summary        Average price per category of AI tool
GET /oracle/agent/:address/spend  Agent's historical spending patterns
```

Public good: any agent, developer, or researcher can query the cost structure of the agentic economy in real time. Used by agent frameworks to pre-estimate workflow costs before execution.

### A9: Compliance Mode — Enterprise Payment Reporting
- ISO 20022-aligned metadata on every transaction
- PDF invoice generation for monthly settlements
- Cost center / department / project code tagging
- Audit trail exports (CSV, JSON) for any date range
- GDPR-compliant data handling
- Webhook integration with accounting systems (QuickBooks, Xero, SAP)

### A10: Agent Reputation Score
Public reputation score for agent wallets based on payment history across the Flume network. Payment reliability, fraud history, total volume, account age. Tool owners restrict low-reputation wallets or charge higher prices. High-reputation agents access premium tools. Creates the trust layer the agentic economy currently lacks.

### A11: Flume Bridge — Legacy API Abstraction
For tools charging via Stripe, API credits, or subscriptions: accept USDC from the agent, pay the upstream using Flume's pre-purchased credits, return the result. Agents access the entire internet of paid APIs — not just Flume-native tools. Flume becomes the universal payment intermediary.

---

## REVENUE MODEL

*Designed in from day 1. Not activated at hackathon launch — earn trust first, monetize second.*

### Primary: Platform Relay Fee (0.5% of payment volume)
Every payment through the Flume Relay incurs a 0.5% fee, taken at settlement. No invoicing, no sales calls. At $100K monthly volume: $500/month. At $5M volume: $25,000/month. Volume-based, scales automatically.

0.5% is defensible: Circle handles gas. Flume adds relay infrastructure, fraud detection, dashboard, SDK, CLI, audit log maintenance, and AAPS standard stewardship. Compare to Stripe (2.9%) — Flume is 6x cheaper on a per-transaction basis.

### Secondary: Dashboard Pro ($49/month)
Free tier: 1 tool, 7-day EarningsLedger, basic analytics.
Pro: unlimited tools, 90-day ledger, full analytics including DynamicPricing Lab, CSV export, custom settlement frequency, priority webhook delivery. Any tool owner earning >$100/month from Flume converts easily.

### Tertiary: Enterprise (custom, from $500/month)
Written SLA, dedicated relay infrastructure, fleet management, compliance reporting, white-label relay option.

### Quaternary: Registry Placement ($49/month)
Priority listing, verified tool badge, category featuring. Unlocked at Registry launch (100+ tools milestone).

### Revenue Projection (conservative):
| Month | Tools | Volume | Relay Fee | Pro Subs | Total |
|---|---|---|---|---|---|
| 3 | 30 | $20K | $100 | $200 | $300/mo |
| 6 | 150 | $200K | $1,000 | $1,000 | $2,000/mo |
| 12 | 600 | $1M | $5,000 | $5,000 | $10,000/mo |
| 18 | 2,000 | $5M | $25,000 | enterprise | $40,000/mo |

Inflection: one high-volume tool (code execution, data enrichment, web search) routing significant agent traffic changes the trajectory immediately.

---

## TECH STACK

| Layer | Technology | Notes |
|---|---|---|
| @flume/gateway | TypeScript + Node.js + Express | MCP ecosystem is TS-native |
| @flume/arc | TypeScript + Circle SDK | Circle Nanopayments + Wallets |
| @flume/sdk | TypeScript | Agent client + framework adapters |
| @flume/cli | TypeScript + Commander.js | CLI framework |
| @flume/contracts | Solidity + Hardhat + TypeChain | Arc EVM contracts |
| Dashboard | Next.js 15 + Tailwind CSS + Supabase | Full stack |
| Database | Supabase (Postgres) | EarningsLedger, tool registry, analytics |
| Nonce Registry | Redis (Upstash serverless) | Sub-ms lookups, TTL-based expiry |
| Settlement Queue | BullMQ (Redis-backed) | Reliable batch processing |
| Payment Rail | Circle Nanopayments SDK | Gas-free sub-cent USDC |
| Wallets | Circle Developer Wallets API | No raw key management |
| Cross-chain | Circle Gateway + CCTP | Multi-chain USDC (v2) |
| Settlement Chain | Arc (EVM L1) | Zero-gas USDC settlement |
| Relay Hosting | Railway | Node.js + Redis, simple deploy |
| Dashboard Hosting | Netlify | CDN + serverless functions |
| Monitoring | UptimeRobot + Sentry + Prometheus | SLA + error tracking + metrics |
| Package Registry | npm | All @flume/* packages |
| Python SDK | Python + FastAPI | @flume/gateway Python port (v2) |

---

## HACKATHON ALIGNMENT

*The Arc/Circle hackathon criteria are satisfied naturally by building Flume correctly.*

| Hackathon Requirement | How Flume Satisfies It |
|---|---|
| ≤$0.01 per action | $0.001–$0.005 per MCP call is the core use case — sub-cent economics are the product |
| 50+ on-chain transactions | Demo agent calls wrapped tool 100x in 10 minutes → 100 Arc batch settlement anchors |
| Margin explanation | Built into product narrative — $0.002/call × 1000 = $2 revenue; $50+ gas without Nanopayments |
| Circle Nanopayments | Load-bearing: product cannot exist without it. Every payment routes through Nanopayments. |
| x402 protocol | Core protocol of @flume/gateway — every 402 response is x402-compliant |
| Arc settlement | All batch settlements on Arc, block explorer links in dashboard and `flume audit` |
| Circle Wallets | Tool owner and agent wallets are Circle Developer Wallets via @flume/arc |

**Track alignment:** Per-API Monetization Engine (primary) + Agent-to-Agent Payment Loop (secondary).

**Why building a product wins the hackathon:**
Most teams build a single-purpose demo — one agent paying for one specific service. Flume is the infrastructure that makes all of those demos possible. Infrastructure layers consistently win hackathons over single-purpose applications. Five composable packages, 30+ features, Prometheus metrics, a CLI, and a tamper-evident audit log — judges see "this team built production infrastructure, not a demo."

---

## PRODUCTION LAUNCH CHECKLIST

**Security:**
- [ ] Nonce registry: Redis, 5-minute TTL, checked before any validation
- [ ] Timestamp window: reject proofs older than 30 seconds
- [ ] Signature verification: secp256k1 against caller wallet address
- [ ] SpendingPolicy enforced server-side (not client-controlled)
- [ ] Rate limiting: per-caller and global, Redis sliding window
- [ ] Circuit breaker: auto-pause caller on 3x baseline spending anomaly
- [ ] No raw private keys: Circle Wallet API only, no key exposure
- [ ] TLS 1.3 on relay.flume.xyz, no HTTP fallback
- [ ] Input validation: Zod schemas on all API inputs
- [ ] HMAC-SHA256 on all outbound webhooks
- [ ] CORS: production domains only

**Reliability:**
- [ ] `/health` returning relay + Circle + Arc + Redis status
- [ ] Graceful degradation when Circle Nanopayments unreachable (configurable fail-open/closed per tool)
- [ ] BullMQ settlement queue with retry — no payment ever silently lost
- [ ] Database transaction wrapping for validation writes
- [ ] Idempotency keys on all settlement writes
- [ ] EarningsLedger hash chain integrity check on startup
- [ ] Sentry in relay + SDK
- [ ] UptimeRobot monitoring on relay endpoints
- [ ] Structured logs to Logtail

**Developer Experience:**
- [ ] All five `@flume/*` packages published to npm
- [ ] Full TypeScript types exported from every package
- [ ] JSDoc on every public method
- [ ] README: quickstart in under 5 minutes
- [ ] Examples repo: `examples/mcp-server`, `examples/http-api`, `examples/agent-client`, `examples/aggregator`
- [ ] `flume init` scaffolds working project from zero
- [ ] CHANGELOG.md from v0.1.0
- [ ] Semver — no breaking changes without major bump

**Compliance:**
- [ ] Terms of Service for tool owners
- [ ] Privacy Policy for dashboard users (GDPR)
- [ ] Data retention: payment records 90 days, aggregate analytics indefinite

---

## BUILD PHASES

*Phases 1–8 = production v1. Phases 9+ = aspirational v2.*

| Phase | Package | Description |
|---|---|---|
| 1 | @flume/gateway | PaymentGate, x402 intercept, ConfigDSL, StaticPricing, SpendingPolicy |
| 2 | @flume/arc | NanopayVerifier (Circle), EarningsLedger (hash chain), WalletManager |
| 3 | @flume/gateway | DynamicPricing (all 6 strategies), ProtocolBridge (x402 + session) |
| 4 | @flume/arc | FlumeRelay (hosted service), settlement BullMQ queue, Arc anchoring |
| 5 | @flume/sdk | FlumeClient (auto-pay, budget), FlumeAggregator, MCP adapter |
| 6 | @flume/cli | flume init, flume status, flume audit, flume wallet |
| 7 | Dashboard | app.flume.xyz — tool mgmt, EarningsLedger, revenue, settlements |
| 8 | @flume/contracts | FlumeRegistry.sol, EscrowVault.sol, RevenueSplit.sol on Arc |
| 9 | @flume/sdk | LangChain, Eliza, Vercel AI adapters |
| 10 | Dashboard | DynamicPricing Lab, Prometheus dashboard, caller analytics |
| 11 | @flume/arc | Attestation generation + verification |
| 12 | Registry v1 | Public tool directory, search, category browse, tool claiming |
| 13 | @flume/gateway | Session Tokens (bulk pre-authorization) |
| 14 | @flume/arc | Multi-chain USDC via Circle Gateway + CCTP |
| 15 | @flume/gateway | Streaming micropayments (per-token/per-second billing) |
| 16 | @flume/gateway | Revenue sharing (multi-party splits, upstream payments) |
| 17 | Cost Oracle | Public pricing API, market summary, agent spend analytics |
| 18 | Fleet Management | Budget guardrails, agent fleet controls, enterprise compliance |
| 19 | Agent Reputation | On-chain payment history scoring, tiered tool access |
| 20 | Flume Bridge | Legacy API payment abstraction (Stripe/credit proxying) |

---

## BRANDING

**Product:** Flume
**Domain:** flume.xyz
**Relay:** relay.flume.xyz
**Dashboard:** app.flume.xyz
**Docs:** docs.flume.xyz
**Registry (v2):** registry.flume.xyz
**Standard:** aaps.flume.xyz

**npm packages:** `@flume/gateway`, `@flume/arc`, `@flume/sdk`, `@flume/cli`, `@flume/contracts`

**Tagline:** *The payment infrastructure for AI agents.*

**One-liner (developer):** *Five packages. Wrap your MCP server. Start earning USDC per call. No gas. No wallets to manage. No setup beyond a config file.*

**One-liner (enterprise):** *Production-grade USDC payment infrastructure for agent fleets — sub-cent per call, Circle-powered, Arc-settled, tamper-evident audit log included.*

**One-liner (hackathon):** *The infrastructure layer that makes any AI tool chargeable per call — $0.001 per call, no gas, five composable packages, powered by Circle Nanopayments on Arc.*

---

## END OF SPEC v1.0

Flume is infrastructure, not an application. The goal is not to build one paid AI tool — it is to build the payment layer that makes every AI tool payable.

Five packages. Thirty features. A tamper-evident ledger. A CLI. Dynamic pricing. A proposed standard. The same tools that Bench, Watchdog, and any MCP server built in the next five years can wrap in minutes to start earning USDC per call.

**Build the rails. Everyone else builds the trains.**

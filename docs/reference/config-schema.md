# Config Schema

Complete reference for `flume.config.json`.

```typescript
interface FlumeConfig {
  version: '1';
  relay: string;             // Relay URL (e.g. 'https://relay.flume.xyz')
  ownerWallet: string;       // Tool owner's wallet address
  tools: ToolConfig[];       // At least one tool required
  spendingPolicy: SpendingPolicyConfig;
  webhooks?: WebhookConfig[];
  apiKeys?: ApiKeyConfig[];
}

interface ToolConfig {
  toolId: string;            // Unique identifier (kebab-case)
  name: string;              // Human-readable name
  description?: string;
  protocol: 'x402' | 'session' | 'free';
  pricing: PricingConfig;
  settlementWallet: string;
  freeTier?: FreeTierConfig;
  metadata?: Record<string, unknown>;
}

interface PricingConfig {
  strategy: 'static' | 'time-of-day' | 'demand' | 'tiered' | 'ab-test' | 'negotiate';
  staticPriceUsdc?: string;
  timeOfDay?: { hour: number; multiplier: number }[];
  demandCurve?: { callsPerMinute: number; multiplier: number }[];
  tiers?: { thresholdCalls: number; priceUsdc: string }[];
  abTest?: { testId: string; variants: { name: string; priceUsdc: string; weight: number }[] };
  negotiation?: { floorUsdc: string; defaultUsdc: string; maxRoundsPerCall: number };
}

interface SpendingPolicyConfig {
  maxPerCallUsdc: string;
  maxDailyPerCallerUsdc: string;
  maxDailyGlobalUsdc?: string;
  allowlist?: string[];
  blocklist?: string[];
}
```

## Validation

Config is validated with Zod on load. Use `FlumeConfigSchema` for programmatic validation:

```typescript
import { FlumeConfigSchema } from '@flume/gateway';
const result = FlumeConfigSchema.safeParse(myConfig);
```

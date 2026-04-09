# Installation

## Packages

Install only what you need:

```bash
# Server-side (tool owners)
pnpm add @flume/gateway

# Circle + Arc integration
pnpm add @flume/arc

# Agent-side (AI agents)
pnpm add @flume/sdk

# CLI (global)
pnpm add -g @flume/cli
```

## Environment variables

Create a `.env` file:

```bash
# Circle
CIRCLE_API_KEY=your_api_key
CIRCLE_ENVIRONMENT=sandbox  # sandbox | production

# Supabase (for EarningsLedger)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key

# Redis (for nonce registry)
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Relay
RELAY_URL=https://relay.flume.xyz
```

## TypeScript

All packages ship with TypeScript declarations. Strict mode is fully supported:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true
  }
}
```

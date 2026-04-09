# @flume/gateway

Server middleware for AI agent payment gating.

## Exports

### `flumeMiddleware(config, validator?)`

Express middleware that wraps your server with payment gating.

```typescript
import { flumeMiddleware, loadConfig } from '@flume/gateway';
const config = loadConfig('./flume.config.json');
app.use(flumeMiddleware(config));
```

### `loadConfig(path)`

Loads and validates `flume.config.json` using Zod. Throws descriptive errors on invalid config.

### `validateConfig(config)`

Validates a config object in memory (without reading from file).

### `FlumeConfigSchema`

Zod schema for programmatic validation.

### `PaymentGate`

Low-level class for custom integration:

```typescript
const gate = new PaymentGate(config, validator);
app.use(gate.middleware());
```

### `SpendingPolicy`

Standalone spending policy enforcement:

```typescript
const policy = new SpendingPolicy(config.spendingPolicy);
const result = policy.check(callerWallet, amount);
```

### `DynamicPricing`

All six pricing strategies:

```typescript
const dp = new DynamicPricing();
const quote = dp.getPrice(toolConfig.pricing, { callerWallet, hour: 14 });
```

### `ProtocolBridge`

Session-based pre-authorized budget protocol:

```typescript
const bridge = new ProtocolBridge(sessionStore);
const session = await bridge.openSession(request);
```

## Types

All types are exported from `@flume/gateway`:

- `FlumeConfig`, `ToolConfig`, `PricingConfig`
- `PaymentCheckResult`, `Http402Response`
- `PolicyCheckResult`, `SpendingPolicyState`
- `PriceQuote`, `SessionToken`
- `PricingStrategy`, `PaymentProtocol`

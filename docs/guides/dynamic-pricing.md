# Dynamic Pricing

Flume supports six pricing strategies, all configured in `flume.config.json`.

## Static

Fixed price per call.

```json
{ "strategy": "static", "staticPriceUsdc": "0.005" }
```

## Time-of-day

Multiply base price by hour.

```json
{
  "strategy": "time-of-day",
  "staticPriceUsdc": "0.005",
  "timeOfDay": [
    { "hour": 9, "multiplier": 2.0 },
    { "hour": 17, "multiplier": 1.5 }
  ]
}
```

## Demand

Price scales with calls per minute using interpolation between curve points.

```json
{
  "strategy": "demand",
  "staticPriceUsdc": "0.005",
  "demandCurve": [
    { "callsPerMinute": 0, "multiplier": 1.0 },
    { "callsPerMinute": 100, "multiplier": 3.0 }
  ]
}
```

## Tiered

Lower prices for high-volume callers. Caller's tier is determined by their total call count.

```json
{
  "strategy": "tiered",
  "tiers": [
    { "thresholdCalls": 0, "priceUsdc": "0.010" },
    { "thresholdCalls": 100, "priceUsdc": "0.008" },
    { "thresholdCalls": 1000, "priceUsdc": "0.005" }
  ]
}
```

## A/B Test

Test price points. Each caller is deterministically assigned a variant using `SHA-256(wallet + testId)`.

```json
{
  "strategy": "ab-test",
  "abTest": {
    "testId": "price-test-2026-04",
    "variants": [
      { "name": "control", "priceUsdc": "0.005", "weight": 0.5 },
      { "name": "higher", "priceUsdc": "0.008", "weight": 0.5 }
    ]
  }
}
```

## Auto-negotiate

Agent proposes a price. If above floor, accepted. Otherwise, countered at floor.

```json
{
  "strategy": "negotiate",
  "negotiation": {
    "floorUsdc": "0.003",
    "defaultUsdc": "0.005",
    "maxRoundsPerCall": 3
  }
}
```

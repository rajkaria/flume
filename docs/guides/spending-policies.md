# Spending Policies

SpendingPolicy protects tool owners from abuse by enforcing per-call and daily limits.

## Configuration

```json
{
  "spendingPolicy": {
    "maxPerCallUsdc": "1.00",
    "maxDailyPerCallerUsdc": "100.00",
    "maxDailyGlobalUsdc": "10000.00",
    "allowlist": ["0xTrustedAgent1", "0xTrustedAgent2"],
    "blocklist": ["0xMaliciousAgent"]
  }
}
```

## How it works

1. **Blocklist check** — Hard reject. No payment validation attempted.
2. **Allowlist check** — Bypasses all limits. Use for trusted partners.
3. **Per-call limit** — Rejects if the tool's price exceeds `maxPerCallUsdc`.
4. **Daily per-caller limit** — Tracks cumulative daily spend per wallet.
5. **Global daily limit** — Optional cap on total daily revenue across all callers.

SpendingPolicy runs **before** payment validation. If policy rejects, the Circle API is never called.

## Responses

When policy rejects, the caller receives a `403`:

```json
{
  "error": "spending_policy_violation",
  "reason": "daily per-caller limit exceeded"
}
```

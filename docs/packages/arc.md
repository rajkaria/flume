# @flume/arc

Circle + Arc integration for payment validation, earnings tracking, and settlement.

## Exports

### `NanopayVerifier`

Five-step payment validation:
1. Timestamp within 30s window
2. Nonce not replayed (Redis)
3. Signature valid
4. Amount matches expected price (1% tolerance)
5. Circle Nanopayments validation

```typescript
const verifier = new NanopayVerifier({ nonceRegistry, circleClient });
const result = await verifier.validate({ proof, expectedPrice: '0.005', priceTolerance: 0.01 });
```

### `EarningsLedger`

SHA-256 hash-chained audit log with idempotent writes.

```typescript
const ledger = new EarningsLedger(storage);
const entry = await ledger.record({ id, eventType: 'payment.validated', toolId, ... });
const verified = await ledger.verifyChain(entries);
```

### `WalletManager`

Circle Developer Wallet management.

```typescript
const manager = new WalletManager(circleWalletClient);
const wallet = await manager.create({ type: 'tool-owner', label: 'My Wallet' });
```

### `ArcSettler`

Merkle tree batch settlement with on-chain anchoring.

### `FlumeRelay`

Full Express server implementing the relay API.

### `InMemoryNonceRegistry` / `RedisNonceRegistry`

Nonce replay protection implementations.

## Types

- `PaymentProof`, `ValidationResult`, `ValidationFailureReason`
- `LedgerEntry`, `LedgerEntryWithHash`, `LedgerQueryOptions`
- `WalletInfo`, `RelayHealth`, `BatchSettlement`, `SettlementResult`

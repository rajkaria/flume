# Relay API Reference

Base URL: `https://relay.flume.xyz`

## Endpoints

### `POST /v1/validate`
Validate a payment proof.

**Request:**
```json
{
  "proof": {
    "txRef": "tx-123",
    "callerWallet": "0x...",
    "recipientWallet": "0x...",
    "amount": "0.005",
    "currency": "USDC",
    "nonce": "abc123",
    "timestamp": 1712620800000,
    "signature": "0x...",
    "toolId": "search"
  },
  "expectedPrice": "0.005"
}
```

**Response:** `{ "valid": true, "txRef": "tx-123", "checkedAt": 1712620800100 }`

### `GET /v1/status`
Relay health status.

### `POST /v1/wallets/create`
Create a Circle Developer Wallet.

### `GET /v1/wallets/:address`
Get wallet info and balance.

### `POST /v1/tools/register`
Register a tool with the relay.

### `GET /v1/tools/:toolId/price`
Get current price for a tool.

### `GET /v1/nonce`
Get a fresh nonce for payment signing.

### `GET /v1/attestation/:txRef`
Get payment attestation by transaction reference.

### `POST /v1/webhooks`
Register a webhook endpoint.

### `GET /health`
Full health check with service latencies.

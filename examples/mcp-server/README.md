# Example: MCP Server

A complete MCP-compatible server with three tools wrapped by `@flume/gateway`.

## Tools

| Tool | Price | Strategy |
|------|-------|----------|
| `search` | $0.005 | Static |
| `analyze` | $0.010+ | Demand-based |
| `ping` | Free | - |

## Run

```bash
pnpm install
pnpm start
```

## Test

```bash
# Free tool
curl -X POST http://localhost:3000/tools/ping

# Paid tool (returns 402)
curl -X POST http://localhost:3000/tools/search -H 'Content-Type: application/json' -d '{"query": "test"}'
```

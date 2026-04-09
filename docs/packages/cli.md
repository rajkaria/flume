# @flume/cli

Developer CLI for managing Flume-wrapped servers.

## Commands

### `flume init`

Interactive scaffolding that creates `flume.config.json`:

- Project type (MCP / HTTP / Both)
- Tool names and default prices
- Pricing strategy per tool
- Spending policy limits
- Optional webhook URL

### `flume status`

Validates config and checks connectivity:

- Config schema validation
- Relay reachability
- Circle API status
- Arc node status
- Tool pricing table
- Wallet balance

### `flume audit`

EarningsLedger viewer with filters:

- `--last 24h` or `--last 7d`
- `--tool <toolId>`
- `--caller <wallet>`
- `--export csv`

### `flume wallet`

Wallet management:

- `flume wallet status` — list all wallets and balances
- `flume wallet create --type tool --label "My Wallet"`
- `flume wallet withdraw --amount 10 --to 0x...`

### `flume deploy`

Pre-deployment validation:

- Config exists and is valid
- No placeholder values
- Settlement wallets configured
- Owner wallet set
- `.env` file present

// ─── FlumeClient ────────────────────────────────────────────────────────────

export interface FlumeClientConfig {
  readonly relayUrl: string;
  readonly walletAddress: string;
  readonly privateKey: string; // secp256k1 for signing payments
  readonly budget: BudgetConfig;
  readonly retries?: number | undefined;
  readonly timeoutMs?: number | undefined;
}

export interface BudgetConfig {
  readonly maxPerCallUsdc: string;
  readonly maxDailyUsdc: string;
  readonly maxSessionUsdc?: string | undefined;
}

export interface SpendingState {
  readonly totalSpent: string;
  readonly callCount: number;
  readonly dailySpent: string;
  readonly sessionSpent: string;
  readonly lastCallAt?: number | undefined;
}

export interface CallOptions {
  readonly maxPrice?: string | undefined;
  readonly timeoutMs?: number | undefined;
  readonly retries?: number | undefined;
  readonly preferredProtocol?: 'x402' | 'session' | undefined;
}

export interface ToolCallResult<T = unknown> {
  readonly data: T;
  readonly price: string;
  readonly txRef: string;
  readonly latencyMs: number;
  readonly protocol: string;
}

// ─── FlumeAggregator ────────────────────────────────────────────────────────

export type RoutingStrategy = 'cheapest' | 'fastest' | 'round-robin' | 'manual';

export interface AggregatorConfig {
  readonly servers: readonly ServerConfig[];
  readonly strategy: RoutingStrategy;
  readonly budget: BudgetConfig;
  readonly relayUrl: string;
  readonly walletAddress: string;
  readonly privateKey: string;
  readonly fallbackOnError?: boolean | undefined;
}

export interface ServerConfig {
  readonly url: string;
  readonly name: string;
  readonly priority?: number | undefined; // lower = higher priority
}

export interface AggregatedSpending {
  readonly totalSpent: string;
  readonly callCount: number;
  readonly byServer: Record<string, string>; // serverName → totalSpent
}

export interface ServerPriceInfo {
  readonly serverName: string;
  readonly url: string;
  readonly price: string;
  readonly available: boolean;
  readonly latencyMs: number;
}

// ─── Errors ─────────────────────────────────────────────────────────────────

export type FlumeErrorCode =
  | 'MAX_PRICE_EXCEEDED'
  | 'BUDGET_EXHAUSTED'
  | 'PAYMENT_REJECTED'
  | 'RELAY_UNREACHABLE'
  | 'TOOL_UNAVAILABLE'
  | 'SESSION_EXPIRED'
  | 'INVALID_CONFIG';

// ─── Adapters ───────────────────────────────────────────────────────────────

export interface McpToolCallParams {
  readonly serverUrl: string;
  readonly method: string;
  readonly params?: Record<string, unknown> | undefined;
}

export interface VercelAiToolDef {
  readonly name: string;
  readonly description: string;
  readonly parameters: Record<string, unknown>;
  readonly flumeServerUrl: string;
}

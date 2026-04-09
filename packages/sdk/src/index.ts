// @flume/sdk — agent-side client
export type {
  FlumeClientConfig,
  BudgetConfig,
  SpendingState,
  CallOptions,
  ToolCallResult,
  RoutingStrategy,
  AggregatorConfig,
  ServerConfig,
  AggregatedSpending,
  ServerPriceInfo,
  FlumeErrorCode,
  McpToolCallParams,
  VercelAiToolDef,
} from './types/index.js';

export { FlumeClient } from './FlumeClient.js';
export { FlumeAggregator } from './FlumeAggregator.js';
export { FlumeMcpAdapter } from './adapters/mcp.js';
export { createFlumeTool } from './adapters/vercel-ai.js';
export {
  FlumeError,
  FlumeMaxPriceExceededError,
  FlumeBudgetExhaustedError,
  FlumePaymentRejectedError,
  FlumeRelayUnreachableError,
  FlumeToolUnavailableError,
} from './errors.js';

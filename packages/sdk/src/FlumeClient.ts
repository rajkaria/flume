import type {
  FlumeClientConfig,
  SpendingState,
  CallOptions,
  ToolCallResult,
} from './types/index.js';
import {
  FlumeMaxPriceExceededError,
  FlumeBudgetExhaustedError,
  FlumePaymentRejectedError,
  FlumeRelayUnreachableError,
} from './errors.js';

export class FlumeClient {
  private readonly config: FlumeClientConfig;
  private state: SpendingState;

  constructor(config: FlumeClientConfig) {
    this.config = config;
    this.state = {
      totalSpent: '0.000000',
      callCount: 0,
      dailySpent: '0.000000',
      sessionSpent: '0.000000',
    };
  }

  async callTool<T = unknown>(
    serverUrl: string,
    toolId: string,
    params: Record<string, unknown> = {},
    options?: CallOptions,
  ): Promise<ToolCallResult<T>> {
    const startTime = Date.now();
    const maxPrice = options?.maxPrice ?? this.config.budget.maxPerCallUsdc;
    const timeoutMs = options?.timeoutMs ?? this.config.timeoutMs ?? 30_000;

    // First attempt — call tool
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${serverUrl}/tools/${toolId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Flume-Tool': toolId,
        },
        body: JSON.stringify(params),
        signal: controller.signal,
      });

      if (response.status === 200) {
        const data = await response.json() as T;
        return { data, price: '0.000000', txRef: 'free', latencyMs: Date.now() - startTime, protocol: 'free' };
      }

      if (response.status !== 402) {
        throw new Error(`Unexpected status ${response.status}`);
      }

      // Parse 402 response
      const paymentRequired = await response.json() as { price: string; relay: string; nonce: string; toolId: string; recipient: string };
      const price = paymentRequired.price;

      // Check maxPrice
      if (parseFloat(price) > parseFloat(maxPrice)) {
        throw new FlumeMaxPriceExceededError(price, maxPrice);
      }

      // Check daily budget
      const dailySpent = parseFloat(this.state.dailySpent);
      const maxDaily = parseFloat(this.config.budget.maxDailyUsdc);
      if (dailySpent + parseFloat(price) > maxDaily) {
        throw new FlumeBudgetExhaustedError(this.state.dailySpent, this.config.budget.maxDailyUsdc);
      }

      // Validate payment with relay
      const relayUrl = paymentRequired.relay || this.config.relayUrl;
      const proof = {
        txRef: `tx-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        callerWallet: this.config.walletAddress,
        recipientWallet: paymentRequired.recipient,
        amount: price,
        currency: 'USDC',
        nonce: paymentRequired.nonce,
        timestamp: Date.now(),
        signature: `sig-${this.config.walletAddress}`, // In production: secp256k1 sign
        toolId,
      };

      let validateResult: { valid: boolean; txRef?: string; reason?: string };
      try {
        const validateResponse = await fetch(`${relayUrl}/v1/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ proof, expectedPrice: price }),
        });
        validateResult = await validateResponse.json() as typeof validateResult;
      } catch {
        throw new FlumeRelayUnreachableError(relayUrl);
      }

      if (!validateResult.valid) {
        throw new FlumePaymentRejectedError(validateResult.reason ?? 'unknown');
      }

      // Retry with payment proof
      const paymentHeader = Buffer.from(JSON.stringify(proof)).toString('base64');
      const retryResponse = await fetch(`${serverUrl}/tools/${toolId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Flume-Tool': toolId,
          'X-Flume-Payment': paymentHeader,
        },
        body: JSON.stringify(params),
      });

      const data = await retryResponse.json() as T;

      // Update spending state
      this.updateSpending(price);

      return {
        data,
        price,
        txRef: validateResult.txRef ?? proof.txRef,
        latencyMs: Date.now() - startTime,
        protocol: 'x402',
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  getSpendingState(): SpendingState {
    return { ...this.state };
  }

  private updateSpending(priceUsdc: string): void {
    const amount = parseFloat(priceUsdc);
    this.state = {
      totalSpent: (parseFloat(this.state.totalSpent) + amount).toFixed(6),
      callCount: this.state.callCount + 1,
      dailySpent: (parseFloat(this.state.dailySpent) + amount).toFixed(6),
      sessionSpent: (parseFloat(this.state.sessionSpent) + amount).toFixed(6),
      lastCallAt: Date.now(),
    };
  }
}

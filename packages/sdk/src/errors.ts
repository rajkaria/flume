import type { FlumeErrorCode } from './types/index.js';

export class FlumeError extends Error {
  readonly code: FlumeErrorCode;
  constructor(code: FlumeErrorCode, message: string) {
    super(message);
    this.name = 'FlumeError';
    this.code = code;
  }
}

export class FlumeMaxPriceExceededError extends FlumeError {
  readonly price: string;
  readonly maxPrice: string;
  constructor(price: string, maxPrice: string) {
    super('MAX_PRICE_EXCEEDED', `Tool price ${price} USDC exceeds max ${maxPrice} USDC`);
    this.name = 'FlumeMaxPriceExceededError';
    this.price = price;
    this.maxPrice = maxPrice;
  }
}

export class FlumeBudgetExhaustedError extends FlumeError {
  readonly spent: string;
  readonly budget: string;
  constructor(spent: string, budget: string) {
    super('BUDGET_EXHAUSTED', `Daily budget exhausted: spent ${spent} USDC of ${budget} USDC`);
    this.name = 'FlumeBudgetExhaustedError';
    this.spent = spent;
    this.budget = budget;
  }
}

export class FlumePaymentRejectedError extends FlumeError {
  readonly reason: string;
  constructor(reason: string) {
    super('PAYMENT_REJECTED', `Payment rejected: ${reason}`);
    this.name = 'FlumePaymentRejectedError';
    this.reason = reason;
  }
}

export class FlumeRelayUnreachableError extends FlumeError {
  constructor(url: string) {
    super('RELAY_UNREACHABLE', `Relay at ${url} is unreachable`);
    this.name = 'FlumeRelayUnreachableError';
  }
}

export class FlumeToolUnavailableError extends FlumeError {
  readonly toolId: string;
  constructor(toolId: string) {
    super('TOOL_UNAVAILABLE', `Tool ${toolId} is unavailable`);
    this.name = 'FlumeToolUnavailableError';
    this.toolId = toolId;
  }
}

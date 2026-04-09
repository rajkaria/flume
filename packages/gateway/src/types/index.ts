import type { Request, Response, NextFunction } from 'express';

// ─── Pricing ────────────────────────────────────────────────────────────────

/** Supported pricing strategies */
export type PricingStrategy =
  | 'static'
  | 'time-of-day'
  | 'demand'
  | 'tiered'
  | 'ab-test'
  | 'negotiate';

/** Payment protocols supported */
export type PaymentProtocol = 'x402' | 'session' | 'free';

// ─── Config DSL (flume.config.json shape) ───────────────────────────────────

export interface TimeOfDaySchedule {
  readonly hour: number;       // 0-23
  readonly multiplier: number; // e.g. 1.5 for 50% markup
}

export interface DemandCurvePoint {
  readonly callsPerMinute: number;
  readonly multiplier: number;
}

export interface TierConfig {
  readonly thresholdCalls: number;
  readonly priceUsdc: string;
}

export interface AbTestVariant {
  readonly name: string;
  readonly priceUsdc: string;
  readonly weight: number; // 0-1, all weights must sum to 1
}

export interface NegotiationConfig {
  readonly floorUsdc: string;
  readonly defaultUsdc: string;
  readonly maxRoundsPerCall: number;
}

export interface PricingConfig {
  readonly strategy: PricingStrategy;
  readonly staticPriceUsdc?: string | undefined;
  readonly timeOfDay?: readonly TimeOfDaySchedule[] | undefined;
  readonly demandCurve?: readonly DemandCurvePoint[] | undefined;
  readonly tiers?: readonly TierConfig[] | undefined;
  readonly abTest?: {
    readonly testId: string;
    readonly variants: readonly AbTestVariant[];
  } | undefined;
  readonly negotiation?: NegotiationConfig | undefined;
}

export interface SpendingPolicyConfig {
  readonly maxPerCallUsdc: string;
  readonly maxDailyPerCallerUsdc: string;
  readonly maxDailyGlobalUsdc?: string | undefined;
  readonly allowlist?: readonly string[] | undefined;  // wallet addresses that bypass limits
  readonly blocklist?: readonly string[] | undefined;  // wallet addresses hard-rejected
}

export interface WebhookConfig {
  readonly url: string;
  readonly events: readonly string[];
  readonly secret: string; // HMAC-SHA256 signing secret
}

export interface ApiKeyConfig {
  readonly keyHash: string; // SHA-256 of the API key, never store raw
  readonly label: string;
  readonly permissions: readonly string[];
  readonly createdAt: string;
}

export interface FreeTierConfig {
  readonly enabled: boolean;
  readonly freeCallsPerDay: number;
  readonly freeCallsPerCaller?: number | undefined;
}

export interface ToolConfig {
  readonly toolId: string;
  readonly name: string;
  readonly description?: string | undefined;
  readonly protocol: PaymentProtocol;
  readonly pricing: PricingConfig;
  readonly settlementWallet: string;
  readonly freeTier?: FreeTierConfig | undefined;
  readonly metadata?: Record<string, unknown> | undefined;
}

export interface FlumeConfig {
  readonly version: '1';
  readonly relay: string;                          // relay.flume.xyz URL
  readonly ownerWallet: string;                    // tool owner's wallet address
  readonly tools: readonly ToolConfig[];
  readonly spendingPolicy: SpendingPolicyConfig;
  readonly webhooks?: readonly WebhookConfig[] | undefined;
  readonly apiKeys?: readonly ApiKeyConfig[] | undefined;
}

// ─── PaymentGate ────────────────────────────────────────────────────────────

export interface PaymentGateOptions {
  readonly config: FlumeConfig;
  readonly validatePayment: (proof: PaymentProofHeader) => Promise<PaymentCheckResult>;
  readonly onPaymentValidated?: ((result: PaymentCheckResult) => void) | undefined;
  readonly onPaymentRejected?: ((result: PaymentCheckResult) => void) | undefined;
}

export interface PaymentProofHeader {
  readonly txRef: string;
  readonly callerWallet: string;
  readonly amount: string;
  readonly currency: string;
  readonly nonce: string;
  readonly timestamp: number;
  readonly signature: string;
}

export interface PaymentCheckResult {
  readonly valid: boolean;
  readonly reason?: string | undefined;
  readonly price?: string | undefined;
  readonly txRef?: string | undefined;
  readonly toolId?: string | undefined;
}

export interface Http402Response {
  readonly price: string;
  readonly currency: 'USDC';
  readonly relay: string;
  readonly recipient: string;
  readonly protocol: PaymentProtocol;
  readonly nonce: string;
  readonly toolId: string;
  readonly timestamp: number;
  readonly expiresAt: number;
  readonly accepts: readonly string[]; // accepted payment methods
}

// ─── SpendingPolicy ─────────────────────────────────────────────────────────

export interface PolicyCheckResult {
  readonly allowed: boolean;
  readonly reason?: string | undefined;
  readonly remainingBudget?: string | undefined;
  readonly dailySpent?: string | undefined;
}

export interface SpendingPolicyState {
  readonly callerWallet: string;
  readonly dailySpentUsdc: string;
  readonly callCountToday: number;
  readonly lastCallAt: number;
}

// ─── DynamicPricing ─────────────────────────────────────────────────────────

export interface PriceQuote {
  readonly price: string;
  readonly strategy: PricingStrategy;
  readonly metadata: Record<string, unknown>;
}

export interface NegotiationResult {
  readonly accepted: boolean;
  readonly finalPrice: string;
  readonly proposedPrice: string;
  readonly rounds: number;
}

// ─── ProtocolBridge ─────────────────────────────────────────────────────────

export interface SessionToken {
  readonly sessionId: string;
  readonly callerWallet: string;
  readonly toolIds: readonly string[];   // '*' for all tools
  readonly budgetUsdc: string;
  readonly spentUsdc: string;
  readonly expiresAt: number;           // Unix timestamp
  readonly createdAt: number;
}

export interface SessionOpenRequest {
  readonly callerWallet: string;
  readonly toolIds: readonly string[];
  readonly budgetUsdc: string;
  readonly durationSeconds: number;
  readonly signature: string;
}

export interface SessionCloseResult {
  readonly sessionId: string;
  readonly totalSpent: string;
  readonly callCount: number;
  readonly settlementTxRef?: string | undefined;
}

// ─── Middleware ──────────────────────────────────────────────────────────────

export type FlumeMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;

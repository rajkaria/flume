// ─── NanopayVerifier ────────────────────────────────────────────────────────

export interface PaymentProof {
  readonly txRef: string;
  readonly callerWallet: string;
  readonly recipientWallet: string;
  readonly amount: string;
  readonly currency: 'USDC';
  readonly nonce: string;
  readonly timestamp: number;
  readonly signature: string;
  readonly toolId: string;
}

export interface ValidationRequest {
  readonly proof: PaymentProof;
  readonly expectedPrice: string;
  readonly priceTolerance: number; // e.g. 0.01 for 1%
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly txRef?: string | undefined;
  readonly reason?: string | undefined;
  readonly batchId?: string | undefined;
  readonly checkedAt: number;
}

export type ValidationFailureReason =
  | 'expired_timestamp'
  | 'duplicate_nonce'
  | 'invalid_signature'
  | 'amount_mismatch'
  | 'circle_rejected'
  | 'policy_violation'
  | 'relay_error';

// ─── EarningsLedger ─────────────────────────────────────────────────────────

export type LedgerEventType =
  | 'payment.validated'
  | 'payment.rejected'
  | 'policy.violation'
  | 'settlement.completed'
  | 'settlement.failed';

export interface LedgerEntry {
  readonly id: string;
  readonly eventType: LedgerEventType;
  readonly toolId: string;
  readonly callerWallet: string;
  readonly amount: string;
  readonly currency: 'USDC';
  readonly txRef?: string | undefined;
  readonly protocol: string;
  readonly metadata?: Record<string, unknown> | undefined;
  readonly createdAt: string; // ISO 8601
}

export interface LedgerEntryWithHash extends LedgerEntry {
  readonly entryHash: string;
  readonly previousHash: string;
}

export interface LedgerQueryOptions {
  readonly toolId?: string | undefined;
  readonly callerWallet?: string | undefined;
  readonly eventType?: LedgerEventType | undefined;
  readonly startDate?: string | undefined; // ISO 8601
  readonly endDate?: string | undefined;   // ISO 8601
  readonly limit?: number | undefined;
  readonly offset?: number | undefined;
}

export interface LedgerQueryResult {
  readonly entries: readonly LedgerEntryWithHash[];
  readonly total: number;
  readonly hasMore: boolean;
}

export interface AnchorResult {
  readonly arcTxHash: string;
  readonly merkleRoot: string;
  readonly entryCount: number;
  readonly batchId: string;
  readonly anchoredAt: string; // ISO 8601
}

// ─── WalletManager ──────────────────────────────────────────────────────────

export type WalletType = 'tool-owner' | 'agent' | 'escrow';

export interface CreateWalletOptions {
  readonly type: WalletType;
  readonly label: string;
  readonly metadata?: Record<string, unknown> | undefined;
}

export interface WalletInfo {
  readonly address: string;
  readonly balance: string; // USDC
  readonly type: WalletType;
  readonly label: string;
  readonly createdAt: string; // ISO 8601
}

export interface AutoFundConfig {
  readonly enabled: boolean;
  readonly thresholdUsdc: string;   // fund when balance drops below
  readonly topUpAmountUsdc: string; // amount to add
  readonly sourceWallet: string;
}

// ─── Attestor ───────────────────────────────────────────────────────────────

export interface PaymentAttestation {
  readonly txRef: string;
  readonly toolId: string;
  readonly callerWallet: string;
  readonly amount: string;
  readonly currency: 'USDC';
  readonly validatedAt: number;
  readonly relaySignature: string; // relay's secp256k1 signature over attestation data
  readonly batchId?: string | undefined;
}

export interface AttestationVerifyResult {
  readonly valid: boolean;
  readonly attestation?: PaymentAttestation | undefined;
  readonly reason?: string | undefined;
}

// ─── FlumeRelay ─────────────────────────────────────────────────────────────

export interface RelayConfig {
  readonly port: number;
  readonly circleApiKey: string;
  readonly circleEnvironment: 'sandbox' | 'production';
  readonly supabaseUrl: string;
  readonly supabaseServiceKey: string;
  readonly redisUrl: string;
  readonly redisToken: string;
  readonly arcRpcUrl: string;
  readonly relaySigningKey: string;
  readonly settlementIntervalMinutes: number;
  readonly sentryDsn?: string | undefined;
}

export interface RelayHealth {
  readonly status: 'healthy' | 'degraded' | 'unhealthy';
  readonly timestamp: string; // ISO 8601
  readonly services: {
    readonly circle: ServiceHealth;
    readonly supabase: ServiceHealth;
    readonly redis: ServiceHealth;
    readonly arc: ServiceHealth;
  };
  readonly queue: {
    readonly pendingPayments: number;
    readonly nextSettlementIn: string;
  };
}

export interface ServiceHealth {
  readonly status: 'ok' | 'degraded' | 'down';
  readonly latencyMs: number;
  readonly error?: string | undefined;
}

// ─── ArcSettler ─────────────────────────────────────────────────────────────

export interface BatchSettlement {
  readonly batchId: string;
  readonly entries: readonly LedgerEntryWithHash[];
  readonly totalAmountUsdc: string;
  readonly settlementWallet: string;
}

export interface SettlementResult {
  readonly batchId: string;
  readonly success: boolean;
  readonly arcTxHash?: string | undefined;
  readonly merkleRoot?: string | undefined;
  readonly entryCount: number;
  readonly totalAmountUsdc: string;
  readonly error?: string | undefined;
  readonly settledAt: string; // ISO 8601
}

// ─── Nonce Registry ─────────────────────────────────────────────────────────

export interface NonceRegistry {
  checkAndStore(nonce: string, ttlSeconds: number): Promise<boolean>; // true if nonce was new
  exists(nonce: string): Promise<boolean>;
}

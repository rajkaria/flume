// ─── CLI Command Types ──────────────────────────────────────────────────────

export interface InitAnswers {
  readonly projectType: 'mcp' | 'http' | 'both';
  readonly toolNames: readonly string[];
  readonly defaultPriceUsdc: string;
  readonly pricingStrategy: string;
  readonly maxPerCallUsdc: string;
  readonly maxDailyPerCallerUsdc: string;
  readonly maxDailyGlobalUsdc?: string | undefined;
  readonly createWallet: boolean;
  readonly webhookUrl?: string | undefined;
}

export interface StatusReport {
  readonly configValid: boolean;
  readonly configErrors?: readonly string[] | undefined;
  readonly relay: {
    readonly reachable: boolean;
    readonly latencyMs?: number | undefined;
    readonly version?: string | undefined;
  };
  readonly circle: {
    readonly connected: boolean;
    readonly environment: 'sandbox' | 'production';
  };
  readonly arc: {
    readonly connected: boolean;
    readonly blockNumber?: number | undefined;
  };
  readonly tools: readonly ToolStatus[];
  readonly walletBalance?: string | undefined;
}

export interface ToolStatus {
  readonly toolId: string;
  readonly name: string;
  readonly currentPrice: string;
  readonly strategy: string;
  readonly active: boolean;
}

export interface AuditFilters {
  readonly last?: string | undefined;      // e.g. '24h', '7d'
  readonly toolId?: string | undefined;
  readonly callerWallet?: string | undefined;
  readonly exportCsv?: boolean | undefined;
}

export interface AuditSummary {
  readonly paymentsValidated: number;
  readonly paymentsRejected: number;
  readonly totalEarned: string;
  readonly totalSettled: string;
  readonly pendingSettlement: string;
}

export interface WalletCommand {
  readonly action: 'status' | 'create' | 'withdraw';
  readonly walletType?: 'tool' | 'agent' | undefined;
  readonly label?: string | undefined;
  readonly amount?: string | undefined;
  readonly toAddress?: string | undefined;
}

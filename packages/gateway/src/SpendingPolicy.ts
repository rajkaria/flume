import type { SpendingPolicyConfig, PolicyCheckResult, SpendingPolicyState } from './types/index.js';

export class SpendingPolicy {
  private readonly config: SpendingPolicyConfig;
  private readonly dailySpending = new Map<string, { amount: number; count: number; resetAt: number }>();
  private globalDailySpent = 0;
  private globalResetAt = this.getNextReset();

  constructor(config: SpendingPolicyConfig) {
    this.config = config;
  }

  check(callerWallet: string, amountUsdc: string): PolicyCheckResult {
    // Blocklist — hard reject
    if (this.config.blocklist?.includes(callerWallet)) {
      return { allowed: false, reason: 'caller is blocklisted' };
    }

    // Allowlist — bypass limits
    if (this.config.allowlist?.includes(callerWallet)) {
      return { allowed: true };
    }

    const amount = parseFloat(amountUsdc);
    const maxPerCall = parseFloat(this.config.maxPerCallUsdc);
    const maxDailyPerCaller = parseFloat(this.config.maxDailyPerCallerUsdc);

    // Per-call limit
    if (amount > maxPerCall) {
      return {
        allowed: false,
        reason: `amount ${amountUsdc} exceeds per-call limit ${this.config.maxPerCallUsdc}`,
      };
    }

    // Reset daily counters if needed
    this.maybeResetDaily();

    // Daily per-caller limit
    const callerState = this.getCallerState(callerWallet);
    const projectedDaily = callerState.amount + amount;
    if (projectedDaily > maxDailyPerCaller) {
      return {
        allowed: false,
        reason: 'daily per-caller limit exceeded',
        remainingBudget: String(Math.max(0, maxDailyPerCaller - callerState.amount).toFixed(6)),
        dailySpent: String(callerState.amount.toFixed(6)),
      };
    }

    // Global daily limit
    if (this.config.maxDailyGlobalUsdc !== undefined) {
      const maxGlobal = parseFloat(this.config.maxDailyGlobalUsdc);
      if (this.globalDailySpent + amount > maxGlobal) {
        return {
          allowed: false,
          reason: 'global daily limit exceeded',
        };
      }
    }

    return {
      allowed: true,
      remainingBudget: String((maxDailyPerCaller - projectedDaily).toFixed(6)),
      dailySpent: String(projectedDaily.toFixed(6)),
    };
  }

  record(callerWallet: string, amountUsdc: string): void {
    const amount = parseFloat(amountUsdc);
    const state = this.getCallerState(callerWallet);
    state.amount += amount;
    state.count += 1;
    this.dailySpending.set(callerWallet, state);
    this.globalDailySpent += amount;
  }

  getState(callerWallet: string): SpendingPolicyState {
    const state = this.getCallerState(callerWallet);
    return {
      callerWallet,
      dailySpentUsdc: state.amount.toFixed(6),
      callCountToday: state.count,
      lastCallAt: Date.now(),
    };
  }

  private getCallerState(wallet: string) {
    return this.dailySpending.get(wallet) ?? { amount: 0, count: 0, resetAt: this.getNextReset() };
  }

  private maybeResetDaily(): void {
    const now = Date.now();
    if (now >= this.globalResetAt) {
      this.dailySpending.clear();
      this.globalDailySpent = 0;
      this.globalResetAt = this.getNextReset();
    }
  }

  private getNextReset(): number {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCHours(0, 0, 0, 0);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    return tomorrow.getTime();
  }
}

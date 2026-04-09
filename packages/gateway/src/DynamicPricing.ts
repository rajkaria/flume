import { createHash } from 'node:crypto';
import type {
  PricingConfig,
  PricingStrategy,
  PriceQuote,
  NegotiationResult,
} from './types/index.js';

export class DynamicPricing {
  private readonly callCounts = new Map<string, { count: number; windowStart: number }>(); // toolId → calls this minute
  private readonly callerCallCounts = new Map<string, number>(); // callerWallet → total calls

  getPrice(config: PricingConfig, context: PriceContext): PriceQuote {
    switch (config.strategy) {
      case 'static':
        return this.staticPrice(config);
      case 'time-of-day':
        return this.timeOfDayPrice(config, context);
      case 'demand':
        return this.demandPrice(config, context);
      case 'tiered':
        return this.tieredPrice(config, context);
      case 'ab-test':
        return this.abTestPrice(config, context);
      case 'negotiate':
        return this.negotiatePrice(config, context);
    }
  }

  recordCall(toolId: string, callerWallet: string): void {
    // Track calls per minute for demand pricing
    const now = Date.now();
    const existing = this.callCounts.get(toolId);
    if (existing && now - existing.windowStart < 60_000) {
      existing.count++;
    } else {
      this.callCounts.set(toolId, { count: 1, windowStart: now });
    }
    // Track total calls per caller for tiered pricing
    const current = this.callerCallCounts.get(callerWallet) ?? 0;
    this.callerCallCounts.set(callerWallet, current + 1);
  }

  getCallsPerMinute(toolId: string): number {
    const data = this.callCounts.get(toolId);
    if (!data) return 0;
    if (Date.now() - data.windowStart >= 60_000) return 0;
    return data.count;
  }

  getCallerTotalCalls(callerWallet: string): number {
    return this.callerCallCounts.get(callerWallet) ?? 0;
  }

  negotiate(config: PricingConfig, proposedPrice: string): NegotiationResult {
    if (config.strategy !== 'negotiate' || !config.negotiation) {
      return { accepted: false, finalPrice: '0', proposedPrice, rounds: 0 };
    }
    const { floorUsdc, defaultUsdc } = config.negotiation;
    const proposed = parseFloat(proposedPrice);
    const floor = parseFloat(floorUsdc);

    if (proposed >= floor) {
      return { accepted: true, finalPrice: proposedPrice, proposedPrice, rounds: 1 };
    }
    // Counter at floor
    return { accepted: false, finalPrice: floorUsdc, proposedPrice, rounds: 1 };
  }

  // ─── Strategy implementations ────────────────────────────────────────

  private staticPrice(config: PricingConfig): PriceQuote {
    return {
      price: config.staticPriceUsdc ?? '0.000000',
      strategy: 'static',
      metadata: {},
    };
  }

  private timeOfDayPrice(config: PricingConfig, context: PriceContext): PriceQuote {
    const basePrice = parseFloat(config.staticPriceUsdc ?? '0');
    const hour = context.hour ?? new Date().getUTCHours();
    const schedule = config.timeOfDay ?? [];
    const match = schedule.find((s) => s.hour === hour);
    const multiplier = match?.multiplier ?? 1;
    return {
      price: (basePrice * multiplier).toFixed(6),
      strategy: 'time-of-day',
      metadata: { hour, multiplier },
    };
  }

  private demandPrice(config: PricingConfig, context: PriceContext): PriceQuote {
    const basePrice = parseFloat(config.staticPriceUsdc ?? '0');
    const cpm = context.callsPerMinute ?? this.getCallsPerMinute(context.toolId ?? '');
    const curve = config.demandCurve ?? [];

    if (curve.length === 0) {
      return { price: basePrice.toFixed(6), strategy: 'demand', metadata: { cpm } };
    }

    // Find the two curve points that bracket the current cpm
    const sorted = [...curve].sort((a, b) => a.callsPerMinute - b.callsPerMinute);
    let multiplier = 1;

    if (cpm <= sorted[0]!.callsPerMinute) {
      multiplier = sorted[0]!.multiplier;
    } else if (cpm >= sorted[sorted.length - 1]!.callsPerMinute) {
      multiplier = sorted[sorted.length - 1]!.multiplier;
    } else {
      // Linear interpolation
      for (let i = 0; i < sorted.length - 1; i++) {
        const lo = sorted[i]!;
        const hi = sorted[i + 1]!;
        if (cpm >= lo.callsPerMinute && cpm <= hi.callsPerMinute) {
          const ratio = (cpm - lo.callsPerMinute) / (hi.callsPerMinute - lo.callsPerMinute);
          multiplier = lo.multiplier + ratio * (hi.multiplier - lo.multiplier);
          break;
        }
      }
    }

    return {
      price: (basePrice * multiplier).toFixed(6),
      strategy: 'demand',
      metadata: { cpm, multiplier },
    };
  }

  private tieredPrice(config: PricingConfig, context: PriceContext): PriceQuote {
    const tiers = config.tiers ?? [];
    const callerCalls = context.callerTotalCalls ?? this.getCallerTotalCalls(context.callerWallet ?? '');
    const sorted = [...tiers].sort((a, b) => a.thresholdCalls - b.thresholdCalls);

    // Find highest tier the caller qualifies for
    let price = config.staticPriceUsdc ?? '0.000000';
    let tierName = 'base';

    for (const tier of sorted) {
      if (callerCalls >= tier.thresholdCalls) {
        price = tier.priceUsdc;
        tierName = `tier-${tier.thresholdCalls}`;
      }
    }

    return {
      price,
      strategy: 'tiered',
      metadata: { callerCalls, tier: tierName },
    };
  }

  private abTestPrice(config: PricingConfig, context: PriceContext): PriceQuote {
    if (!config.abTest) {
      return { price: config.staticPriceUsdc ?? '0', strategy: 'ab-test', metadata: {} };
    }
    const { testId, variants } = config.abTest;
    const wallet = context.callerWallet ?? '';

    // Deterministic assignment: SHA-256(wallet + testId) mod 100
    const hash = createHash('sha256').update(wallet + testId).digest('hex');
    const bucket = parseInt(hash.slice(0, 8), 16) % 100;

    let cumWeight = 0;
    for (const variant of variants) {
      cumWeight += variant.weight * 100;
      if (bucket < cumWeight) {
        return {
          price: variant.priceUsdc,
          strategy: 'ab-test',
          metadata: { testId, variant: variant.name, bucket },
        };
      }
    }

    // Fallback to last variant
    const last = variants[variants.length - 1]!;
    return {
      price: last.priceUsdc,
      strategy: 'ab-test',
      metadata: { testId, variant: last.name, bucket },
    };
  }

  private negotiatePrice(config: PricingConfig, context: PriceContext): PriceQuote {
    const defaultPrice = config.negotiation?.defaultUsdc ?? config.staticPriceUsdc ?? '0';
    return {
      price: defaultPrice,
      strategy: 'negotiate',
      metadata: { negotiable: true, floor: config.negotiation?.floorUsdc },
    };
  }
}

export interface PriceContext {
  toolId?: string;
  callerWallet?: string;
  hour?: number;
  callsPerMinute?: number;
  callerTotalCalls?: number;
  proposedPrice?: string;
}

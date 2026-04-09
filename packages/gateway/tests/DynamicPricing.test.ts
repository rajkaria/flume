import { describe, it, expect } from 'vitest';
import { DynamicPricing } from '../src/DynamicPricing.js';
import type { PricingConfig } from '../src/types/index.js';

describe('DynamicPricing', () => {
  describe('static', () => {
    it('returns price unchanged', () => {
      const dp = new DynamicPricing();
      const config: PricingConfig = { strategy: 'static', staticPriceUsdc: '0.005' };
      const quote = dp.getPrice(config, {});
      expect(quote.price).toBe('0.005');
      expect(quote.strategy).toBe('static');
    });
  });

  describe('time-of-day', () => {
    it('returns multiplied price during peak hours', () => {
      const dp = new DynamicPricing();
      const config: PricingConfig = {
        strategy: 'time-of-day',
        staticPriceUsdc: '0.010',
        timeOfDay: [
          { hour: 14, multiplier: 2.0 },
          { hour: 3, multiplier: 0.5 },
        ],
      };
      const quote = dp.getPrice(config, { hour: 14 });
      expect(parseFloat(quote.price)).toBeCloseTo(0.02, 4);
    });

    it('returns base price during off-peak', () => {
      const dp = new DynamicPricing();
      const config: PricingConfig = {
        strategy: 'time-of-day',
        staticPriceUsdc: '0.010',
        timeOfDay: [{ hour: 14, multiplier: 2.0 }],
      };
      const quote = dp.getPrice(config, { hour: 3 });
      expect(parseFloat(quote.price)).toBeCloseTo(0.01, 4);
    });
  });

  describe('demand', () => {
    it('scales price with calls per minute', () => {
      const dp = new DynamicPricing();
      const config: PricingConfig = {
        strategy: 'demand',
        staticPriceUsdc: '0.005',
        demandCurve: [
          { callsPerMinute: 0, multiplier: 1.0 },
          { callsPerMinute: 100, multiplier: 3.0 },
        ],
      };
      // Low demand
      const low = dp.getPrice(config, { callsPerMinute: 10 });
      // High demand
      const high = dp.getPrice(config, { callsPerMinute: 80 });
      expect(parseFloat(low.price)).toBeLessThan(parseFloat(high.price));
    });

    it('returns base price with no demand curve', () => {
      const dp = new DynamicPricing();
      const config: PricingConfig = { strategy: 'demand', staticPriceUsdc: '0.005' };
      const quote = dp.getPrice(config, { callsPerMinute: 50 });
      expect(parseFloat(quote.price)).toBeCloseTo(0.005, 4);
    });
  });

  describe('tiered', () => {
    it('new caller gets tier 1 price', () => {
      const dp = new DynamicPricing();
      const config: PricingConfig = {
        strategy: 'tiered',
        staticPriceUsdc: '0.010',
        tiers: [
          { thresholdCalls: 0, priceUsdc: '0.010' },
          { thresholdCalls: 100, priceUsdc: '0.008' },
          { thresholdCalls: 1000, priceUsdc: '0.005' },
        ],
      };
      const quote = dp.getPrice(config, { callerTotalCalls: 5 });
      expect(quote.price).toBe('0.010');
    });

    it('high-volume caller gets lower price', () => {
      const dp = new DynamicPricing();
      const config: PricingConfig = {
        strategy: 'tiered',
        tiers: [
          { thresholdCalls: 0, priceUsdc: '0.010' },
          { thresholdCalls: 100, priceUsdc: '0.008' },
          { thresholdCalls: 1000, priceUsdc: '0.005' },
        ],
      };
      const quote = dp.getPrice(config, { callerTotalCalls: 500 });
      expect(quote.price).toBe('0.008');
    });
  });

  describe('ab-test', () => {
    it('deterministic variant assignment per wallet', () => {
      const dp = new DynamicPricing();
      const config: PricingConfig = {
        strategy: 'ab-test',
        abTest: {
          testId: 'test-1',
          variants: [
            { name: 'control', priceUsdc: '0.005', weight: 0.5 },
            { name: 'experiment', priceUsdc: '0.008', weight: 0.5 },
          ],
        },
      };
      // Same wallet always gets same variant
      const q1 = dp.getPrice(config, { callerWallet: '0xwallet1' });
      const q2 = dp.getPrice(config, { callerWallet: '0xwallet1' });
      expect(q1.price).toBe(q2.price);
      expect(q1.metadata.variant).toBe(q2.metadata.variant);
    });

    it('distributes roughly according to weights over many wallets', () => {
      const dp = new DynamicPricing();
      const config: PricingConfig = {
        strategy: 'ab-test',
        abTest: {
          testId: 'test-2',
          variants: [
            { name: 'A', priceUsdc: '0.005', weight: 0.6 },
            { name: 'B', priceUsdc: '0.008', weight: 0.4 },
          ],
        },
      };
      let countA = 0;
      const total = 1000;
      for (let i = 0; i < total; i++) {
        const quote = dp.getPrice(config, { callerWallet: `0xwallet-${i}` });
        if ((quote.metadata as { variant: string }).variant === 'A') countA++;
      }
      // Should be roughly 60% ± 10%
      expect(countA / total).toBeGreaterThan(0.4);
      expect(countA / total).toBeLessThan(0.8);
    });
  });

  describe('negotiate', () => {
    const config: PricingConfig = {
      strategy: 'negotiate',
      negotiation: { floorUsdc: '0.003', defaultUsdc: '0.005', maxRoundsPerCall: 3 },
    };

    it('accepts proposal above floor', () => {
      const dp = new DynamicPricing();
      const result = dp.negotiate(config, '0.004');
      expect(result.accepted).toBe(true);
      expect(result.finalPrice).toBe('0.004');
    });

    it('counters proposal below floor', () => {
      const dp = new DynamicPricing();
      const result = dp.negotiate(config, '0.001');
      expect(result.accepted).toBe(false);
      expect(result.finalPrice).toBe('0.003');
    });

    it('returns default price for non-negotiate strategy', () => {
      const dp = new DynamicPricing();
      const quote = dp.getPrice(config, {});
      expect(quote.price).toBe('0.005');
      expect(quote.metadata.negotiable).toBe(true);
    });
  });
});

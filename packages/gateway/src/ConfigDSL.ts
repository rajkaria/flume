import { z } from 'zod';
import { readFileSync } from 'node:fs';
import type { FlumeConfig } from './types/index.js';

const PricingConfigSchema = z.object({
  strategy: z.enum(['static', 'time-of-day', 'demand', 'tiered', 'ab-test', 'negotiate']),
  staticPriceUsdc: z.string().optional(),
  timeOfDay: z.array(z.object({
    hour: z.number().int().min(0).max(23),
    multiplier: z.number().positive(),
  })).optional(),
  demandCurve: z.array(z.object({
    callsPerMinute: z.number().nonnegative(),
    multiplier: z.number().positive(),
  })).optional(),
  tiers: z.array(z.object({
    thresholdCalls: z.number().int().nonnegative(),
    priceUsdc: z.string(),
  })).optional(),
  abTest: z.object({
    testId: z.string().min(1),
    variants: z.array(z.object({
      name: z.string().min(1),
      priceUsdc: z.string(),
      weight: z.number().min(0).max(1),
    })),
  }).optional(),
  negotiation: z.object({
    floorUsdc: z.string(),
    defaultUsdc: z.string(),
    maxRoundsPerCall: z.number().int().positive(),
  }).optional(),
});

const SpendingPolicyConfigSchema = z.object({
  maxPerCallUsdc: z.string(),
  maxDailyPerCallerUsdc: z.string(),
  maxDailyGlobalUsdc: z.string().optional(),
  allowlist: z.array(z.string()).optional(),
  blocklist: z.array(z.string()).optional(),
});

const ToolConfigSchema = z.object({
  toolId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  protocol: z.enum(['x402', 'session', 'free']),
  pricing: PricingConfigSchema,
  settlementWallet: z.string().min(1),
  freeTier: z.object({
    enabled: z.boolean(),
    freeCallsPerDay: z.number().int().nonnegative(),
    freeCallsPerCaller: z.number().int().nonnegative().optional(),
  }).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const FlumeConfigSchema = z.object({
  version: z.literal('1'),
  relay: z.string().url(),
  ownerWallet: z.string().min(1),
  tools: z.array(ToolConfigSchema).min(1),
  spendingPolicy: SpendingPolicyConfigSchema,
  webhooks: z.array(z.object({
    url: z.string().url(),
    events: z.array(z.string()),
    secret: z.string().min(1),
  })).optional(),
  apiKeys: z.array(z.object({
    keyHash: z.string().min(1),
    label: z.string().min(1),
    permissions: z.array(z.string()),
    createdAt: z.string(),
  })).optional(),
});

export function loadConfig(path: string): FlumeConfig {
  let raw: string;
  try {
    raw = readFileSync(path, 'utf-8');
  } catch {
    throw new Error(`Flume config not found at ${path}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Flume config at ${path} is not valid JSON`);
  }

  const result = FlumeConfigSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid flume config:\n${issues}`);
  }

  return result.data as FlumeConfig;
}

export function validateConfig(config: unknown): FlumeConfig {
  const result = FlumeConfigSchema.safeParse(config);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid flume config:\n${issues}`);
  }
  return result.data as FlumeConfig;
}

export function getToolConfig(config: FlumeConfig, toolId: string) {
  const tool = config.tools.find((t) => t.toolId === toolId);
  if (!tool) {
    throw new Error(`Tool "${toolId}" not found in config`);
  }
  return tool;
}

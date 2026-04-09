import { writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { InitAnswers } from '../types/index.js';

export interface InitOptions {
  cwd?: string;
  answers: InitAnswers;
}

export function initCommand(options: InitOptions): { configPath: string; config: object } {
  const cwd = options.cwd ?? process.cwd();
  const configPath = join(cwd, 'flume.config.json');
  const { answers } = options;

  const tools = answers.toolNames.map((name) => ({
    toolId: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    protocol: 'x402',
    pricing: {
      strategy: answers.pricingStrategy,
      staticPriceUsdc: answers.defaultPriceUsdc,
    },
    settlementWallet: '',
  }));

  const config = {
    version: '1',
    relay: 'https://relay.flume.xyz',
    ownerWallet: '',
    tools,
    spendingPolicy: {
      maxPerCallUsdc: answers.maxPerCallUsdc,
      maxDailyPerCallerUsdc: answers.maxDailyPerCallerUsdc,
      ...(answers.maxDailyGlobalUsdc ? { maxDailyGlobalUsdc: answers.maxDailyGlobalUsdc } : {}),
    },
    ...(answers.webhookUrl ? {
      webhooks: [{
        url: answers.webhookUrl,
        events: ['payment.validated', 'settlement.completed'],
        secret: 'change-me',
      }],
    } : {}),
  };

  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
  return { configPath, config };
}

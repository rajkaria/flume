import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync, rmSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { initCommand } from '../src/commands/init.js';

describe('flume init', () => {
  const dirs: string[] = [];

  function makeTmpDir() {
    const dir = mkdtempSync(join(tmpdir(), 'flume-cli-'));
    dirs.push(dir);
    return dir;
  }

  afterEach(() => {
    for (const dir of dirs) {
      try { rmSync(dir, { recursive: true }); } catch {}
    }
    dirs.length = 0;
  });

  it('creates valid flume.config.json for MCP project', () => {
    const cwd = makeTmpDir();
    const { configPath, config } = initCommand({
      cwd,
      answers: {
        projectType: 'mcp',
        toolNames: ['Search', 'Analyze'],
        defaultPriceUsdc: '0.005',
        pricingStrategy: 'static',
        maxPerCallUsdc: '1.00',
        maxDailyPerCallerUsdc: '100.00',
        createWallet: false,
      },
    });

    const written = JSON.parse(readFileSync(configPath, 'utf-8'));
    expect(written.version).toBe('1');
    expect(written.tools).toHaveLength(2);
    expect(written.tools[0].toolId).toBe('search');
    expect(written.tools[0].pricing.staticPriceUsdc).toBe('0.005');
    expect(written.spendingPolicy.maxPerCallUsdc).toBe('1.00');
  });

  it('includes webhook when URL provided', () => {
    const cwd = makeTmpDir();
    const { configPath } = initCommand({
      cwd,
      answers: {
        projectType: 'http',
        toolNames: ['API'],
        defaultPriceUsdc: '0.01',
        pricingStrategy: 'static',
        maxPerCallUsdc: '5.00',
        maxDailyPerCallerUsdc: '500.00',
        createWallet: false,
        webhookUrl: 'https://example.com/webhook',
      },
    });

    const written = JSON.parse(readFileSync(configPath, 'utf-8'));
    expect(written.webhooks).toHaveLength(1);
    expect(written.webhooks[0].url).toBe('https://example.com/webhook');
  });

  it('normalizes tool IDs to lowercase kebab-case', () => {
    const cwd = makeTmpDir();
    const { configPath } = initCommand({
      cwd,
      answers: {
        projectType: 'both',
        toolNames: ['Web Scraper', 'Data Analysis'],
        defaultPriceUsdc: '0.01',
        pricingStrategy: 'demand',
        maxPerCallUsdc: '2.00',
        maxDailyPerCallerUsdc: '200.00',
        createWallet: false,
      },
    });

    const written = JSON.parse(readFileSync(configPath, 'utf-8'));
    expect(written.tools[0].toolId).toBe('web-scraper');
    expect(written.tools[1].toolId).toBe('data-analysis');
  });
});

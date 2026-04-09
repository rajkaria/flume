import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadConfig, validateConfig, getToolConfig } from '../src/ConfigDSL.js';
import type { FlumeConfig } from '../src/types/index.js';

const validConfig = {
  version: '1' as const,
  relay: 'https://relay.flume.xyz',
  ownerWallet: '0x1234567890abcdef1234567890abcdef12345678',
  tools: [
    {
      toolId: 'search',
      name: 'Search Tool',
      protocol: 'x402' as const,
      pricing: { strategy: 'static' as const, staticPriceUsdc: '0.005' },
      settlementWallet: '0xabcdef1234567890abcdef1234567890abcdef12',
    },
  ],
  spendingPolicy: {
    maxPerCallUsdc: '1.00',
    maxDailyPerCallerUsdc: '100.00',
  },
};

describe('ConfigDSL', () => {
  describe('loadConfig', () => {
    it('loads valid config from file', () => {
      const dir = mkdtempSync(join(tmpdir(), 'flume-'));
      const path = join(dir, 'flume.config.json');
      writeFileSync(path, JSON.stringify(validConfig));
      const config = loadConfig(path);
      expect(config.version).toBe('1');
      expect(config.tools).toHaveLength(1);
      rmSync(dir, { recursive: true });
    });

    it('throws on missing file', () => {
      expect(() => loadConfig('/nonexistent/flume.config.json'))
        .toThrow('Flume config not found');
    });

    it('throws on invalid JSON', () => {
      const dir = mkdtempSync(join(tmpdir(), 'flume-'));
      const path = join(dir, 'bad.json');
      writeFileSync(path, 'not json{{{');
      expect(() => loadConfig(path)).toThrow('not valid JSON');
      rmSync(dir, { recursive: true });
    });

    it('throws on schema violation with descriptive error', () => {
      const dir = mkdtempSync(join(tmpdir(), 'flume-'));
      const path = join(dir, 'flume.config.json');
      writeFileSync(path, JSON.stringify({ version: '2' }));
      expect(() => loadConfig(path)).toThrow('Invalid flume config');
      rmSync(dir, { recursive: true });
    });
  });

  describe('validateConfig', () => {
    it('validates correct config object', () => {
      const config = validateConfig(validConfig);
      expect(config.relay).toBe('https://relay.flume.xyz');
    });

    it('rejects missing required fields', () => {
      expect(() => validateConfig({ version: '1' }))
        .toThrow('Invalid flume config');
    });

    it('rejects empty tools array', () => {
      expect(() => validateConfig({ ...validConfig, tools: [] }))
        .toThrow('Invalid flume config');
    });
  });

  describe('getToolConfig', () => {
    it('returns tool by id', () => {
      const config = validateConfig(validConfig) as FlumeConfig;
      const tool = getToolConfig(config, 'search');
      expect(tool.name).toBe('Search Tool');
    });

    it('throws on unknown tool id', () => {
      const config = validateConfig(validConfig) as FlumeConfig;
      expect(() => getToolConfig(config, 'nonexistent'))
        .toThrow('Tool "nonexistent" not found');
    });
  });
});

import { describe, it, expect, afterEach } from 'vitest';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { deployCheck } from '../src/commands/deploy.js';

describe('flume deploy', () => {
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

  it('passes all checks with valid setup', () => {
    const cwd = makeTmpDir();
    writeFileSync(join(cwd, 'flume.config.json'), JSON.stringify({
      version: '1',
      ownerWallet: '0xowner',
      tools: [{ toolId: 'search', settlementWallet: '0xsettle', pricing: { staticPriceUsdc: '0.005' } }],
      spendingPolicy: { maxPerCallUsdc: '1.00', maxDailyPerCallerUsdc: '100.00' },
    }));
    writeFileSync(join(cwd, '.env'), 'CIRCLE_API_KEY=test');

    const result = deployCheck({ cwd });
    expect(result.ready).toBe(true);
  });

  it('fails when config missing', () => {
    const cwd = makeTmpDir();
    const result = deployCheck({ cwd });
    expect(result.ready).toBe(false);
    expect(result.checks.find((c) => c.name === 'config-exists')?.passed).toBe(false);
  });

  it('detects placeholder values', () => {
    const cwd = makeTmpDir();
    writeFileSync(join(cwd, 'flume.config.json'), JSON.stringify({
      version: '1',
      ownerWallet: '0xowner',
      tools: [{ toolId: 'search', settlementWallet: '0xsettle' }],
      webhooks: [{ url: 'https://example.com', secret: 'change-me', events: [] }],
    }));
    writeFileSync(join(cwd, '.env'), 'KEY=val');

    const result = deployCheck({ cwd });
    expect(result.checks.find((c) => c.name === 'no-placeholders')?.passed).toBe(false);
  });

  it('detects missing settlement wallets', () => {
    const cwd = makeTmpDir();
    writeFileSync(join(cwd, 'flume.config.json'), JSON.stringify({
      version: '1',
      ownerWallet: '0xowner',
      tools: [{ toolId: 'search', settlementWallet: '' }],
    }));
    writeFileSync(join(cwd, '.env'), 'KEY=val');

    const result = deployCheck({ cwd });
    expect(result.checks.find((c) => c.name === 'wallets-set')?.passed).toBe(false);
  });
});

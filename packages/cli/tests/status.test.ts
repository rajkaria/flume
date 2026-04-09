import { describe, it, expect, afterEach } from 'vitest';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { statusCommand } from '../src/commands/status.js';

describe('flume status', () => {
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

  it('reports valid config when present', async () => {
    const cwd = makeTmpDir();
    writeFileSync(join(cwd, 'flume.config.json'), JSON.stringify({
      version: '1',
      tools: [{ toolId: 'search', name: 'Search', pricing: { strategy: 'static', staticPriceUsdc: '0.005' } }],
    }));

    const report = await statusCommand({ cwd, relayUrl: 'http://localhost:99999' });
    expect(report.configValid).toBe(true);
    expect(report.tools).toHaveLength(1);
    expect(report.tools[0]!.currentPrice).toBe('0.005');
  });

  it('reports missing config', async () => {
    const cwd = makeTmpDir();
    const report = await statusCommand({ cwd });
    expect(report.configValid).toBe(false);
    expect(report.configErrors).toContain('flume.config.json not found');
  });

  it('reports relay unreachable gracefully', async () => {
    const cwd = makeTmpDir();
    writeFileSync(join(cwd, 'flume.config.json'), JSON.stringify({ version: '1', tools: [] }));
    const report = await statusCommand({ cwd, relayUrl: 'http://localhost:99999' });
    expect(report.relay.reachable).toBe(false);
  });
});

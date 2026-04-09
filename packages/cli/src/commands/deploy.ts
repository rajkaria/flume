import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export interface DeployOptions {
  cwd?: string;
}

export interface DeployCheckResult {
  ready: boolean;
  checks: DeployCheck[];
}

export interface DeployCheck {
  name: string;
  passed: boolean;
  message: string;
}

export function deployCheck(options: DeployOptions = {}): DeployCheckResult {
  const cwd = options.cwd ?? process.cwd();
  const checks: DeployCheck[] = [];

  // Check flume.config.json exists
  const configPath = join(cwd, 'flume.config.json');
  if (existsSync(configPath)) {
    try {
      const config = JSON.parse(readFileSync(configPath, 'utf-8'));
      checks.push({ name: 'config-exists', passed: true, message: 'flume.config.json found' });

      // Check no placeholder values
      const hasPlaceholders = JSON.stringify(config).includes('change-me') ||
        JSON.stringify(config).includes('TODO');
      checks.push({
        name: 'no-placeholders',
        passed: !hasPlaceholders,
        message: hasPlaceholders ? 'Config contains placeholder values' : 'No placeholders found',
      });

      // Check settlement wallets are set
      const hasWallets = config.tools?.every((t: { settlementWallet?: string }) => (t.settlementWallet?.length ?? 0) > 0);
      checks.push({
        name: 'wallets-set',
        passed: Boolean(hasWallets),
        message: hasWallets ? 'All settlement wallets configured' : 'Some tools missing settlement wallets',
      });

      // Check owner wallet
      checks.push({
        name: 'owner-wallet',
        passed: Boolean(config.ownerWallet?.length > 0),
        message: config.ownerWallet?.length > 0 ? 'Owner wallet set' : 'Owner wallet not configured',
      });
    } catch {
      checks.push({ name: 'config-valid', passed: false, message: 'flume.config.json is invalid JSON' });
    }
  } else {
    checks.push({ name: 'config-exists', passed: false, message: 'flume.config.json not found — run flume init first' });
  }

  // Check .env
  const envPath = join(cwd, '.env');
  checks.push({
    name: 'env-exists',
    passed: existsSync(envPath),
    message: existsSync(envPath) ? '.env file found' : '.env file not found',
  });

  return {
    ready: checks.every((c) => c.passed),
    checks,
  };
}

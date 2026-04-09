import type { WalletCommand } from '../types/index.js';

export interface WalletOptions {
  relayUrl?: string;
  command: WalletCommand;
}

export interface WalletResult {
  action: string;
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

export async function walletCommand(options: WalletOptions): Promise<WalletResult> {
  const relayUrl = options.relayUrl ?? 'https://relay.flume.xyz';
  const { command } = options;

  switch (command.action) {
    case 'status': {
      try {
        // In production, calls relay /v1/wallets
        return { action: 'status', success: true, data: { wallets: [] } };
      } catch {
        return { action: 'status', success: false, error: 'Failed to fetch wallets' };
      }
    }

    case 'create': {
      try {
        const res = await fetch(`${relayUrl}/v1/wallets/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: command.walletType === 'tool' ? 'tool-owner' : 'agent',
            label: command.label ?? 'default',
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const wallet = await res.json();
        return { action: 'create', success: true, data: wallet as Record<string, unknown> };
      } catch (err) {
        return { action: 'create', success: false, error: err instanceof Error ? err.message : 'unknown' };
      }
    }

    case 'withdraw': {
      return {
        action: 'withdraw',
        success: false,
        error: 'Withdraw requires production Circle API — use dashboard for withdrawals',
      };
    }
  }
}

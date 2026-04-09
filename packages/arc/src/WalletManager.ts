import type { CreateWalletOptions, WalletInfo, WalletType } from './types/index.js';

export interface CircleWalletClient {
  createWallet(label: string, metadata?: Record<string, unknown>): Promise<{ address: string }>;
  getBalance(address: string): Promise<{ balance: string }>;
  listWallets(): Promise<{ address: string; label: string; createdAt: string }[]>;
}

export class WalletManager {
  private readonly client: CircleWalletClient;
  private readonly wallets = new Map<string, WalletInfo>();

  constructor(client: CircleWalletClient) {
    this.client = client;
  }

  async create(options: CreateWalletOptions): Promise<WalletInfo> {
    const result = await this.client.createWallet(options.label, options.metadata);
    const wallet: WalletInfo = {
      address: result.address,
      balance: '0.000000',
      type: options.type,
      label: options.label,
      createdAt: new Date().toISOString(),
    };
    this.wallets.set(result.address, wallet);
    return wallet;
  }

  async getBalance(address: string): Promise<string> {
    const result = await this.client.getBalance(address);
    return result.balance;
  }

  async getWallet(address: string): Promise<WalletInfo | null> {
    const cached = this.wallets.get(address);
    if (cached) {
      const balance = await this.getBalance(address);
      const updated = { ...cached, balance };
      this.wallets.set(address, updated);
      return updated;
    }
    return null;
  }

  async listWallets(): Promise<WalletInfo[]> {
    return Array.from(this.wallets.values());
  }
}

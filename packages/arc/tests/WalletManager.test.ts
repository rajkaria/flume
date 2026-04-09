import { describe, it, expect, vi } from 'vitest';
import { WalletManager } from '../src/WalletManager.js';

describe('WalletManager', () => {
  function createManager() {
    const client = {
      createWallet: vi.fn().mockResolvedValue({ address: '0xnewwallet' }),
      getBalance: vi.fn().mockResolvedValue({ balance: '50.000000' }),
      listWallets: vi.fn().mockResolvedValue([]),
    };
    const manager = new WalletManager(client);
    return { manager, client };
  }

  it('creates wallet and returns info', async () => {
    const { manager } = createManager();
    const wallet = await manager.create({
      type: 'tool-owner',
      label: 'My Tool Wallet',
    });
    expect(wallet.address).toBe('0xnewwallet');
    expect(wallet.type).toBe('tool-owner');
    expect(wallet.label).toBe('My Tool Wallet');
  });

  it('gets balance', async () => {
    const { manager } = createManager();
    const balance = await manager.getBalance('0xsomewallet');
    expect(balance).toBe('50.000000');
  });

  it('gets wallet with updated balance', async () => {
    const { manager } = createManager();
    await manager.create({ type: 'agent', label: 'Agent Wallet' });
    const wallet = await manager.getWallet('0xnewwallet');
    expect(wallet).not.toBeNull();
    expect(wallet!.balance).toBe('50.000000');
  });

  it('returns null for unknown wallet', async () => {
    const { manager } = createManager();
    const wallet = await manager.getWallet('0xunknown');
    expect(wallet).toBeNull();
  });

  it('lists wallets', async () => {
    const { manager } = createManager();
    await manager.create({ type: 'tool-owner', label: 'Wallet 1' });
    const list = await manager.listWallets();
    expect(list).toHaveLength(1);
  });
});

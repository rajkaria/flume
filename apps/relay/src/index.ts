import { FlumeRelay, InMemoryLedgerStorage, InMemoryNonceRegistry } from '@flume/arc';

const port = parseInt(process.env.PORT ?? '3001', 10);

const relay = new FlumeRelay({
  ledgerStorage: new InMemoryLedgerStorage(),
  nonceRegistry: new InMemoryNonceRegistry(),
  circleClient: {
    async validatePayment() {
      // TODO: Wire to real Circle Nanopayments SDK
      return { valid: true, txRef: `tx-${Date.now()}` };
    },
  },
  walletClient: {
    async createWallet(label) {
      return { address: `0x${label.replace(/\s/g, '').toLowerCase()}` };
    },
    async getBalance() {
      return { balance: '0.000000' };
    },
    async listWallets() {
      return [];
    },
  },
});

const app = relay.getApp();

app.listen(port, () => {
  console.log(`FlumeRelay running on port ${port}`);
});

// Settlement worker — runs every 15 minutes
setInterval(() => {
  relay.runSettlement().catch(console.error);
}, 15 * 60 * 1000);

import express, { type Express, type Request, type Response } from 'express';
import type { RelayHealth } from './types/index.js';
import { NanopayVerifier, type CircleClient, type NanopayVerifierOptions } from './NanopayVerifier.js';
import { EarningsLedger, type LedgerStorage } from './EarningsLedger.js';
import { WalletManager, type CircleWalletClient } from './WalletManager.js';
import { ArcSettler, type ArcContract } from './ArcSettler.js';
import type { NonceRegistry } from './types/index.js';

export interface FlumeRelayDeps {
  readonly ledgerStorage: LedgerStorage;
  readonly nonceRegistry: NonceRegistry;
  readonly circleClient: CircleClient;
  readonly walletClient: CircleWalletClient;
  readonly arcContract?: ArcContract;
  readonly port?: number;
}

export class FlumeRelay {
  private readonly app: Express;
  private readonly verifier: NanopayVerifier;
  private readonly ledger: EarningsLedger;
  private readonly walletManager: WalletManager;
  private readonly settler: ArcSettler;
  private readonly startTime: number;

  constructor(deps: FlumeRelayDeps) {
    this.app = express();
    this.app.use(express.json());
    this.startTime = Date.now();

    this.verifier = new NanopayVerifier({
      nonceRegistry: deps.nonceRegistry,
      circleClient: deps.circleClient,
    });
    this.ledger = new EarningsLedger(deps.ledgerStorage);
    this.walletManager = new WalletManager(deps.walletClient);
    this.settler = new ArcSettler(deps.arcContract);

    this.registerRoutes();
  }

  getApp(): Express {
    return this.app;
  }

  private registerRoutes(): void {
    this.app.post('/v1/validate', this.handleValidate.bind(this));
    this.app.get('/v1/status', this.handleStatus.bind(this));
    this.app.post('/v1/wallets/create', this.handleCreateWallet.bind(this));
    this.app.get('/v1/wallets/:address', this.handleGetWallet.bind(this));
    this.app.post('/v1/tools/register', this.handleRegisterTool.bind(this));
    this.app.get('/v1/tools/:toolId/price', this.handleGetPrice.bind(this));
    this.app.get('/v1/nonce', this.handleGetNonce.bind(this));
    this.app.get('/v1/attestation/:txRef', this.handleGetAttestation.bind(this));
    this.app.post('/v1/webhooks', this.handleRegisterWebhook.bind(this));
    this.app.get('/health', this.handleHealth.bind(this));
  }

  private async handleValidate(req: Request, res: Response): Promise<void> {
    try {
      const { proof, expectedPrice } = req.body;
      if (!proof || !expectedPrice) {
        res.status(400).json({ error: 'missing proof or expectedPrice' });
        return;
      }
      const result = await this.verifier.validate({ proof, expectedPrice, priceTolerance: 0.01 });

      if (result.valid) {
        await this.ledger.record({
          id: `entry-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          eventType: 'payment.validated',
          toolId: proof.toolId,
          callerWallet: proof.callerWallet,
          amount: proof.amount,
          currency: 'USDC',
          txRef: result.txRef,
          protocol: 'x402',
          createdAt: new Date().toISOString(),
        });
      }

      res.json(result);
    } catch {
      res.status(500).json({ error: 'internal error' });
    }
  }

  private async handleStatus(_req: Request, res: Response): Promise<void> {
    res.json({
      status: 'healthy',
      uptime: Date.now() - this.startTime,
      version: '0.1.0',
    });
  }

  private async handleCreateWallet(req: Request, res: Response): Promise<void> {
    try {
      const { type, label } = req.body;
      const wallet = await this.walletManager.create({ type: type ?? 'tool-owner', label: label ?? 'default' });
      res.status(201).json(wallet);
    } catch {
      res.status(500).json({ error: 'failed to create wallet' });
    }
  }

  private async handleGetWallet(req: Request, res: Response): Promise<void> {
    const wallet = await this.walletManager.getWallet(req.params['address'] as string);
    if (!wallet) {
      res.status(404).json({ error: 'wallet not found' });
      return;
    }
    res.json(wallet);
  }

  private async handleRegisterTool(req: Request, res: Response): Promise<void> {
    // Tool registration — stores in Supabase in production
    const { toolId, ownerWallet, settlementWallet, pricePerCall } = req.body;
    res.status(201).json({ toolId, registered: true });
  }

  private async handleGetPrice(req: Request, res: Response): Promise<void> {
    // In production, looks up from tools table
    res.json({ toolId: req.params['toolId'] as string, price: '0.005', currency: 'USDC' });
  }

  private async handleGetNonce(_req: Request, res: Response): Promise<void> {
    const { randomBytes } = await import('node:crypto');
    const nonce = randomBytes(16).toString('hex');
    res.json({ nonce, expiresIn: 30 });
  }

  private async handleGetAttestation(req: Request, res: Response): Promise<void> {
    const entry = await this.ledger.query({ limit: 1 });
    const found = entry.entries.find((e) => e.txRef === (req.params['txRef'] as string));
    if (!found) {
      res.status(404).json({ error: 'attestation not found' });
      return;
    }
    res.json(found);
  }

  private async handleRegisterWebhook(req: Request, res: Response): Promise<void> {
    const { url, events, secret } = req.body;
    res.status(201).json({ url, events, registered: true });
  }

  private async handleHealth(_req: Request, res: Response): Promise<void> {
    const health: RelayHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        circle: { status: 'ok', latencyMs: 0 },
        supabase: { status: 'ok', latencyMs: 0 },
        redis: { status: 'ok', latencyMs: 0 },
        arc: { status: 'ok', latencyMs: 0 },
      },
      queue: {
        pendingPayments: 0,
        nextSettlementIn: '15m 0s',
      },
    };
    res.json(health);
  }

  async runSettlement(): Promise<void> {
    const unsettled = await this.ledger.getUnsettled();
    if (unsettled.length === 0) return;

    // Group by settlement wallet (in production, looked up from tools table)
    const batchId = `batch-${Date.now()}`;
    const totalAmount = unsettled.reduce((sum, e) => sum + parseFloat(e.amount), 0);

    const result = await this.settler.settle({
      batchId,
      entries: unsettled,
      totalAmountUsdc: totalAmount.toFixed(6),
      settlementWallet: '0xdefault', // Would be per-tool in production
    });

    if (result.success) {
      await this.ledger.markSettled(
        unsettled.map((e) => e.id),
        batchId,
      );
    }
  }
}

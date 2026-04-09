import { randomBytes } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import type {
  FlumeConfig,
  ToolConfig,
  PaymentCheckResult,
  Http402Response,
  PaymentProofHeader,
} from './types/index.js';
import { SpendingPolicy } from './SpendingPolicy.js';

export interface PaymentValidator {
  validate(proof: PaymentProofHeader): Promise<PaymentCheckResult>;
}

export class PaymentGate {
  private readonly config: FlumeConfig;
  private readonly policy: SpendingPolicy;
  private readonly validator: PaymentValidator | undefined;

  constructor(
    config: FlumeConfig,
    validator?: PaymentValidator,
  ) {
    this.config = config;
    this.policy = new SpendingPolicy(config.spendingPolicy);
    this.validator = validator;
  }

  middleware() {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const toolId = this.extractToolId(req);
      if (!toolId) {
        next();
        return;
      }

      const tool = this.config.tools.find((t) => t.toolId === toolId);
      if (!tool) {
        next();
        return;
      }

      // Free protocol — pass through
      if (tool.protocol === 'free') {
        next();
        return;
      }

      // Check for payment proof header
      const paymentHeader = req.headers['x-flume-payment'] as string | undefined;

      if (!paymentHeader) {
        // No payment — return 402
        this.send402(res, tool);
        return;
      }

      // Parse payment proof
      let proof: PaymentProofHeader;
      try {
        proof = JSON.parse(Buffer.from(paymentHeader, 'base64').toString('utf-8')) as PaymentProofHeader;
      } catch {
        res.status(400).json({ error: 'invalid X-Flume-Payment header' });
        return;
      }

      // SpendingPolicy check BEFORE payment validation
      const price = this.getStaticPrice(tool);
      const policyResult = this.policy.check(proof.callerWallet, price);
      if (!policyResult.allowed) {
        res.status(403).json({
          error: 'spending_policy_violation',
          reason: policyResult.reason,
        });
        return;
      }

      // Validate payment if validator is provided
      if (this.validator) {
        const result = await this.validator.validate(proof);
        if (!result.valid) {
          this.send402(res, tool, result.reason);
          return;
        }
      }

      // Record spending
      this.policy.record(proof.callerWallet, price);

      // Attach payment info to request for downstream use
      (req as Request & { flumePayment?: PaymentCheckResult }).flumePayment = {
        valid: true,
        txRef: proof.txRef,
        price,
        toolId,
      };

      next();
    };
  }

  private extractToolId(req: Request): string | undefined {
    // MCP: JSON-RPC method name
    if (req.headers['content-type']?.includes('application/json') && req.body?.method) {
      return req.body.method as string;
    }
    // HTTP REST: X-Flume-Tool header or path-based
    const toolHeader = req.headers['x-flume-tool'] as string | undefined;
    if (toolHeader) return toolHeader;
    // Path-based: /tools/:toolId
    const match = /\/tools\/([^/]+)/.exec(req.path);
    return match?.[1];
  }

  private getStaticPrice(tool: ToolConfig): string {
    if (tool.pricing.strategy === 'static' && tool.pricing.staticPriceUsdc) {
      return tool.pricing.staticPriceUsdc;
    }
    return '0.000000';
  }

  private send402(res: Response, tool: ToolConfig, reason?: string): void {
    const nonce = randomBytes(16).toString('hex');
    const now = Date.now();
    const body: Http402Response = {
      price: this.getStaticPrice(tool),
      currency: 'USDC',
      relay: this.config.relay,
      recipient: tool.settlementWallet,
      protocol: tool.protocol,
      nonce,
      toolId: tool.toolId,
      timestamp: now,
      expiresAt: now + 30_000,
      accepts: ['circle-nanopay'],
    };
    res.status(402).json({ ...body, ...(reason ? { reason } : {}) });
  }
}

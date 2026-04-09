import type {
  PaymentProof,
  ValidationRequest,
  ValidationResult,
  ValidationFailureReason,
  NonceRegistry,
} from './types/index.js';

export interface CircleClient {
  validatePayment(proof: PaymentProof): Promise<{ valid: boolean; txRef?: string; error?: string }>;
}

export interface NanopayVerifierOptions {
  readonly nonceRegistry: NonceRegistry;
  readonly circleClient: CircleClient;
  readonly timestampWindowMs?: number; // default 30_000
  readonly nonceTtlSeconds?: number;   // default 300
  readonly priceTolerance?: number;    // default 0.01 (1%)
}

export class NanopayVerifier {
  private readonly nonceRegistry: NonceRegistry;
  private readonly circleClient: CircleClient;
  private readonly timestampWindowMs: number;
  private readonly nonceTtlSeconds: number;
  private readonly priceTolerance: number;

  constructor(options: NanopayVerifierOptions) {
    this.nonceRegistry = options.nonceRegistry;
    this.circleClient = options.circleClient;
    this.timestampWindowMs = options.timestampWindowMs ?? 30_000;
    this.nonceTtlSeconds = options.nonceTtlSeconds ?? 300;
    this.priceTolerance = options.priceTolerance ?? 0.01;
  }

  async validate(request: ValidationRequest): Promise<ValidationResult> {
    const { proof, expectedPrice } = request;

    // Check 1: Timestamp within window
    const now = Date.now();
    if (Math.abs(now - proof.timestamp) > this.timestampWindowMs) {
      return this.fail('expired_timestamp', 'payment timestamp outside allowed window');
    }

    // Check 2: Nonce not seen before
    const nonceIsNew = await this.nonceRegistry.checkAndStore(proof.nonce, this.nonceTtlSeconds);
    if (!nonceIsNew) {
      return this.fail('duplicate_nonce', 'nonce has already been used (replay attempt)');
    }

    // Check 3: Signature verification (delegated to Circle in production)
    if (!proof.signature || proof.signature.length < 2) {
      return this.fail('invalid_signature', 'missing or malformed signature');
    }

    // Check 4: Amount matches expected price within tolerance
    const proofAmount = parseFloat(proof.amount);
    const expected = parseFloat(expectedPrice);
    const tolerance = expected * this.priceTolerance;
    if (Math.abs(proofAmount - expected) > tolerance) {
      return this.fail('amount_mismatch', `payment amount ${proof.amount} does not match expected ${expectedPrice}`);
    }

    // Check 5: Circle Nanopayments validation
    try {
      const circleResult = await this.circleClient.validatePayment(proof);
      if (!circleResult.valid) {
        return this.fail('circle_rejected', circleResult.error ?? 'Circle rejected payment');
      }

      return {
        valid: true,
        txRef: circleResult.txRef ?? proof.txRef,
        checkedAt: Date.now(),
      };
    } catch {
      return this.fail('relay_error', 'Circle API unavailable');
    }
  }

  private fail(reason: ValidationFailureReason, message: string): ValidationResult {
    return {
      valid: false,
      reason: message,
      checkedAt: Date.now(),
    };
  }
}

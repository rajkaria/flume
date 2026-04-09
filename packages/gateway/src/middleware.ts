import type { FlumeConfig, FlumeMiddleware } from './types/index.js';
import { PaymentGate, type PaymentValidator } from './PaymentGate.js';

export function flumeMiddleware(
  config: FlumeConfig,
  validator?: PaymentValidator,
): FlumeMiddleware {
  const gate = new PaymentGate(config, validator);
  return gate.middleware();
}

import { createHash } from 'node:crypto';
import type {
  LedgerEntryWithHash,
  BatchSettlement,
  SettlementResult,
} from './types/index.js';

export interface ArcContract {
  anchorSettlement(batchId: string, merkleRoot: string, totalAmount: string): Promise<{ txHash: string }>;
}

export class ArcSettler {
  private readonly contract: ArcContract | undefined;

  constructor(contract?: ArcContract) {
    this.contract = contract;
  }

  async settle(batch: BatchSettlement): Promise<SettlementResult> {
    const merkleRoot = this.computeMerkleRoot(batch.entries);

    if (this.contract) {
      try {
        const result = await this.contract.anchorSettlement(
          batch.batchId,
          merkleRoot,
          batch.totalAmountUsdc,
        );
        return {
          batchId: batch.batchId,
          success: true,
          arcTxHash: result.txHash,
          merkleRoot,
          entryCount: batch.entries.length,
          totalAmountUsdc: batch.totalAmountUsdc,
          settledAt: new Date().toISOString(),
        };
      } catch (err) {
        return {
          batchId: batch.batchId,
          success: false,
          merkleRoot,
          entryCount: batch.entries.length,
          totalAmountUsdc: batch.totalAmountUsdc,
          error: err instanceof Error ? err.message : 'unknown error',
          settledAt: new Date().toISOString(),
        };
      }
    }

    // No contract — log intent (pre-deployment)
    return {
      batchId: batch.batchId,
      success: true,
      merkleRoot,
      entryCount: batch.entries.length,
      totalAmountUsdc: batch.totalAmountUsdc,
      settledAt: new Date().toISOString(),
    };
  }

  private computeMerkleRoot(entries: readonly LedgerEntryWithHash[]): string {
    if (entries.length === 0) return createHash('sha256').update('empty').digest('hex');
    const leaves = entries.map((e) => e.entryHash);
    return this.buildMerkleTree(leaves);
  }

  private buildMerkleTree(leaves: string[]): string {
    if (leaves.length === 1) return leaves[0]!;
    const next: string[] = [];
    for (let i = 0; i < leaves.length; i += 2) {
      const left = leaves[i]!;
      const right = leaves[i + 1] ?? left; // duplicate last if odd
      next.push(createHash('sha256').update(left + right).digest('hex'));
    }
    return this.buildMerkleTree(next);
  }
}

// src/lib/x402/replayProtection.ts
// Database-backed x402 replay protection
// Survives PM2/server restarts (unlike in-memory sets)
// Addresses the friction point from WorkAgnt documented in the PRD

import { keccak256, toBytes } from 'viem';
import { processPayment as dbProcessPayment } from '@/lib/db';

/**
 * Processes an x402 payment with replay protection.
 *
 * Uses SQLite's UNIQUE constraint for atomic deduplication.
 * If the same paymentHash is seen twice (replay attack or PM2 restart),
 * the second call throws — preventing double-spend.
 *
 * @param paymentHash - Unique identifier for this payment (from X-PAYMENT header)
 * @param amount - USDC amount paid
 * @param recipient - Payment recipient address
 * @param endpoint - The data API endpoint being paid for
 * @param processFn - The actual data fetching logic to execute
 */
export async function processX402Payment<T>(
  paymentHash: string,
  amount: number,
  recipient: string,
  endpoint: string,
  processFn: () => Promise<T>
): Promise<T> {
  // Atomic INSERT OR IGNORE — if hash already exists, changes === 0
  return dbProcessPayment(paymentHash, amount, recipient, endpoint, processFn);
}

/**
 * Generates a deterministic payment hash from x402 payment parameters.
 * Used as the deduplication key.
 */
export function generatePaymentHash(params: {
  amount: string;
  token: string;
  recipient: string;
  chainId: number;
  nonce?: string;
}): string {
  const raw = `${params.amount}:${params.token}:${params.recipient}:${params.chainId}:${params.nonce || ''}`;
  return keccak256(toBytes(raw));
}

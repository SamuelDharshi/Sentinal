// src/lib/chain/transactions.ts
// Real on-chain transaction encoding for 1Shot submission
// Encodes ERC-20 USDC transfers + arbitrary calls as ABI-encoded calldata
// These are the REAL transactions that 1Shot relays on-chain via ERC-7710

import { encodeFunctionData, parseUnits } from 'viem';
import { USDC_ABI, USDC_ADDRESS } from './client';

export interface EncodedTransaction {
  to: `0x${string}`;
  data: `0x${string}`;
  value: string; // hex string
}

/**
 * Encodes a real USDC transfer call for 1Shot submission.
 * This is what the Scout Agent sends when paying for x402 data.
 *
 * @param recipient - Payment recipient address
 * @param amountUSDC - Amount in USDC (e.g. 0.001 for $0.001)
 * @returns ABI-encoded calldata ready for relayer_send7710Transaction
 */
export function encodeUSDCTransfer(
  recipient: `0x${string}`,
  amountUSDC: number
): EncodedTransaction {
  const amountMicro = parseUnits(amountUSDC.toFixed(6), 6); // 6 decimals

  const data = encodeFunctionData({
    abi: USDC_ABI,
    functionName: 'transfer',
    args: [recipient, amountMicro],
  });

  return {
    to: USDC_ADDRESS,
    data,
    value: '0x0',
  };
}

/**
 * Encodes multiple transactions into the format expected by relayer_send7710Transaction.
 * 1Shot accepts an array of encoded transaction objects.
 */
export function buildTransactionBundle(
  txs: EncodedTransaction[]
): string[] {
  // 1Shot expects each tx as a JSON-encoded string or as structured object
  return txs.map(tx => JSON.stringify(tx));
}

/**
 * Encodes a Venice AI x402 micro-payment transaction.
 * Used when the CFO Agent decides to pay for a Venice API call on-chain.
 */
export function encodeVenicePayment(
  venicePaymentAddress: `0x${string}`,
  amountUSDC: number
): EncodedTransaction {
  return encodeUSDCTransfer(venicePaymentAddress, amountUSDC);
}

/**
 * Encodes a data provider payment for x402 API access.
 * Used by Scout Agent when a data endpoint returns 402.
 */
export function encodeDataProviderPayment(
  providerAddress: `0x${string}`,
  amountMicro: bigint
): EncodedTransaction {
  const data = encodeFunctionData({
    abi: USDC_ABI,
    functionName: 'transfer',
    args: [providerAddress, amountMicro],
  });

  return {
    to: USDC_ADDRESS,
    data,
    value: '0x0',
  };
}

// src/lib/chain/balance.ts
// Real on-chain USDC balance and allowance reads via viem publicClient
// No mocks — calls Base Mainnet directly

import { publicClient, USDC_ABI, USDC_ADDRESS } from './client';
import { formatUnits } from 'viem';

/**
 * Reads the real USDC balance of an address from Base Mainnet.
 * Returns balance as a human-readable number (e.g. 10.5 for $10.50).
 */
export async function getUSDCBalance(address: `0x${string}`): Promise<number> {
  const raw = await publicClient.readContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: [address],
  });
  return Number(formatUnits(raw, 6));
}

/**
 * Reads the USDC allowance granted from owner to spender.
 * Used to verify ERC-7715 permissions are still active.
 */
export async function getUSDCAllowance(
  owner: `0x${string}`,
  spender: `0x${string}`
): Promise<number> {
  const raw = await publicClient.readContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: [owner, spender],
  });
  return Number(formatUnits(raw, 6));
}

/**
 * Checks if an address has been upgraded to an EIP-7702 Smart Account.
 * Smart Accounts have bytecode starting with 0xef0100 (the delegation marker).
 */
export async function isDeleGator(address: `0x${string}`): Promise<boolean> {
  try {
    const code = await publicClient.getCode({ address });
    return !!code && code.startsWith('0xef0100');
  } catch {
    return false;
  }
}

/**
 * Gets the current Base block number — used to timestamp audit events
 * and verify transaction finality.
 */
export async function getCurrentBlock(): Promise<bigint> {
  return publicClient.getBlockNumber();
}

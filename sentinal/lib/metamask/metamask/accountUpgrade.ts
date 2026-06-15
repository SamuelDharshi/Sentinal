// src/lib/metamask/accountUpgrade.ts
// EIP-7702 Smart Account detection and upgrade
// Uses viem publicClient to check bytecode prefix

'use client';

import { publicClient, currentChain } from '@/lib/chain/client';

/**
 * Checks if an address has been upgraded to a Smart Account (EIP-7702).
 * EIP-7702 delegated accounts have bytecode starting with 0xef0100.
 * This is the "DeleGator check" — the friction point documented in the PRD DX feedback.
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
 * Returns the MetaMask Smart Accounts Kit environment configuration.
 * Actual EIP-7702 upgrade transaction is submitted via 1Shot relayer (gasless, USDC).
 * The wallet (MetaMask) handles the authorization signature internally.
 */
export async function getSmartAccountEnvironment() {
  return {
    chain: currentChain,
    chainId: Number(process.env.NEXT_PUBLIC_BASE_CHAIN_ID || '8453'),
    rpcUrl: process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org',
    // Implementation.Hybrid supports both delegator and standard EOA modes
    implementation: 'Hybrid',
  };
}

/**
 * Initiates a smart account upgrade check and returns whether upgrade is needed.
 */
export async function checkAndPrepareUpgrade(userAddress: `0x${string}`): Promise<{
  isSmartAccount: boolean;
  needsUpgrade: boolean;
  address: `0x${string}`;
}> {
  const isSmartAccount = await isDeleGator(userAddress);
  return {
    isSmartAccount,
    needsUpgrade: !isSmartAccount,
    address: userAddress,
  };
}

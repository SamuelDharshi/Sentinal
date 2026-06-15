// ERC-7715 permission grant — uses env-configured chain + USDC address

'use client';

import { currentChain, USDC_ADDRESS } from '@/lib/chain/client';

const THIRTY_DAYS_SECS = 30 * 24 * 60 * 60;

export interface GrantedPermission {
  permissionsContext: `0x${string}`;
  permissions: unknown[];
  expiry: number;
  grantee: `0x${string}`;
}

/**
 * Grants a weekly USDC budget via ERC-7715 wallet_grantPermissions.
 * Triggers the only MetaMask popup the user sees during setup.
 */
export async function grantWeeklyBudget(
  sessionKeyAddress: `0x${string}`,
  weeklyUSDC: number
): Promise<GrantedPermission> {
  if (!window.ethereum) {
    throw new Error('MetaMask not found. Install the MetaMask extension.');
  }

  const weeklyMicro = BigInt(Math.round(weeklyUSDC * 1_000_000));
  const expiry = Math.floor(Date.now() / 1000) + THIRTY_DAYS_SECS;
  const chainIdHex = `0x${currentChain.id.toString(16)}`;

  const result = await window.ethereum.request({
    method: 'wallet_grantPermissions',
    params: [
      {
        chainId: chainIdHex,
        expiry,
        permissions: [
          {
            type: 'erc20-token-periodic',
            required: true,
            data: {
              token: USDC_ADDRESS,
              allowance: weeklyMicro.toString(),
              period: 604800,
              isAdjustmentAllowed: false,
            },
            policies: [
              {
                type: 'account-address-match',
                data: { address: sessionKeyAddress },
              },
            ],
          },
        ],
        signer: {
          type: 'account',
          data: { id: sessionKeyAddress },
        },
      },
    ],
  });

  return result as GrantedPermission;
}

export async function getRemainingBudget(
  userAddress: `0x${string}`,
  sessionKeyAddress: `0x${string}`
): Promise<number> {
  const { getUSDCAllowance } = await import('@/lib/chain/balance');
  return getUSDCAllowance(userAddress, sessionKeyAddress);
}

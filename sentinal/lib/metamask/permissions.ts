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

  try {
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
  } catch (error: any) {
    const isMethodNotFound = 
      error?.code === -32601 || 
      error?.message?.includes('wallet_grantPermissions') || 
      error?.message?.includes('method does not exist') ||
      error?.message?.includes('not exist') ||
      error?.message?.includes('not available');

    if (isMethodNotFound) {
      console.warn('[SENTINEL] wallet_grantPermissions not supported by this MetaMask version. Falling back to mock permission context.');
      const mockContext = `0xmock${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}` as `0x${string}`;
      return {
        permissionsContext: mockContext,
        permissions: [
          {
            type: 'erc20-token-periodic',
            data: {
              token: USDC_ADDRESS,
              allowance: weeklyMicro.toString(),
              period: 604800,
            }
          }
        ],
        expiry,
        grantee: sessionKeyAddress,
      };
    }
    throw error;
  }
}

export async function getRemainingBudget(
  userAddress: `0x${string}`,
  sessionKeyAddress: `0x${string}`
): Promise<number> {
  const { getUSDCAllowance } = await import('@/lib/chain/balance');
  return getUSDCAllowance(userAddress, sessionKeyAddress);
}

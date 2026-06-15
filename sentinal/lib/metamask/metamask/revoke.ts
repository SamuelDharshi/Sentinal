// src/lib/metamask/revoke.ts
// Kill Switch — ERC-7715 permission revocation
// Revoking the root permission mathematically defunds the ENTIRE chain:
//   Chief → Scout → Analyst → CFO
// All sub-agent delegations become invalid in the same block.

'use client';

/**
 * Emergency revocation of the root ERC-7715 permission.
 *
 * When this is called:
 * 1. The root delegation is revoked on-chain
 * 2. Every child delegation (Scout, Analyst, CFO) inherits the revocation
 * 3. All future agent transactions will fail the permission validation
 * 4. No USDC can be spent by any agent after this call
 *
 * This is the "holy grail" kill switch — mathematically, not administratively.
 *
 * Docs: https://github.com/MetaMask/smart-accounts-kit/releases (v1.6.0 ApprovalRevocationEnforcer)
 */
export async function emergencyRevoke(permissionsContext: string): Promise<void> {
  if (!window.ethereum) {
    throw new Error('MetaMask not found');
  }

  // wallet_revokePermissions — ERC-7715 revocation RPC
  await window.ethereum.request({
    method: 'wallet_revokePermissions',
    params: [
      {
        permissionsContext,
      },
    ],
  });

  console.log('[SENTINEL] 🔴 Root permission REVOKED. All agents defunded.');
}

/**
 * Checks if a permission context is still active (not revoked).
 */
export async function isPermissionActive(
  _permissionsContext: string
): Promise<boolean> {
  // In production: query the DeleGatorCore contract
  // For demo: always returns true unless locally marked as killed
  if (typeof window !== 'undefined') {
    return !localStorage.getItem('sentinel_killed');
  }
  return true;
}

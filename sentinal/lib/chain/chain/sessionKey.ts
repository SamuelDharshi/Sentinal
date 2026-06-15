// src/lib/chain/sessionKey.ts
// Real ephemeral session keypair management
// The session key is an in-browser ephemeral private key that signs agent transactions.
// It is delegated to via ERC-7715 from the user's MetaMask wallet.
// Private key is stored in sessionStorage (cleared on tab close) — never persisted to disk.

import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

const SESSION_KEY_STORAGE = 'sentinel_session_privkey';

export interface SessionKeyPair {
  privateKey: `0x${string}`;
  address: `0x${string}`;
}

/**
 * Generates or retrieves a real ephemeral session keypair.
 * - On first call: generates a secure random private key via viem
 * - On subsequent calls: returns the same key from sessionStorage
 * - On tab close: sessionStorage is cleared automatically
 *
 * This address is what gets registered as the signer in the ERC-7715 grant.
 */
export function getOrCreateSessionKey(): SessionKeyPair {
  if (typeof window === 'undefined') {
    throw new Error('Session keys are browser-only');
  }

  const existing = sessionStorage.getItem(SESSION_KEY_STORAGE);
  if (existing) {
    const privKey = existing as `0x${string}`;
    const account = privateKeyToAccount(privKey);
    return { privateKey: privKey, address: account.address };
  }

  // Generate a real cryptographically secure random private key
  const privKey = generatePrivateKey();
  sessionStorage.setItem(SESSION_KEY_STORAGE, privKey);
  const account = privateKeyToAccount(privKey);

  console.log('[SENTINEL] Session key generated:', account.address);
  return { privateKey: privKey, address: account.address };
}

/**
 * Returns the viem account object for transaction signing.
 * Used by the 1Shot submission layer to sign the permission context.
 */
export function getSessionAccount() {
  const { privateKey } = getOrCreateSessionKey();
  return privateKeyToAccount(privateKey);
}

/**
 * Clears the session key — called on Kill Switch activation.
 * Once cleared, no more transactions can be signed even if the
 * on-chain permission hasn't been revoked yet.
 */
export function clearSessionKey(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(SESSION_KEY_STORAGE);
  }
}

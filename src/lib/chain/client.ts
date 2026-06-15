// src/lib/chain/client.ts
// Real viem clients for Base Mainnet
// Used by all on-chain reads and transaction encoding

import { createPublicClient, createWalletClient, http, custom } from 'viem';
import { base, baseSepolia } from 'viem/chains';

const RPC_URL = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org';
const CHAIN_ID = Number(process.env.NEXT_PUBLIC_BASE_CHAIN_ID || '8453');
export const currentChain = CHAIN_ID === 84532 ? baseSepolia : base;

// Public client — for reading state (bytecode, balances, allowances)
export const publicClient = createPublicClient({
  chain: currentChain,
  transport: http(RPC_URL),
});

// Wallet client factory — wraps MetaMask provider (browser-only)
export function getBrowserWalletClient() {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not available');
  }
  return createWalletClient({
    chain: currentChain,
    transport: custom(window.ethereum),
  });
}

// USDC contract ABI — minimal for transfer + balanceOf + allowance
export const USDC_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to',    type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner',   type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
] as const;

export const USDC_ADDRESS = (
  process.env.NEXT_PUBLIC_USDC_ADDRESS ||
  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
) as `0x${string}`;

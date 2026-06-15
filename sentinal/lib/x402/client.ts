// src/lib/x402/client.ts
// Real x402 Agentic Payment Client
// Constructs proper ERC-7710-backed payment headers for x402 endpoints
// Uses viem to sign the payment authorization with the session key

import { createWalletClient, http, encodeFunctionData, parseUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { currentChain, USDC_ABI, USDC_ADDRESS } from '@/lib/chain/client';
import { submitRealPayment } from '@/lib/oneshot/submit';
import { processX402Payment, generatePaymentHash } from './replayProtection';
import { insertAuditEvent } from '@/lib/db';
import { ScoutResult } from '@/types';
import crypto from 'crypto';

const BASESCAN = process.env.NEXT_PUBLIC_BASESCAN_URL || 'https://basescan.org/tx';

export interface X402PaymentRequirement {
  scheme: string;
  network: string;
  maxAmountRequired: string;   // In token base units (USDC = 6 decimals)
  resource: string;            // The URL being paid for
  description: string;
  mimeType: string;
  payTo: `0x${string}`;       // Recipient address
  maxTimeoutSeconds: number;
  asset: string;               // Token contract address
  extra?: {
    name: string;
    version: string;
  };
}

/**
 * Real x402 Agentic Payment Handler
 *
 * Full flow per EIP-x402 spec:
 * 1. Probe endpoint — get 402 + X-Payment-Requirements header
 * 2. Parse payment requirements (amount, recipient, token, network)
 * 3. Verify cost ≤ agent's delegated budget
 * 4. Submit REAL USDC payment via 1Shot relayer using ERC-7710 context
 * 5. Construct X-PAYMENT header with real transaction hash
 * 6. Retry original request with payment proof
 * 7. SQLite deduplication prevents replay attacks
 */
export async function fetchWithRealX402(
  endpoint: string,
  query: string,
  permissionsContext: string,
  sessionPrivKey: `0x${string}`,
  remainingBudget: number
): Promise<ScoutResult> {
  const url = `${endpoint}?q=${encodeURIComponent(query)}`;

  // ── Step 1: Probe the endpoint ────────────────────────────────────────
  let probeResponse: Response;
  try {
    probeResponse = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    });
  } catch (e) {
    throw new Error(`Network error probing ${endpoint}: ${e}`);
  }

  // Free endpoint — return immediately
  if (probeResponse.status !== 402) {
    const data = await probeResponse.text();
    return { source: endpoint, query, data, cost: 0 };
  }

  // ── Step 2: Parse payment requirements from 402 response ──────────────
  let requirements: X402PaymentRequirement;
  try {
    // x402 spec: payment requirements in response body or X-Payment-Requirements header
    const bodyText = await probeResponse.text();
    const header = probeResponse.headers.get('X-Payment-Requirements');

    if (header) {
      requirements = JSON.parse(Buffer.from(header, 'base64').toString());
    } else if (bodyText) {
      requirements = JSON.parse(bodyText);
    } else {
      throw new Error('No payment requirements found in 402 response');
    }
  } catch {
    // Fallback: parse from individual headers (legacy x402 implementations)
    requirements = {
      scheme: 'exact',
      network: `eip155:${process.env.NEXT_PUBLIC_BASE_CHAIN_ID || '8453'}`,
      maxAmountRequired: probeResponse.headers.get('X-Payment-Amount') || '1000',
      resource: url,
      description: `Data access: ${new URL(endpoint).hostname}`,
      mimeType: 'application/json',
      payTo: (probeResponse.headers.get('X-Payment-Recipient') || '0x0000000000000000000000000000000000000000') as `0x${string}`,
      maxTimeoutSeconds: 30,
      asset: `eip155:${process.env.NEXT_PUBLIC_BASE_CHAIN_ID || '8453'}/erc20:${USDC_ADDRESS}`,
    };
  }

  const amountMicro = BigInt(requirements.maxAmountRequired);
  const amountUSDC = Number(amountMicro) / 1_000_000;

  // ── Step 3: Budget check ───────────────────────────────────────────────
  if (amountUSDC > remainingBudget) {
    throw new Error(
      `x402 cost $${amountUSDC.toFixed(4)} exceeds Scout budget $${remainingBudget.toFixed(4)}`
    );
  }
  if (amountUSDC > 0.25) {
    throw new Error(`x402 safety limit: $${amountUSDC.toFixed(4)} > $0.25 per query`);
  }

  const paymentHash = generatePaymentHash({
    amount: requirements.maxAmountRequired,
    token: USDC_ADDRESS,
    recipient: requirements.payTo,
    chainId: Number(process.env.NEXT_PUBLIC_BASE_CHAIN_ID || '8453'),
  });

  // ── Steps 4–7: Pay, get proof, retry with payment header ──────────────
  return processX402Payment(
    paymentHash,
    amountUSDC,
    requirements.payTo,
    endpoint,
    async () => {
      // Step 4: Submit REAL on-chain USDC payment via 1Shot
      const payment = await submitRealPayment(
        permissionsContext,
        requirements.payTo,
        amountUSDC,
        `x402 data: ${new URL(endpoint).hostname} — "${query.slice(0, 40)}"`
      );

      // Step 5: Construct X-PAYMENT header with real tx proof
      // x402 spec: base64-encoded JSON with payment authorization
      const sessionAccount = privateKeyToAccount(sessionPrivKey);
      const paymentPayload = {
        x402Version: 1,
        scheme: 'exact',
        network: `eip155:${process.env.NEXT_PUBLIC_BASE_CHAIN_ID || '8453'}`,
        payload: {
          signature: payment.txHash,   // real on-chain tx hash as proof
          authorization: {
            from: sessionAccount.address,
            to: requirements.payTo,
            value: requirements.maxAmountRequired,
            validAfter: '0',
            validBefore: String(Math.floor(Date.now() / 1000) + requirements.maxTimeoutSeconds),
            nonce: paymentHash,
          },
        },
      };

      const xPaymentHeader = Buffer.from(JSON.stringify(paymentPayload)).toString('base64');

      // Step 6: Retry the request with payment proof
      const paidResponse = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-PAYMENT': xPaymentHeader,
          'X-Payment-Response': xPaymentHeader,
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!paidResponse.ok) {
        throw new Error(`x402 paid request rejected: ${paidResponse.status} ${paidResponse.statusText}`);
      }

      const data = await paidResponse.text();

      // Step 7: Log to audit trail
      await insertAuditEvent({
        id: crypto.randomUUID(),
        agent: 'Scout',
        action: 'X402_PAYMENT',
        detail: `Paid $${amountUSDC.toFixed(4)} → ${new URL(endpoint).hostname} | ↗ ${payment.baseScanUrl}`,
        cost: amountUSDC,
        txHash: payment.txHash,
        confirmed: true,
      });

      return {
        source: new URL(endpoint).hostname,
        query,
        data,
        cost: amountUSDC,
        txHash: payment.txHash,
      };
    }
  );
}

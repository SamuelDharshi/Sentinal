// src/lib/oneshot/relayer.ts
// 1Shot Public Relayer integration
// Permissionless JSON-RPC relayer — no API key, no pre-funding
// Gas is paid in USDC, USDT, or USDG
//
// Docs: https://1shotapi.com/docs/quickstarts/gas-sponsorship-eip7710

const RELAYER_URL = process.env.NEXT_PUBLIC_RELAYER_URL || 'https://relayer.1shotapi.com/relayers';
const BASE_CHAIN_ID = Number(process.env.NEXT_PUBLIC_BASE_CHAIN_ID || '8453');

export interface RelayerCapabilities {
  targetAddress: `0x${string}`;
  feeCollector: `0x${string}`;
  chains: Array<{
    chainId: number;
    tokens: Array<{
      address: `0x${string}`;
      symbol: string;
      decimals: number;
      minFee: string;
    }>;
  }>;
}

export interface FeeData {
  gasPrice: string;
  rate: string;
  minFee: string;
  expiry: number;
  context: string;
}

export interface TransactionResult {
  taskId: string;
  status: string;
}

let _capabilities: RelayerCapabilities | null = null;

/**
 * Step 1: Discover relayer capabilities.
 * Do NOT hardcode payment tokens — always discover from this endpoint.
 * Cache per session, refresh periodically.
 *
 * Docs: relayer_getCapabilities
 */
export async function getRelayerCapabilities(): Promise<RelayerCapabilities> {
  if (_capabilities) return _capabilities;

  const response = await fetch(RELAYER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'relayer_getCapabilities',
      params: [String(BASE_CHAIN_ID)],
    }),
  });

  if (!response.ok) {
    throw new Error(`Relayer capabilities fetch failed: ${response.status}`);
  }

  const { result, error } = await response.json();
  if (error) throw new Error(`Relayer error: ${error.message}`);

  // Relayer returns chain-keyed map: { "84532": { targetAddress, feeCollector, tokens } }
  const chainData = result?.[String(BASE_CHAIN_ID)] ?? result;
  if (!chainData?.targetAddress) {
    throw new Error(`Relayer has no capabilities for chain ${BASE_CHAIN_ID}`);
  }

  _capabilities = {
    targetAddress: chainData.targetAddress,
    feeCollector: chainData.feeCollector,
    chains: [{
      chainId: BASE_CHAIN_ID,
      tokens: (chainData.tokens || []).map((t: { address: string; symbol: string; decimals: string | number; minFee?: string }) => ({
        address: t.address as `0x${string}`,
        symbol: t.symbol,
        decimals: Number(t.decimals),
        minFee: t.minFee || '0',
      })),
    }],
  };
  return _capabilities;
}

/**
 * Step 2A: Get fee quote (before bundle is assembled).
 * Use for pre-bundle rough quotes in the UI.
 *
 * Docs: relayer_getFeeData
 */
export async function getRelayFee(
  paymentToken: `0x${string}` = (process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`)
): Promise<FeeData> {
  const response = await fetch(RELAYER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'relayer_getFeeData',
      params: {
        chainId: String(BASE_CHAIN_ID),
        token: paymentToken,
      },
    }),
  });

  const { result, error } = await response.json();
  if (error) throw new Error(`Fee data error: ${error.message}`);
  return result as FeeData;
}

/**
 * Step 3: Submit a 7710 transaction to the relayer.
 * Include destinationUrl for webhook-first status updates.
 * The relayer returns a TaskId immediately.
 *
 * Docs: relayer_send7710Transaction
 */
export async function submitAgentTransaction(params: {
  permissionsContext: string;
  encodedTransactions: string[];
  paymentToken: `0x${string}`;
  maxFeeAmount: string;
  destinationUrl?: string;
  taskId?: string;
  memo?: string;
  context?: string; // Price-locked context from estimate step
}): Promise<TransactionResult> {
  const webhookUrl = params.destinationUrl ||
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/oneshot`;

  const response = await fetch(RELAYER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'relayer_send7710Transaction',
      params: {
        chainId: String(BASE_CHAIN_ID),
        permissionsContext: params.permissionsContext,
        transactions: params.encodedTransactions,
        feeToken: params.paymentToken,
        maxFeeAmount: params.maxFeeAmount,
        destinationUrl: webhookUrl,
        taskId: params.taskId,
        memo: params.memo,
        context: params.context,
      },
    }),
  });

  const { result, error } = await response.json();
  if (error) throw new Error(`Transaction submission error: ${error.message}`);
  return result as TransactionResult;
}

/**
 * Step 4: Poll transaction status (fallback when webhooks unavailable).
 *
 * Docs: relayer_getStatus
 */
export async function getTransactionStatus(taskId: string): Promise<{
  status: string;
  transactionHash?: string;
  error?: string;
}> {
  const response = await fetch(RELAYER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'relayer_getStatus',
      params: { taskId },
    }),
  });

  const { result, error } = await response.json();
  if (error) throw new Error(`Status check error: ${error.message}`);
  return result;
}

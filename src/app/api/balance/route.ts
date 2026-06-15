// src/app/api/balance/route.ts
// Real on-chain USDC balance reader
// Called by the dashboard to show live remaining budget from Base Mainnet

import { NextRequest, NextResponse } from 'next/server';
import { getUSDCBalance, isDeleGator } from '@/lib/chain/balance';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userAddress    = searchParams.get('user')    as `0x${string}` | null;
  const sessionAddress = searchParams.get('session') as `0x${string}` | null;

  if (!userAddress) {
    return NextResponse.json({ error: 'user address required' }, { status: 400 });
  }

  try {
    const [userBalance, isSmartAccount] = await Promise.all([
      getUSDCBalance(userAddress),
      isDeleGator(userAddress),
    ]);

    let sessionBalance: number | null = null;
    if (sessionAddress) {
      sessionBalance = await getUSDCBalance(sessionAddress);
    }

    return NextResponse.json({
      userAddress,
      userBalanceUSDC:    userBalance,
      sessionAddress,
      sessionBalanceUSDC: sessionBalance,
      isSmartAccount,
      chain: Number(process.env.NEXT_PUBLIC_BASE_CHAIN_ID || '8453') === 84532 ? 'base-sepolia' : 'base',
      chainId: Number(process.env.NEXT_PUBLIC_BASE_CHAIN_ID || '8453'),
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[balance] RPC error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'RPC error' },
      { status: 500 }
    );
  }
}

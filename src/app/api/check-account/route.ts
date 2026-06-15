// src/app/api/check-account/route.ts
// Checks if an address is already a Smart Account (EIP-7702)

import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

export const dynamic = 'force-dynamic';

const publicClient = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get('address') as `0x${string}` | null;

  if (!address) {
    return NextResponse.json({ error: 'address required' }, { status: 400 });
  }

  try {
    const code = await publicClient.getCode({ address });
    const isSmartAccount = !!code && code.startsWith('0xef0100');
    return NextResponse.json({ address, isSmartAccount, code: code || '0x' });
  } catch (error) {
    console.error('[check-account] Error:', error);
    return NextResponse.json({ address, isSmartAccount: false });
  }
}

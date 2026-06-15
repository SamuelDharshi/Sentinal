import { NextRequest, NextResponse } from 'next/server';
import { publicClient } from '@/lib/chain/client';

export const dynamic = 'force-dynamic';

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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check account' },
      { status: 500 }
    );
  }
}

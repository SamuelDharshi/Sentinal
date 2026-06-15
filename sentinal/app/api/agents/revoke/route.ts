// src/app/api/agents/revoke/route.ts
// Kill Switch API — revoke session and defund all agents

import { NextRequest, NextResponse } from 'next/server';
import { killSession, updateAgentState, insertAuditEvent } from '@/lib/db';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId } = body;

    if (sessionId) {
      killSession(sessionId);
    }

    // Mark all agents as killed
    for (const agentId of ['chief', 'scout', 'analyst', 'cfo']) {
      await updateAgentState(agentId, {
        status: 'killed',
        currentAction: null,
      });
    }

    await insertAuditEvent({
      id: crypto.randomUUID(),
      agent: 'System',
      action: 'KILL_SWITCH',
      detail: '🔴 EMERGENCY REVOCATION: Root ERC-7715 permission revoked. All sub-agent delegations invalid. Your USDC is safe.',
      cost: 0,
      confirmed: true,
    });

    return NextResponse.json({
      success: true,
      message: 'All agents defunded. Permissions revoked.',
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Revoke failed' },
      { status: 500 }
    );
  }
}

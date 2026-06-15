// src/app/api/agents/start/route.ts — REAL agent workforce pipeline
// Receives: brief + permissionsContext + sessionPrivKey from setup wizard
// Executes: Chief → Scout (real HTTP + real x402) → Analyst (real Venice AI) → CFO

import { NextRequest, NextResponse } from 'next/server';
import { createSession, updateAgentState, insertAuditEvent } from '@/lib/db';
import { decomposeIntelligenceBrief } from '@/agents/chief/orchestrator';
import { createSubAgentDelegations } from '@/agents/chief/redelegate';
import { runScoutAgent } from '@/agents/scout/agent';
import { synthesizeIntelligence } from '@/agents/analyst/synthesize';
import { evaluateComputeStrategy, calculateComputeMetrics } from '@/agents/cfo/optimizeCompute';
import { ScoutTask } from '@/types';
import crypto from 'crypto';

const X402_SOURCE_ENDPOINTS: Record<string, string> = {
  serper: 'https://api.serper.dev/x402/search',
  diffbot: 'https://api.diffbot.com/x402/analyze',
  builtwith: 'https://api.builtwith.com/x402/lookup',
};

function enrichScoutTasks(tasks: ScoutTask[], sources: string[], briefText: string): ScoutTask[] {
  const enriched = tasks.map(task => {
    const endpoint = X402_SOURCE_ENDPOINTS[task.source];
    if (endpoint && sources.includes(task.source)) {
      return { ...task, endpoint };
    }
    return task;
  });

  for (const source of sources) {
    const endpoint = X402_SOURCE_ENDPOINTS[source];
    if (endpoint && !enriched.some(t => t.source === source)) {
      enriched.push({
        source,
        query: 'latest market intelligence',
        priority: 'medium',
        endpoint,
      });
    }
  }

  const freeSources = ['hackernews', 'github', 'github_trending', 'producthunt'];
  for (const source of sources) {
    const normalized = source === 'github' ? 'github_trending' : source;
    if (freeSources.includes(normalized) && !enriched.some(t => t.source === source || t.source === normalized)) {
      enriched.push({
        source: normalized,
        query: briefText.slice(0, 80) || 'technology trends',
        priority: 'high',
      });
    }
  }

  return enriched;
}

export const dynamic    = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      brief,
      competitors    = [],
      sources        = [],
      weeklyBudgetUSDC = 10,
      userAddress,
      permissionContext,   // real ERC-7715 grant result from MetaMask
      sessionPrivKey,      // real ephemeral private key (hex string)
      sessionKeyAddress,   // session key public address
    } = body;

    if (!brief || !userAddress || !sessionPrivKey || !sessionKeyAddress) {
      return NextResponse.json(
        { error: 'brief, userAddress, sessionPrivKey, and sessionKeyAddress required' },
        { status: 400 }
      );
    }

    const sessionId = crypto.randomUUID();

    createSession({
      id: sessionId, brief, competitors, sources,
      weeklyBudgetUsdc: weeklyBudgetUSDC,
      userAddress,
      permissionContext,
    });

    // Initialise agent budgets
    for (const [id, pct] of [['chief', 0], ['scout', 0.3], ['analyst', 0.6], ['cfo', 0.1]] as [string, number][]) {
      await updateAgentState(id, {
        status: id === 'chief' ? 'active' : 'idle',
        weeklyBudget:    weeklyBudgetUSDC * pct,
        remainingBudget: weeklyBudgetUSDC * pct,
      });
    }

    await insertAuditEvent({
      id: crypto.randomUUID(), agent: 'System', action: 'AGENTS_LAUNCHED',
      detail: `SENTINEL activated — $${weeklyBudgetUSDC}/wk | ${competitors.length} competitors | ${sources.length} sources`,
      cost: 0, confirmed: true,
    });

    // Fire pipeline asynchronously — client reads updates via SSE
    runPipeline({
      sessionId, brief, competitors, sources, weeklyBudgetUSDC,
      permissionContext,
      sessionPrivKey: sessionPrivKey as `0x${string}`,
      sessionKeyAddress: sessionKeyAddress as `0x${string}`,
    }).catch(err => console.error('[Pipeline] Fatal error:', err));

    return NextResponse.json({ success: true, sessionId });

  } catch (err) {
    console.error('[agents/start]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed' },
      { status: 500 }
    );
  }
}

async function runPipeline({
  sessionId, brief, competitors, sources, weeklyBudgetUSDC,
  permissionContext, sessionPrivKey, sessionKeyAddress,
}: {
  sessionId: string;
  brief: string;
  competitors: string[];
  sources: string[];
  weeklyBudgetUSDC: number;
  permissionContext: { permissionsContext?: `0x${string}` } | null;
  sessionPrivKey: `0x${string}`;
  sessionKeyAddress: `0x${string}`;
}) {
  const ctx = (permissionContext?.permissionsContext || '0x') as string;

  try {
    // ── 1. Chief: Venice AI task decomposition ─────────────────────────
    await updateAgentState('chief', { status: 'active', currentAction: 'Decomposing brief via Venice AI…' });
    const taskList = await decomposeIntelligenceBrief(brief, competitors);

    // ── 2. Chief: ERC-7710 redelegation ───────────────────────────────
    await updateAgentState('chief', { status: 'active', currentAction: 'Creating ERC-7710 sub-agent delegations…' });
    const delegations = await createSubAgentDelegations(
      { permissionsContext: ctx as `0x${string}`, permissions: [], expiry: 0 },
      weeklyBudgetUSDC,
      sessionKeyAddress
    );
    await updateAgentState('chief', { status: 'idle', currentAction: null });

    // ── 3. Scout: real HTTP + real on-chain x402 payments ─────────────
    const scoutTasks = enrichScoutTasks(taskList.scout, sources, brief);
    const scoutResults = await runScoutAgent(
      scoutTasks,
      delegations.scoutDelegation,
      sessionId,
      ctx,
      sessionPrivKey
    );

    // ── 4. Analyst: real Venice AI synthesis ──────────────────────────
    await updateAgentState('analyst', {
      status: 'active',
      currentAction: `Synthesising ${scoutResults.length} data points via Venice AI…`,
      weeklyBudget:    delegations.budgets.analyst,
      remainingBudget: delegations.budgets.analyst,
    });

    const cards = await synthesizeIntelligence(
      scoutResults, brief, taskList.analyst,
      delegations.scoutDelegation, delegations.analystDelegation
    );
    await updateAgentState('analyst', { status: 'idle', currentAction: null });

    const scoutSpend = scoutResults.reduce((s, r) => s + r.cost, 0);
    const analystSpend = cards.reduce((s, card) => {
      const scoutPart = card.delegationTrace
        .filter(d => d.agent === 'Scout')
        .reduce((x, d) => x + d.cost, 0);
      return s + (card.totalCost - scoutPart);
    }, 0);
    await evaluateComputeStrategy(calculateComputeMetrics(analystSpend, scoutSpend));

    await insertAuditEvent({
      id: crypto.randomUUID(), agent: 'System', action: 'CYCLE_COMPLETE',
      detail: `Cycle done. Total spend: $${(scoutSpend + analystSpend).toFixed(4)}`,
      cost: scoutSpend + analystSpend, confirmed: true,
    });

  } catch (err) {
    console.error('[Pipeline] Error:', err);
    await insertAuditEvent({
      id: crypto.randomUUID(), agent: 'System', action: 'CYCLE_ERROR',
      detail: err instanceof Error ? err.message : 'Unknown error',
      cost: 0, confirmed: false,
    });
    for (const id of ['chief', 'scout', 'analyst', 'cfo']) {
      await updateAgentState(id, { status: 'error', currentAction: null });
    }
  }
}

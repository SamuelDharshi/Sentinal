// src/agents/scout/agent.ts — REAL on-chain Scout Agent
// Every x402 payment is a REAL on-chain USDC transaction via 1Shot relayer
// Free sources (HackerNews, GitHub) are real HTTP calls with no mocks

import { insertAuditEvent, updateAgentState } from '@/lib/db';
import { ScoutTask, ScoutResult } from '@/types';
import { DelegationContext } from '@/agents/chief/redelegate';
import { fetchWithRealX402 } from '@/lib/x402/client';
import crypto from 'crypto';

const GITHUB_API = 'https://api.github.com/search/repositories';
const HN_API     = 'https://hn.algolia.com/api/v1/search';

/**
 * Real Scout Agent — makes live HTTP calls, pays for x402 data on-chain.
 */
export async function runScoutAgent(
  tasks: ScoutTask[],
  delegation: DelegationContext,
  sessionId: string,
  permissionsContext: string,
  sessionPrivKey: `0x${string}`
): Promise<ScoutResult[]> {

  await updateAgentState('scout', {
    status: 'active',
    currentAction: `Processing ${tasks.length} intel tasks`,
    remainingBudget: delegation.weeklyBudgetUSDC,
    weeklyBudget:    delegation.weeklyBudgetUSDC,
  });

  await insertAuditEvent({
    id:     crypto.randomUUID(),
    agent:  'Scout',
    action: 'AGENT_START',
    detail: `Scout active — ${tasks.length} tasks | Budget: $${delegation.weeklyBudgetUSDC.toFixed(2)}/wk`,
    cost: 0, confirmed: true,
  });

  const results: ScoutResult[] = [];
  let remaining = delegation.weeklyBudgetUSDC;

  // Process high-priority tasks first
  const sorted = [...tasks].sort((a, b) => {
    const p: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return p[a.priority] - p[b.priority];
  });

  for (const task of sorted) {
    if (remaining <= 0) break;

    try {
      await updateAgentState('scout', {
        currentAction: `${task.source.toUpperCase()}: "${task.query.slice(0, 50)}"`,
        remainingBudget: remaining,
      });

      let result: ScoutResult;

      switch (task.source) {
        case 'hackernews':
          result = await fetchHackerNews(task.query);
          break;

        case 'github_trending':
        case 'github':
          result = await fetchGitHub(task.query);
          break;

        case 'producthunt':
          result = await fetchProductHunt(task.query);
          break;

        default:
          // x402 paid endpoint — real on-chain payment
          if (task.endpoint && permissionsContext && sessionPrivKey) {
            result = await fetchWithRealX402(
              task.endpoint,
              task.query,
              permissionsContext,
              sessionPrivKey,
              remaining
            );
            remaining -= result.cost;
          } else {
            // No endpoint defined — fall back to HackerNews
            result = await fetchHackerNews(task.query);
          }
          break;
      }

      results.push(result);

      await insertAuditEvent({
        id:     crypto.randomUUID(),
        agent:  'Scout',
        action: 'DATA_FETCHED',
        detail: `${task.source.toUpperCase()} → "${task.query.slice(0, 60)}" | $${result.cost.toFixed(4)}`,
        cost:    result.cost,
        txHash:  result.txHash,
        confirmed: true,
      });

    } catch (err) {
      await insertAuditEvent({
        id:     crypto.randomUUID(),
        agent:  'Scout',
        action: 'TASK_ERROR',
        detail: `${task.source}: ${err instanceof Error ? err.message : 'error'}`,
        cost: 0, confirmed: false,
      });
    }
  }

  await updateAgentState('scout', { status: 'idle', currentAction: null, remainingBudget: remaining });
  await insertAuditEvent({
    id:     crypto.randomUUID(),
    agent:  'Scout',
    action: 'AGENT_DONE',
    detail: `Scout done: ${results.length} results | Remaining: $${remaining.toFixed(4)}`,
    cost: 0, confirmed: true,
  });

  return results;
}

// ── Real free data sources ───────────────────────────────────────────────────

async function fetchHackerNews(query: string): Promise<ScoutResult> {
  try {
    const url = `${HN_API}?query=${encodeURIComponent(query)}&tags=story&numericFilters=points>10&hitsPerPage=5`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`HN API ${res.status}`);
    const json = await res.json();

    const hits = (json.hits || []).map((h: {
      title: string; url: string; points: number; num_comments: number; created_at: string;
    }) => ({
      title:    h.title,
      url:      h.url,
      points:   h.points,
      comments: h.num_comments,
      time:     h.created_at,
    }));

    return { source: 'HackerNews', query, data: JSON.stringify(hits), cost: 0 };
  } catch (e) {
    console.error('[Scout] HN fetch failed:', e);
    return { source: 'HackerNews', query, data: JSON.stringify([]), cost: 0 };
  }
}

async function fetchGitHub(query: string): Promise<ScoutResult> {
  try {
    const url = `${GITHUB_API}?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=5`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
      signal: AbortSignal.timeout(8000),
    });
    const json = await res.json();
    const repos = (json.items || []).slice(0, 5).map((r: {
      full_name: string; stargazers_count: number; description: string; html_url: string; updated_at: string;
    }) => ({
      name:        r.full_name,
      stars:       r.stargazers_count,
      description: r.description,
      url:         r.html_url,
      updated:     r.updated_at,
    }));
    return { source: 'GitHub', query, data: JSON.stringify(repos), cost: 0 };
  } catch (e) {
    console.error('[Scout] GitHub fetch failed:', e);
    return { source: 'GitHub', query, data: JSON.stringify([]), cost: 0 };
  }
}

async function fetchProductHunt(query: string): Promise<ScoutResult> {
  // ProductHunt has no free public API — use their RSS feed
  try {
    const res = await fetch(
      `https://www.producthunt.com/feed?topic=${encodeURIComponent(query)}`,
      { signal: AbortSignal.timeout(8000) }
    );
    const text = await res.text();
    // Return raw RSS — Analyst agent extracts what it needs
    return { source: 'ProductHunt', query, data: text.slice(0, 3000), cost: 0 };
  } catch {
    return { source: 'ProductHunt', query, data: '', cost: 0 };
  }
}

// src/agents/analyst/synthesize.ts
// Analyst Agent — Venice AI intelligence synthesis
// Processes raw Scout data into structured IntelligenceCard objects
// Model: deepseek-r1-671b (large context, strong reasoning)
// PRIVACY: All queries to Venice AI are private — no logging, no surveillance

import { veniceClient, VENICE_MODELS } from '@/lib/venice/client';
import { insertAuditEvent, insertCard } from '@/lib/db';
import { IntelligenceCard, ScoutResult, DelegationStep, Source } from '@/types';
import { DelegationContext } from '@/agents/chief/redelegate';
import crypto from 'crypto';

const ANALYST_SYSTEM_PROMPT = `You are a private intelligence analyst at SENTINEL.

Your role: synthesize raw data from a scout agent into actionable strategic intelligence.
All your analysis is private — it runs on Venice AI, which has zero data logging.

Given raw scout data and the user's business brief, extract the most important insight and return it as JSON:

{
  "headline": "One punchy sentence describing the key finding (max 80 chars)",
  "summary": "2-3 sentence strategic analysis. Be concrete, specific, and actionable.",
  "urgency": "high|medium|low",
  "actionSuggested": "One specific action the user should take based on this intelligence",
  "sourceCount": <number of sources analyzed>
}

Urgency guide:
- HIGH: Competitor launched product, funding announced, direct market threat
- MEDIUM: Trending topic in user's niche, new regulatory development, emerging opportunity
- LOW: Background market noise, minor competitor update, general industry trend

Be precise. Generic insights are useless. The user is paying per query — make it worth it.`;

/**
 * Analyst Agent: Synthesizes raw Scout data into an IntelligenceCard.
 * Runs on Venice AI (deepseek-r1-671b) — private inference, no data retention.
 *
 * @param scoutResults - Raw data collected by the Scout Agent
 * @param userBrief - The user's intelligence brief (for relevance filtering)
 * @param analystQuestions - Specific synthesis questions from the Chief
 * @param scoutDelegation - Scout's delegation context (for trace chip)
 * @param analystDelegation - Analyst's delegation context
 */
export async function synthesizeIntelligence(
  scoutResults: ScoutResult[],
  userBrief: string,
  analystQuestions: string[],
  scoutDelegation: DelegationContext,
  analystDelegation: DelegationContext
): Promise<IntelligenceCard[]> {
  const cards: IntelligenceCard[] = [];

  // Process in batches of 3 Scout results per synthesis call
  const batchSize = 3;
  for (let i = 0; i < scoutResults.length; i += batchSize) {
    const batch = scoutResults.slice(i, i + batchSize);
    if (batch.length === 0) continue;

    try {
      const card = await synthesizeBatch(
        batch,
        userBrief,
        analystQuestions,
        scoutDelegation,
        analystDelegation
      );
      if (card) {
        cards.push(card);
        // Persist to DB
        insertCard({
          id: card.id,
          headline: card.headline,
          summary: card.summary,
          urgency: card.urgency,
          actionSuggested: card.actionSuggested,
          sources: card.sources,
          delegationTrace: card.delegationTrace,
          totalCost: card.totalCost,
          brief: userBrief,
        });
      }
    } catch (error) {
      console.error('[Analyst] Synthesis batch failed:', error);
    }
  }

  return cards;
}

async function synthesizeBatch(
  batch: ScoutResult[],
  userBrief: string,
  analystQuestions: string[],
  scoutDelegation: DelegationContext,
  analystDelegation: DelegationContext
): Promise<IntelligenceCard | null> {
  const analystCost = 0.004; // ~$0.004 per synthesis call on deepseek-v4-pro

  await insertAuditEvent({
    id: crypto.randomUUID(),
    agent: 'Analyst',
    action: 'SYNTHESIZE_START',
    detail: `Venice AI synthesis: ${batch.length} data points | deepseek-v4-pro | Private inference`,
    cost: analystCost,
    confirmed: false,
  });

  const userMessage = `
Intelligence Brief:
${userBrief}

Key Questions to Answer:
${analystQuestions.slice(0, 3).map((q, i) => `${i + 1}. ${q}`).join('\n')}

Raw Scout Data (${batch.length} sources):
${batch.map((r, i) => `
SOURCE ${i + 1} (${r.source}):
Query: ${r.query}
Data: ${r.data.slice(0, 2000)}
`).join('\n---\n')}

Synthesize the most important strategic insight from this data.
`;

  let synthesized: {
    headline: string;
    summary: string;
    urgency: 'low' | 'medium' | 'high';
    actionSuggested: string;
    sourceCount: number;
  };

  try {
    const response = await veniceClient.chat.completions.create({
      model: VENICE_MODELS.ANALYST,
      messages: [
        { role: 'system', content: ANALYST_SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 800,
      temperature: 0.4,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Empty Venice AI response');

    synthesized = JSON.parse(content);
  } catch (error) {
    console.error('[Analyst] Venice AI synthesis failed:', error);
    throw error;
  }

  const scoutCost = batch.reduce((sum, r) => sum + r.cost, 0);
  const totalCost = scoutCost + analystCost;

  const basescan = process.env.NEXT_PUBLIC_BASESCAN_URL || 'https://sepolia.basescan.org/tx';

  const delegationTrace: DelegationStep[] = [
    {
      agent: 'Chief',
      action: 'ERC-7710 Delegated',
      cost: 0,
      confirmed: true,
    },
    ...batch.map((r) => ({
      agent: 'Scout' as const,
      action: `${r.source}${r.txHash ? ' x402' : ' free'}`,
      cost: r.cost,
      txHash: r.txHash,
      confirmed: true,
    })),
    {
      agent: 'Analyst',
      action: 'Venice AI synthesis',
      cost: analystCost,
      confirmed: true,
    },
  ];

  const sources: Source[] = batch.map((r) => {
    let url = '';
    try {
      const parsed = JSON.parse(r.data);
      if (Array.isArray(parsed) && parsed[0]?.url) url = parsed[0].url;
      else if (parsed.items?.[0]?.html_url) url = parsed.items[0].html_url;
    } catch {
      // raw RSS or text — no URL available
    }
    if (!url && r.txHash) url = `${basescan}/${r.txHash}`;
    return {
      title: `${r.source}: ${r.query.slice(0, 50)}`,
      url: url || '#',
      type: r.cost > 0 ? 'x402' : 'free',
      cost: r.cost,
    };
  });

  await insertAuditEvent({
    id: crypto.randomUUID(),
    agent: 'Analyst',
    action: 'CARD_GENERATED',
    detail: `[${synthesized.urgency.toUpperCase()}] ${synthesized.headline}`,
    cost: analystCost,
    confirmed: true,
  });

  return {
    id: crypto.randomUUID(),
    headline: synthesized.headline,
    summary: synthesized.summary,
    urgency: synthesized.urgency,
    actionSuggested: synthesized.actionSuggested,
    sourceCount: batch.length,
    sources,
    delegationTrace,
    totalCost,
    createdAt: new Date().toISOString(),
    brief: userBrief,
  };
}

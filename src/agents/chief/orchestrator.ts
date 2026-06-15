// src/agents/chief/orchestrator.ts
// Chief Orchestrator Agent — powered by Venice AI (privacy-first)
// Decomposes the user's plain-English brief into discrete tasks for sub-agents
// Model: venice-uncensored-1.2 (no content filters, handles competitive intel)

import { veniceClient, VENICE_MODELS } from '@/lib/venice/client';
import { insertAuditEvent } from '@/lib/db';
import { TaskList, ScoutTask, ComputeThresholds } from '@/types';
import crypto from 'crypto';

const SYSTEM_PROMPT = `You are the Chief Intelligence Officer for SENTINEL, an autonomous intelligence engine.

Given a user's intelligence brief and competitor list, decompose it into discrete, actionable tasks for three sub-agents:

1. SCOUT AGENT: finds and purchases raw data from web sources
2. ANALYST AGENT: synthesizes data into strategic intelligence cards
3. CFO AGENT: monitors compute costs and optimizes when thresholds are crossed

Return ONLY valid JSON in this exact schema:
{
  "scout": [
    { "source": "hackernews", "query": "search query", "priority": "high|medium|low", "endpoint": "optional x402 endpoint" }
  ],
  "analyst": [
    "synthesis question 1",
    "synthesis question 2"
  ],
  "thresholds": {
    "maxCostPerQuery": 0.05,
    "alertOnHighUrgency": true,
    "evaluateDIEMWeekly": true
  }
}

Available scout sources: hackernews, github_trending, producthunt, serper_search (x402 ~$0.001/query)

Be specific. If the user mentions competitors, create queries to track each competitor's:
- New product launches
- GitHub activity (if open source)
- Community sentiment (HackerNews, Reddit mentions)
- Funding/partnership announcements`;

/**
 * Chief Orchestrator: Decomposes an intelligence brief into sub-agent tasks.
 * All inference runs on Venice AI — private, uncensored, no surveillance.
 *
 * @param brief - User's plain-English intelligence brief
 * @param competitors - Array of competitor names
 * @returns Structured task list for Scout, Analyst, and CFO agents
 */
export async function decomposeIntelligenceBrief(
  brief: string,
  competitors: string[]
): Promise<TaskList> {
  const auditId = crypto.randomUUID();

  // Log start to audit trail
  await insertAuditEvent({
    id: crypto.randomUUID(),
    agent: 'Chief',
    action: 'DECOMPOSE_BRIEF',
    detail: `Analyzing brief via Venice AI (${VENICE_MODELS.ORCHESTRATOR}) — private inference`,
    cost: 0.001,
    confirmed: false,
  });

  const userMessage = `
Intelligence Brief:
${brief}

Competitors to track:
${competitors.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Create a comprehensive task list. Be specific about queries and prioritize tracking competitors.
`;

  let taskList: TaskList;

  try {
    const response = await veniceClient.chat.completions.create({
      model: VENICE_MODELS.ORCHESTRATOR,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 2000,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Venice AI returned empty response');

    taskList = JSON.parse(content) as TaskList;

    // Validate structure
    if (!taskList.scout || !taskList.analyst) {
      throw new Error('Invalid task list structure from Venice AI');
    }

  } catch (error) {
    console.error('[Chief] Venice AI task decomposition failed, using fallback:', error);

    // Fallback: generate tasks from brief directly
    taskList = generateFallbackTaskList(brief, competitors);
  }

  // Log completion to audit trail
  await insertAuditEvent({
    id: auditId,
    agent: 'Chief',
    action: 'TASKS_READY',
    detail: `Decomposed into ${taskList.scout.length} scout tasks, ${taskList.analyst.length} analyst questions`,
    cost: 0.001,
    confirmed: true,
  });

  return taskList;
}

/**
 * Fallback task list if Venice AI is unavailable.
 * Generates sensible defaults from the brief text.
 */
function generateFallbackTaskList(brief: string, competitors: string[]): TaskList {
  const scoutTasks: ScoutTask[] = [
    { source: 'hackernews', query: brief.slice(0, 100), priority: 'high' },
    { source: 'github_trending', query: 'developer tools AI', priority: 'medium' },
    { source: 'producthunt', query: 'developer productivity', priority: 'medium' },
  ];

  // Add competitor-specific tasks
  competitors.forEach((competitor) => {
    scoutTasks.push({
      source: 'hackernews',
      query: competitor,
      priority: 'high',
    });
  });

  const analystQuestions: string[] = [
    `What are the most significant recent developments relevant to: ${brief.slice(0, 200)}?`,
    `What competitive threats are emerging from: ${competitors.join(', ')}?`,
    `What opportunities exist based on current market trends?`,
  ];

  const thresholds: ComputeThresholds = {
    maxCostPerQuery: 0.05,
    alertOnHighUrgency: true,
    evaluateDIEMWeekly: true,
  };

  return { scout: scoutTasks, analyst: analystQuestions, thresholds };
}

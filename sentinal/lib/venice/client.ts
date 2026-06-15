// src/lib/venice/client.ts
// Venice AI — OpenAI-compatible client
// Privacy-first: queries are NOT logged by Venice. Zero surveillance.
// Drop-in replacement for OpenAI — just change baseURL and apiKey.

import OpenAI from 'openai';

// Venice is 100% OpenAI-API-compatible
export const veniceClient = new OpenAI({
  baseURL: 'https://api.venice.ai/api/v1',
  apiKey: process.env.VENICE_API_KEY || '',
  dangerouslyAllowBrowser: false, // Server-side only
});

// Model selection guide (from DX feedback in README):
// - venice-uncensored-1.2: Best for task decomposition, JSON outputs, no content filters
// - deepseek-r1-671b: Large context window, strong reasoning, ideal for synthesis
// - llama-3.3-70b: Faster, good for simple queries
export const VENICE_MODELS = {
  ORCHESTRATOR: 'venice-uncensored-1.2',    // Chief Agent: task decomposition
  ANALYST: 'deepseek-r1-671b',              // Analyst Agent: intelligence synthesis
  FAST: 'llama-3.3-70b',                   // Quick evaluations
} as const;

export type VeniceModel = typeof VENICE_MODELS[keyof typeof VENICE_MODELS];

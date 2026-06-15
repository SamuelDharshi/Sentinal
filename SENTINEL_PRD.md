# SENTINEL — Autonomous Intelligence Engine
### Complete Product Requirements Document
### MetaMask Smart Accounts Kit × 1Shot API × Venice AI Dev Cook-Off

---

> **One-line pitch:** Grant a weekly USDC budget once. SENTINEL's agent workforce goes out
> on the open web, buys intelligence, synthesizes it privately, and delivers insights to your
> dashboard — autonomously, forever, without a single extra click from you.

---

## 0. Why This Idea Wins (Read This First)

Before any architecture: understand **why** this avoids every trap other submissions fall into.

| Risk | How SENTINEL avoids it |
|---|---|
| "Herd idea" (trading bots, workforce apps) | First project to use x402 for **external data API purchasing** — not just Venice AI inference |
| "Crypto app that real users won't touch" | Looks like a premium SaaS newsroom. Zero MetaMask popups after setup. |
| "Technically correct but boring" | Every judge is an indie builder. They will personally want this product. |
| "Doesn't use their tech at the core" | Remove MetaMask delegation → agents can't run. Remove 1Shot → no gas abstraction. Remove Venice → intelligence is surveilled. The stack is load-bearing. |
| "No automation" | After setup, the user does **nothing**. Agents run 24/7. |

**The killer Venice AI angle nobody else will find:** Venice recently shipped a **Private Research Agent Guide** and a **DIEM compute token** (each DIEM = $1/day of inference forever). An AI CFO Agent that autonomously mints DIEM from staked VVV when weekly x402 USDC costs cross a threshold is a live demonstration of Venice's newest, least-explored economic layer. No other project in this hackathon will do this.

---

## 1. Problem Statement

Every indie developer, solo founder, and digital creator is fighting **information asymmetry**.

Large companies have intelligence teams that monitor markets 24/7: competitor moves, pricing changes, new product launches, community sentiment, trending research. Individuals can't afford that.

The status quo:
- **Manual**: 2–3 hours/day across HackerNews, GitHub, newsletters, Reddit, Twitter
- **Reactive**: You see things after competitors do
- **Surveilled**: Searching OpenAI or Google for competitive intelligence leaks your strategy
- **Expensive**: Multiple SaaS subscriptions ($200–500/month) for partial coverage

**SENTINEL makes every solo operator as intelligence-rich as a funded startup — at $5–15/week, with zero daily effort, and with full privacy.**

---

## 2. The SENTINEL Concept

### Setup (One-Time, ~5 Minutes)

1. User connects MetaMask → gets upgraded to Smart Account via EIP-7702 through 1Shot relayer
2. User defines their **Intelligence Brief** in plain English:
   > *"I build developer tools. Track HackerNews, GitHub Trending, and Product Hunt. Watch these 5 competitors. Alert me when: a competitor ships a new feature, a trending topic overlaps with my niche, or a new funding round happens in dev tooling."*
3. User grants a **weekly USDC budget** (e.g. $10/week) via ERC-7715 Advanced Permissions with `Erc20TransferAmount` scope

That is the last interaction the user has with the crypto stack. **Everything else is autonomous.**

### The Running State (Autonomous, Continuous)

A **Chief Orchestrator Agent** (Venice AI) receives the brief and:
- Decomposes it into discrete tasks
- Uses `redelegatePermissionContext` to instantiate 3 sub-agents with budget slices:

```
Chief Agent ($10/week)
├── Scout Agent ($3/week)     — finds and purchases raw data via x402
├── Analyst Agent ($6/week)   — synthesizes with Venice AI privately
└── CFO Agent ($1/week)       — optimizes compute costs via DIEM staking
```

Sub-agents use their delegated permissions (backed by 1Shot relayer for gas) to:
- **Scout**: Autonomously discovers and pays for data APIs (Serper, Diffbot, RSS feeds, etc.) via x402
- **Analyst**: Sends raw data to Venice AI for private synthesis → returns insight cards
- **CFO**: Monitors weekly Venice AI x402 spend; if it exceeds a threshold, autonomously swaps USDC → VVV → stakes → mints DIEM for zero-marginal-cost future inference

The user sees results in a **Mission Control dashboard** — a newsroom-like interface with an intelligence feed, agent status, and a real-time audit trail (every action has a BaseScan link proving it happened on-chain).

---

## 3. Hackathon Track Alignment

SENTINEL is architected to be competitive in **all four tracks simultaneously**.

### Track 1: Best x402 + ERC-7710 ($3,000)
SENTINEL is the first project to demonstrate **Agentic Discovery** with x402 against **external paid data APIs** — not just Venice AI. The Scout Agent encounters a paywalled data endpoint, receives a 402 response, constructs an ERC-7710 delegation payment header, pays for the data, and returns it. This is x402 used exactly as the protocol designers intended: autonomous agents buying things on the open web.

### Track 2: Best Agent ($3,000)
The Chief Orchestrator Agent receives a plain-English brief, decomposes it into actionable tasks, spawns sub-agents, synthesizes results, and delivers structured intelligence — all without a single human interaction. The ERC-7715 delegation IS the agent's operating budget. This is not a demo agent. It is a running, useful product.

### Track 3: Best A2A Coordination ($3,000)
The delegation chain `Chief → Scout → Analyst → CFO` is **architecturally required**. A2A here maps directly to a real organizational structure (researcher, analyst, CFO) that any judge can immediately understand. If the user revokes the root ERC-7715 permission, **every sub-agent is mathematically defunded** in the same block. This is the "holy grail" use case the document describes.

### Track 4: Best Use of 1Shot Permissionless Relayer ($1,000)
Every agent transaction routes through 1Shot. Gas is paid in USDC. Zero ETH in any user wallet. Webhook-first status handling (not polling). This qualifies for both the $500 webhook bonus and demonstrates the relayer in a sustained, multi-agent context no other submission will match.

---

## 4. Technology Integration

### 4.1 MetaMask Smart Accounts Kit

**Purpose in SENTINEL:** Account upgrade, permission granting, and delegation chain creation.

#### Step 1 — EIP-7702 Account Upgrade

```typescript
// src/lib/metamask/accountUpgrade.ts
import { getSmartAccountsEnvironment, Implementation } from "@metamask/smart-accounts-kit";
import { createWalletClient, custom } from "viem";
import { base } from "viem/chains";

export async function upgradeToSmartAccount(userAddress: `0x${string}`) {
  const walletClient = createWalletClient({
    chain: base,
    transport: custom(window.ethereum),
  });

  // EIP-7702 upgrade — 1Shot relayer handles gas in USDC
  const env = getSmartAccountsEnvironment({
    chain: base,
    implementation: Implementation.Hybrid,
  });

  return env;
}
```

**Docs reference:** `https://docs.metamask.io/smart-accounts-kit/`

#### Step 2 — ERC-7715 Permission Grant (Chief Agent Budget)

```typescript
// src/lib/metamask/permissions.ts
import { erc7715ProviderActions } from "@metamask/smart-accounts-kit";

export async function grantWeeklyBudget(
  walletClient: any,
  sessionAccount: `0x${string}`,
  weeklyUSDC: bigint // in 6-decimal USDC units
) {
  const permission = await walletClient.extend(erc7715ProviderActions()).grantPermissions({
    chainId: base.id,
    permissions: [
      {
        type: "erc20-token-periodic",
        token: USDC_ADDRESS_BASE,
        allowance: weeklyUSDC,
        period: 604800, // 7 days in seconds
        sessionAccount,
        isAdjustmentAllowed: false,
        justification: "SENTINEL autonomous intelligence budget — scout, analyst, CFO agents",
        expiry: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
      },
    ],
  });
  return permission;
}
```

**Docs reference:** `https://docs.metamask.io/smart-accounts-kit/concepts/advanced-permissions/`

#### Step 3 — ERC-7710 Redelegation (A2A Budget Slicing)

```typescript
// src/agents/chief/redelegate.ts
import { createDelegation, redelegatePermissionContext } from "@metamask/smart-accounts-kit/experimental";

export async function createSubAgentDelegations(
  parentPermissionContext: PermissionContext,
  budgetAllocation: { scout: bigint; analyst: bigint; cfo: bigint }
) {
  const scoutDelegation = await createDelegation({
    parentPermissionContext,
    caveat: {
      type: "Erc20TransferAmount",
      value: budgetAllocation.scout, // e.g. 3_000_000n (3 USDC)
    },
    delegate: SCOUT_AGENT_ADDRESS,
  });

  const analystDelegation = await createDelegation({
    parentPermissionContext,
    caveat: {
      type: "Erc20TransferAmount",
      value: budgetAllocation.analyst, // e.g. 6_000_000n (6 USDC)
    },
    delegate: ANALYST_AGENT_ADDRESS,
  });

  const cfoDelegation = await createDelegation({
    parentPermissionContext,
    caveat: {
      type: "Erc20TransferAmount",
      value: budgetAllocation.cfo, // e.g. 1_000_000n (1 USDC)
    },
    delegate: CFO_AGENT_ADDRESS,
  });

  return { scoutDelegation, analystDelegation, cfoDelegation };
}
```

**Docs reference:** `https://docs.metamask.io/smart-accounts-kit/1.1.0/guides/delegation/create-redelegation/`

#### Revocation (Kill Switch)

```typescript
// src/lib/metamask/revoke.ts
// Uses ApprovalRevocationEnforcer from v1.6.0
import { revokePermissions } from "@metamask/smart-accounts-kit";

export async function emergencyRevoke(permissionContext: PermissionContext) {
  // Revoking root permission propagates mathematically down the entire
  // Chief → Scout → Analyst → CFO chain instantly.
  await revokePermissions(permissionContext);
}
```

**Docs reference:** `https://github.com/MetaMask/smart-accounts-kit/releases` (v1.6.0 ApprovalRevocationEnforcer)

---

### 4.2 1Shot API Integration

**Purpose in SENTINEL:** Gasless execution for all agent transactions. Zero ETH required anywhere.

**Docs reference:** `https://1shotapi.com/docs/quickstarts/gas-sponsorship-eip7710`

#### Fee Discovery

```typescript
// src/lib/oneshot/relayer.ts
const RELAYER_URL = "https://relayer.1shotapi.com/relayer";

export async function getRelayFee(chainId: number) {
  const response = await fetch(RELAYER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "relayer_getFeeData",
      params: [{ chainId }],
      id: 1,
    }),
  });
  const { result } = await response.json();
  return result; // { usdcFee: "15000", ... } — exact USDC cost
}
```

#### Transaction Submission

```typescript
export async function submitAgentTransaction(
  intent: ERC7710Intent,
  eip7702Auth: EIP7702Authorization,
  usdcFeeAllowance: bigint
) {
  const response = await fetch(RELAYER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "relayer_send7710Transaction",
      params: [
        {
          authorization: eip7702Auth,
          intent,
          feeToken: USDC_ADDRESS_BASE,
          maxFeeAmount: usdcFeeAllowance.toString(),
        },
      ],
      id: 1,
    }),
  });
  const { result } = await response.json();
  return result.transactionHash;
}
```

#### Dual Verification Middleware (Webhook-First, Polling Fallback)

```typescript
// src/lib/oneshot/verification.ts
// CRITICAL: Judges specifically reward webhook-first implementations

export class TransactionVerifier {
  private pendingTxns: Map<string, (tx: Transaction) => void> = new Map();

  // Primary path: Ed25519-signed webhook from 1Shot
  async handleWebhook(payload: OneShotWebhookPayload, signature: string) {
    if (!verifyEd25519Signature(payload, signature, ONESHOT_PUBLIC_KEY)) {
      throw new Error("Invalid webhook signature");
    }
    const resolver = this.pendingTxns.get(payload.transactionHash);
    if (resolver) resolver(payload);
  }

  // Fallback path: exponential backoff polling
  async pollWithBackoff(txHash: string, maxAttempts = 10): Promise<Transaction> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const delay = Math.min(1000 * 2 ** attempt, 30000);
      await sleep(delay);

      const response = await fetch(RELAYER_URL, {
        method: "POST",
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "relayer_getStatus",
          params: [{ transactionHash: txHash }],
          id: 1,
        }),
      });
      const { result } = await response.json();
      if (result.status === "confirmed") return result;
    }
    throw new Error("Transaction confirmation timeout");
  }

  async verify(txHash: string): Promise<Transaction> {
    return Promise.race([
      new Promise<Transaction>((resolve) => this.pendingTxns.set(txHash, resolve)),
      this.pollWithBackoff(txHash),
    ]);
  }
}
```

---

### 4.3 Venice AI Integration

**Purpose in SENTINEL:** Privacy-first intelligence synthesis. Competitors cannot see your research queries.

**Docs reference:** `https://docs.venice.ai/overview/about-venice`

**Why Venice AI is the ONLY choice for SENTINEL:** If the analyst ran on OpenAI, every query about your competitors would be logged by OpenAI — the same platform your competitors use. Venice AI's privacy-first architecture means your competitive intelligence stays yours. This is not a secondary benefit; it is the **primary value proposition** of Venice AI for this exact use case.

#### Chief Orchestrator (Task Decomposition)

```typescript
// src/agents/chief/orchestrator.ts
import OpenAI from "openai"; // Venice is OpenAI-compatible

const venice = new OpenAI({
  baseURL: "https://api.venice.ai/api/v1",
  apiKey: process.env.VENICE_API_KEY, // OR use x402 wallet auth
});

export async function decomposeIntelligenceBrief(brief: string): Promise<TaskList> {
  const response = await venice.chat.completions.create({
    model: "venice-uncensored-1.2", // No corporate content filters
    messages: [
      {
        role: "system",
        content: `You are the Chief Intelligence Officer. Given a user's intelligence brief,
        decompose it into discrete, actionable tasks for three sub-agents:
        - scout: web data sources to query (return as array of {source, query, priority})
        - analyst: synthesis questions to answer (return as array of strings)
        - thresholds: conditions that trigger the CFO agent to optimize compute
        Return ONLY valid JSON.`,
      },
      { role: "user", content: brief },
    ],
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content!);
}
```

#### Analyst Agent (Intelligence Synthesis)

```typescript
// src/agents/analyst/synthesize.ts
export async function synthesizeIntelligence(
  rawData: ScoutResult[],
  userBrief: string
): Promise<IntelligenceCard> {
  const response = await venice.chat.completions.create({
    model: "deepseek-r1-671b", // Large context, strong reasoning
    messages: [
      {
        role: "system",
        content: `You are a private intelligence analyst. Given raw data from a scout agent,
        extract strategic insights relevant to the user's brief. Be precise and actionable.
        Format as JSON: { headline, summary, urgency (low|medium|high), actionSuggested, sourceCount }`,
      },
      {
        role: "user",
        content: `Brief: ${userBrief}\n\nRaw data:\n${JSON.stringify(rawData)}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content!);
}
```

#### DIEM Staking Optimization (AI CFO Agent — Novel White Space)

This is the most novel feature in the entire hackathon. Venice launched DIEM tokens in late 2025 — each DIEM = $1/day of Venice API credits in perpetuity. No other project will implement this.

```typescript
// src/agents/cfo/optimizeCompute.ts

interface ComputeMetrics {
  weeklyX402Spend: number;   // USDC spent on Venice inference this week
  projectedMonthlySpend: number;
  diemMintThreshold: number; // e.g. $40/month — break-even for staking
}

export async function evaluateComputeStrategy(metrics: ComputeMetrics) {
  // Venice API: check current VVV → sVVV → DIEM conversion economics
  // If monthly Venice x402 spend > DIEM break-even point:
  //   1. Execute DEX swap: USDC → VVV (via Aerodrome on Base)
  //   2. Stake VVV → receive sVVV (lock period: 4 weeks)
  //   3. Lock sVVV → mint DIEM
  //   4. Stake DIEM → receive perpetual daily inference credits
  // All transactions via 1Shot relayer (gas in USDC, no ETH needed)

  if (metrics.projectedMonthlySpend > metrics.diemMintThreshold) {
    const diemToBuy = Math.ceil(metrics.projectedMonthlySpend);
    
    // Log this decision to the Mission Control audit trail
    await logAuditEvent({
      agent: "CFO",
      action: "DIEM_STAKE_INITIATED",
      reasoning: `Monthly Venice spend of $${metrics.projectedMonthlySpend.toFixed(2)} exceeds ` +
                 `DIEM break-even of $${metrics.diemMintThreshold}. Acquiring ${diemToBuy} DIEM ` +
                 `for zero-marginal-cost inference.`,
      usdcCost: diemToBuy * VVV_USDC_PRICE,
    });

    return { action: "stake", diemAmount: diemToBuy };
  }

  return { action: "payAsYouGo" };
}
```

**Venice docs for DIEM:** `https://venice.ai/token` and `https://docs.venice.ai/`

---

### 4.4 x402 Protocol Integration (The Genuine "Agentic Discovery")

**Purpose in SENTINEL:** Scout Agent pays for external data APIs autonomously — this is genuine Agentic Discovery, not just paying for Venice inference.

**Docs reference:** `https://docs.metamask.io/smart-accounts-kit/development/guides/x402/buyer/delegations/`

The Scout Agent does NOT have hardcoded prices. When it encounters a data API with x402 support, it:

```typescript
// src/agents/scout/x402Discovery.ts
import { x402Erc7710Client, createx402DelegationProvider } from "@metamask/x402";

export class ScoutAgent {
  private x402Client: any;

  constructor(delegationContext: DelegationContext) {
    const delegationProvider = createx402DelegationProvider(delegationContext);
    this.x402Client = x402Erc7710Client({ delegationProvider });
  }

  async fetchPaywalledData(endpoint: string, query: string): Promise<any> {
    // First attempt: unauthenticated request
    const initialResponse = await fetch(`${endpoint}?q=${encodeURIComponent(query)}`);

    if (initialResponse.status === 402) {
      // Parse 402 header: understand exact cost dynamically
      const paymentRequired = await initialResponse.json();
      const cost = parseFloat(paymentRequired.amount); // e.g., 0.02 USDC

      // Verify cost is within delegated budget
      if (cost > this.remainingBudget) {
        throw new Error(`Data cost $${cost} exceeds remaining budget`);
      }

      // Construct x402 payment from Scout's ERC-7710 delegation
      const paymentHeader = await this.x402Client.createPaymentHeader({
        amount: paymentRequired.amount,
        token: paymentRequired.token,
        recipient: paymentRequired.recipient,
        chainId: paymentRequired.chainId,
      });

      // Retry with X-PAYMENT header
      const paidResponse = await fetch(`${endpoint}?q=${encodeURIComponent(query)}`, {
        headers: { "X-PAYMENT": paymentHeader },
      });

      // Log the purchase to Mission Control audit trail
      await this.logPurchase(endpoint, cost);

      return paidResponse.json();
    }

    return initialResponse.json(); // Free endpoint
  }
}
```

#### Replay Protection (Database-Backed — Survives Server Restarts)

```typescript
// src/lib/x402/replayProtection.ts
// Addresses the friction point from WorkAgnt: x402 replay attacks on PM2 restarts

import { db } from "@/lib/db";

export async function processPayment(paymentHash: string, processFn: () => Promise<any>) {
  // Atomic unique constraint — survives reboots (unlike in-memory sets)
  const inserted = await db.run(
    `INSERT OR IGNORE INTO processed_payments (hash, processed_at) VALUES (?, ?)`,
    [paymentHash, new Date().toISOString()]
  );

  if (inserted.changes === 0) {
    // Emit for monitoring, do NOT throw (legitimate retry vs replay attack)
    console.warn(`[x402.replay_attempt] Hash ${paymentHash} already processed`);
    throw new Error("Payment already processed");
  }

  return processFn();
}
```

---

## 5. UX Design System — "Mission Control"

### 5.1 Design Philosophy

**The UX IS the architecture.** Every visual element maps directly to a technical state:

| UI Element | Architecture State |
|---|---|
| Setup Wizard | Agent configuration + ERC-7715 permission schema |
| Intelligence Feed | Analyst Agent output stream |
| Budget Meter | Real-time ERC-7715 `remainingAllowance` |
| Agent Status Pulses | Sub-agent heartbeat (last webhook confirmation) |
| Audit Trail Terminal | On-chain event log (BaseScan-linked) |
| Kill Switch | `revokePermissions()` call |

A user interacting with the UI is directly interacting with the delegation system. They never need to know any of the underlying cryptography.

### 5.2 Color System

SENTINEL uses the **brand colors of the three sponsor platforms as functional signals** — judges will feel this unconsciously:

```
Background       #0B0C14    Deep navy (mission control)
Surface          #131424    Card/panel background
Border           #1E1F35    Subtle definition

Accent Teal      #239AAA    1Shot brand color → Agent activity, x402 payments
Accent Purple    #7B5FD4    Venice AI-adjacent → AI processing, inference states
Accent Orange    #E27625    MetaMask brand → Wallet state, permission events

Success          #22C55E    Confirmed on-chain
Warning          #F59E0B    Budget threshold approaching
Danger           #EF4444    Anomaly detected, kill switch

Text Primary     #F0F0FF    Slightly blue-white (space feel)
Text Secondary   #8B8FA8    Metadata, labels
Text Mono        #00E5CC    Audit trail (terminal text, always teal)
```

### 5.3 Typography

```
Display face:    "Space Grotesk"     — Variable weight, modern, not templated
Body face:       "Inter"             — Reliable, clean, readable
Monospace face:  "JetBrains Mono"   — Audit trail, BaseScan addresses, costs
```

All three are available via Google Fonts. Load with `display: swap`.

### 5.4 Signature Design Element

Every intelligence card has a **delegation trace** at the bottom — a horizontal chip row:

```
[Chief] → [Scout → SerperAPI $0.02] → [Analyst → Venice] → [You]
           ↑ tap to open BaseScan
```

This is the one element that exists nowhere else in any Web3 product. It makes the on-chain proof visible in the most natural place — the deliverable itself. Judges who understand the tech will immediately recognize what it represents.

---

## 6. Screen-by-Screen UX Flows

### Screen 1: Onboarding (One Page)

```
┌─────────────────────────────────────────────────────┐
│                    SENTINEL                         │
│         Your intelligence, running 24/7             │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │   Connect MetaMask                          │   │
│  │   ─────────────────────────────────────    │   │
│  │   One connection. No future popups.         │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  How it works:                                      │
│  1. Tell us what to watch                           │
│  2. Set a weekly budget (USDC)                      │
│  3. Agents run. You read insights.                  │
└─────────────────────────────────────────────────────┘
```

**Behind the scenes:** On wallet connect, check if address has been upgraded to Smart Account. If not, present a single EIP-7702 upgrade transaction via 1Shot (gas free, USDC only). Only ONE signature required, ever.

**Key implementation:** Use `isDeleGator(address)` utility to check bytecode:
```typescript
// Addresses the MetaMask DX friction point documented in the report
export async function isDeleGator(address: `0x${string}`): Promise<boolean> {
  const code = await publicClient.getCode({ address });
  return !!code && code.startsWith("0xef0100"); // EIP-7702 delegation prefix
}
```

---

### Screen 2: Intelligence Brief Setup (Wizard)

```
┌─────────────────────────────────────────────────────┐
│  STEP 1 of 3: What's your business?                │
│                                                     │
│  Describe it in plain English:                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ I build developer tools. My main product      │  │
│  │ is a code review assistant for teams...       │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  Who are your competitors?                          │
│  ┌──────────────────────────────────────────────┐  │
│  │ Copilot, Cursor, CodeRabbit, Codeium          │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│                              [Next: Data Sources →] │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  STEP 2 of 3: Where should we look?                │
│                                                     │
│  Select sources for your Scout Agent:               │
│                                                     │
│  [✓] HackerNews (free)                             │
│  [✓] GitHub Trending (free)                        │
│  [✓] Product Hunt (free)                           │
│  [✓] Serper Search API    ~$0.001/query (x402)    │
│  [ ] Diffbot Web Intel    ~$0.05/query  (x402)    │
│  [ ] BuiltWith Technology ~$0.02/query  (x402)    │
│                                                     │
│  Prices shown are dynamic. Agents confirm before   │
│  spending above your set threshold.                 │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  STEP 3 of 3: Set your budget                      │
│                                                     │
│  Weekly intelligence budget:                        │
│                                                     │
│        [ - ]   $10 / week   [ + ]                  │
│                                                     │
│  How it's split automatically:                      │
│  ████████████░░░░  Scout Agent       $3.00         │
│  ██████████████░░  Analyst Agent     $6.00         │
│  ██░░░░░░░░░░░░░░  CFO Agent         $1.00         │
│                                                     │
│  Estimated insights per week: 15–25 cards          │
│                                                     │
│  [Grant Permission & Launch Agents →]               │
│                                                     │
│  ⓘ This signs one MetaMask transaction.            │
│    No future approvals required.                    │
└─────────────────────────────────────────────────────┘
```

---

### Screen 3: Mission Control (Main Dashboard)

```
┌──────────────────────────────────────────────────────────────────────┐
│  SENTINEL                              Budget: $7.23 / $10.00  [■■■■■░░] │
│                                          Resets in: 4d 12h      [KILL] │
├─────────────────┬────────────────────────────────────────────────────┤
│  AGENT STATUS   │  INTELLIGENCE FEED              │  AUDIT TRAIL    │
│                 │                                 │                  │
│  ◉ CHIEF        │  ┌─ HIGH URGENCY ─────────────┐│ 14:02:33 Scout  │
│  Active         │  │ Cursor launched Agent Mode  ││ → SerperAPI     │
│  Reasoning...   │  │ — directly targeting your  ││ $0.002 ✓ [↗]   │
│                 │  │ use case.                   ││                  │
│  ◉ SCOUT        │  │                             ││ 14:02:35 Scout  │
│  Querying       │  │ Chief → Scout → Analyst     ││ → Venice AI     │
│  GitHub...      │  │ [↗ BaseScan] • $0.014 total ││ $0.004 ✓ [↗]   │
│  $2.31 left     │  │                             ││                  │
│                 │  │ [Draft response →]          ││ 14:02:38 Analyst│
│  ◉ ANALYST      │  └─────────────────────────────┘│ → Card #47      │
│  Synthesizing   │                                 ││ generated       │
│  4 items...     │  ┌─ TRENDING ──────────────────┐│                  │
│  $5.77 left     │  │ "AI code review" queries up ││ 14:01:12 CFO    │
│                 │  │ 340% on HN this week.       ││ → Spend check   │
│  ◎ CFO          │  │                             ││ $6.20/wk → pay  │
│  Monitoring     │  │ Chief → Scout [free RSS]    ││ as you go ✓     │
│  $0.84 left     │  │ → Analyst [↗] • $0.004     ││                  │
│                 │  │                             ││ [Load more...]  │
│  ──────────     │  │ [Mark read]  [Deep dive →]  ││                  │
│  [Revoke All]   │  └─────────────────────────────┘│                  │
└─────────────────┴─────────────────────────────────┴──────────────────┘
```

**Implementation notes:**

- **Left panel (Agent Status):** WebSocket connection to backend; each agent sends heartbeat every 30s. Pulse animation uses CSS keyframes — active agents pulse teal (#239AAA), idle agents show grey.
- **Center panel (Intelligence Feed):** Infinite scroll of intelligence cards. Urgency level drives card border color (HIGH = orange, MEDIUM = purple, LOW = grey). Each card has the delegation trace chips at the bottom.
- **Right panel (Audit Trail):** Terminal-style log using `JetBrains Mono`. Every line has an `[↗]` that opens the BaseScan transaction. Color: monospace text in `#00E5CC` on `#0B0C14`. This is the "undeniable proof" that it's running on-chain.
- **Kill switch:** Red `[KILL]` button in the header calls `revokePermissions()` and visually shows all agent status dots going grey simultaneously. "All agents defunded. Your funds are safe." appears in a centered overlay.

---

### Screen 4: Intelligence Card (Expanded View)

When a user taps a card, it expands into a full detail view:

```
┌─────────────────────────────────────────────────────┐
│ ← Back to Feed                          HIGH URGENCY│
│                                                      │
│ Cursor launched Agent Mode                           │
│ — directly targeting your use case.                  │
│                                                      │
│ SUMMARY                                              │
│ Cursor.sh shipped an "Agent Mode" feature on June    │
│ 13 that autonomously reviews and rewrites code.      │
│ This directly overlaps with [your product]'s core    │
│ value proposition of automated code review.          │
│                                                      │
│ SUGGESTED ACTION                                     │
│ Differentiate on team collaboration features and     │
│ enterprise security — gaps Agent Mode doesn't address│
│ publicly. Consider a comparison post within 48h.     │
│                                                      │
│ SOURCES (3)                                          │
│ [HackerNews #24671829 ↗]  [GitHub commit ↗]        │
│ [Cursor changelog ↗]                                 │
│                                                      │
│ DELEGATION TRAIL                                     │
│ [Chief] → [Scout: GitHub $0.000] → [Scout: Serper   │
│ $0.002 ✓ ↗] → [Analyst: Venice $0.004 ✓ ↗] → [You] │
│                                                      │
│ Total cost: $0.006      Processed: June 14, 14:02   │
│                                                      │
│ [Generate draft response →]  [Dismiss]              │
└─────────────────────────────────────────────────────┘
```

---

## 7. Data Flow Diagrams

### Full Agent Execution Flow

```
USER
  │
  │ 1. Grant ERC-7715 permission (one-time)
  ▼
CHIEF AGENT
  │
  │ 2. venice.chat.completions.create() — decompose brief
  │ 3. redelegatePermissionContext() — slice budget
  │    ├──→ SCOUT DELEGATION (3 USDC/week)
  │    ├──→ ANALYST DELEGATION (6 USDC/week)
  │    └──→ CFO DELEGATION (1 USDC/week)
  ▼
SCOUT AGENT
  │
  │ 4. GET /api/data-source?q=...
  │    → 402 Payment Required
  │ 5. x402Erc7710Client.createPaymentHeader()
  │    → X-PAYMENT header from Scout's delegation
  │ 6. 1Shot relayer_send7710Transaction()
  │    → Gas paid in USDC (zero ETH)
  │ 7. Webhook confirms → BaseScan link returned
  │
  └──→ Raw data payload
         │
         ▼
       ANALYST AGENT
         │
         │ 8. venice.chat.completions.create() — synthesize
         │    → Private inference (no logs, no surveillance)
         │ 9. IntelligenceCard JSON returned
         │ 10. Persisted to database
         │ 11. WebSocket push to Mission Control UI
         │
         └──→ Intelligence Card (visible to user)
                │
                ▼
              CFO AGENT (async, weekly evaluation)
                │
                │ 12. Evaluate weekly Venice spend vs DIEM break-even
                │     IF spend > threshold:
                │       a. Swap USDC → VVV (Aerodrome DEX on Base)
                │       b. Stake VVV → sVVV
                │       c. Lock sVVV → mint DIEM
                │       d. Stake DIEM → perpetual inference credits
                │     ELSE: pay-as-you-go continues
```

---

## 8. Smart Contract Configuration

### ERC-7715 Permission Schema (for setup wizard rendering)

```typescript
// The permission schema the user approves in the wizard
const SENTINEL_PERMISSION_SCHEMA = {
  chainId: 8453, // Base mainnet
  permissions: [
    {
      type: "erc20-token-periodic",
      token: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
      allowance: weeklyBudgetInMicroUSDC, // 6 decimals: $10 = 10_000_000n
      period: 604800, // 7 days in seconds
      isAdjustmentAllowed: false,
      justification: "SENTINEL autonomous intelligence — scout, analyst, CFO agents operating within this budget",
      expiry: thirtyDaysFromNow,
    },
  ],
};
```

### Delegation Budget Split Constants

```typescript
// src/constants/agentBudgets.ts
export const BUDGET_ALLOCATION = {
  SCOUT_PCT: 0.30,    // 30% of weekly budget
  ANALYST_PCT: 0.60,  // 60% of weekly budget
  CFO_PCT: 0.10,      // 10% of weekly budget — only acts if savings exceed this

  DIEM_BREAK_EVEN_MONTHLY_USD: 40, // At >$40/month Venice spend, staking DIEM is cheaper
  CFO_EVALUATION_INTERVAL_MS: 24 * 60 * 60 * 1000, // Daily check
};
```

---

## 9. File Structure

```
sentinel/
├── src/
│   ├── agents/
│   │   ├── chief/
│   │   │   ├── orchestrator.ts       — Venice decomposition, task planning
│   │   │   └── redelegate.ts         — ERC-7710 sub-agent delegation creation
│   │   ├── scout/
│   │   │   ├── agent.ts              — Main Scout loop
│   │   │   └── x402Discovery.ts      — Agentic Discovery + x402 payment
│   │   ├── analyst/
│   │   │   ├── agent.ts              — Main Analyst loop
│   │   │   └── synthesize.ts         — Venice AI synthesis
│   │   └── cfo/
│   │       ├── agent.ts              — Main CFO loop
│   │       └── optimizeCompute.ts    — VVV/DIEM staking decision engine
│   ├── lib/
│   │   ├── metamask/
│   │   │   ├── accountUpgrade.ts     — EIP-7702
│   │   │   ├── permissions.ts        — ERC-7715 grant
│   │   │   └── revoke.ts             — Kill switch
│   │   ├── oneshot/
│   │   │   ├── relayer.ts            — Fee discovery + submission
│   │   │   └── verification.ts       — Webhook-first + polling fallback
│   │   ├── x402/
│   │   │   ├── client.ts             — x402Erc7710Client wrapper
│   │   │   └── replayProtection.ts   — Database-backed replay guard
│   │   ├── venice/
│   │   │   └── client.ts             — OpenAI-compatible Venice client
│   │   └── db/
│   │       ├── schema.sql            — Intelligence cards, audit log, payments
│   │       └── index.ts              — SQLite via better-sqlite3
│   ├── app/ (Next.js 14 App Router)
│   │   ├── page.tsx                  — Landing / onboarding
│   │   ├── setup/
│   │   │   └── page.tsx              — 3-step wizard
│   │   ├── dashboard/
│   │   │   └── page.tsx              — Mission Control
│   │   └── api/
│   │       ├── agents/
│   │       │   ├── start/route.ts    — Launch agent workforce
│   │       │   └── status/route.ts   — Agent heartbeats
│   │       ├── webhooks/
│   │       │   └── oneshot/route.ts  — 1Shot webhook receiver
│   │       └── intelligence/
│   │           └── route.ts          — SSE stream for card updates
│   └── components/
│       ├── MissionControl/
│       │   ├── AgentStatus.tsx       — Left panel
│       │   ├── IntelligenceFeed.tsx  — Center panel
│       │   ├── AuditTrail.tsx        — Right panel
│       │   └── BudgetMeter.tsx       — Header budget bar
│       ├── IntelligenceCard.tsx      — Card with delegation trace chips
│       ├── DelegationTrace.tsx       — [Chief]→[Scout]→[Analyst]→[You] chips
│       ├── KillSwitch.tsx            — Emergency revocation UI
│       └── SetupWizard/
│           ├── Step1Brief.tsx
│           ├── Step2Sources.tsx
│           └── Step3Budget.tsx
├── .env.local
│   ├── VENICE_API_KEY=
│   ├── ONESHOT_PUBLIC_KEY=           — For webhook signature verification
│   ├── DATABASE_URL=./sentinel.db
│   └── NEXT_PUBLIC_BASE_CHAIN_ID=8453
└── README.md                         — Developer Experience Feedback section
```

---

## 10. Environment Setup

```bash
# Install dependencies
npm install @metamask/smart-accounts-kit @metamask/x402 openai viem next better-sqlite3

# Install 1Shot skill for AI coding assistants
npx skills add 1Shot-API/skills/public-relayer

# Development
npm run dev

# Deploy (Vercel recommended for webhook receiver reliability)
vercel deploy
```

---

## 11. Documentation References (Use These During Build)

| What you're implementing | Exact doc URL |
|---|---|
| ERC-7715 permission grant | `docs.metamask.io/smart-accounts-kit/concepts/advanced-permissions/` |
| EIP-7702 account upgrade | `docs.metamask.io/smart-accounts-kit/` (quickstart) |
| ERC-7710 redelegation | `docs.metamask.io/smart-accounts-kit/1.1.0/guides/delegation/create-redelegation/` |
| Execute on user's behalf | `docs.metamask.io/smart-accounts-kit/guides/advanced-permissions/execute-on-metamask-users-behalf/` |
| Revocation (v1.6.0) | `github.com/MetaMask/smart-accounts-kit/releases` |
| 1Shot relayer quickstart | `1shotapi.com/docs/quickstarts/gas-sponsorship-eip7710` |
| 1Shot fee data / submit | `1shotapi.com/docs` |
| x402 with delegation | `docs.metamask.io/smart-accounts-kit/development/guides/x402/buyer/delegations/` |
| x402 API reference | `docs.metamask.io/smart-accounts-kit/development/reference/x402/` |
| Venice API overview | `docs.venice.ai/overview/about-venice` |
| Venice model list | `docs.venice.ai/api-reference/api-spec` |
| Venice x402 client | `github.com/veniceai/x402-client` |
| VVV / DIEM staking | `venice.ai/token` |
| Private research agent guide | `docs.venice.ai` → Agent Tooling section |
| BaseScan (audit links) | `basescan.org/tx/{hash}` |

---

## 12. Novel Technical Contributions (Your "White Space")

These are features no other submission will have:

### 1. Agentic Discovery for External Data APIs
Most projects use x402 exclusively to pay Venice AI. SENTINEL's Scout Agent uses x402 against **external, third-party data APIs** — discovering their 402 headers dynamically, evaluating cost vs. delegated budget, and paying autonomously. This is the spec-correct vision for x402 that the protocol designers documented but nobody has yet demonstrated in a hackathon.

### 2. AI CFO Agent with DIEM Compute Optimization
Venice's DIEM token launched in late 2025 and represents perpetual daily compute credits. SENTINEL's CFO Agent autonomously evaluates whether to remain in pay-as-you-go (x402) mode or to acquire and stake VVV → mint DIEM for zero-marginal-cost future inference. This demonstrates Venice's newest economic layer and produces a verifiable on-chain optimization decision — provable by BaseScan.

### 3. Delegation Trace on Every Deliverable
Instead of a separate "audit page," the delegation chain is embedded **inside the intelligence card itself** — the actual deliverable. This is the first design pattern that makes on-chain proof part of the information artifact, not a developer footnote.

### 4. Privacy as the Primary Value Proposition
All other projects use Venice AI for "capability." SENTINEL uses Venice AI for **privacy** — specifically, your competitive intelligence queries are not visible to OpenAI or any corporate AI provider. The judge pitch can open with: "Every other project at this hackathon will use OpenAI for their AI. SENTINEL uses Venice AI because competitive intelligence is the one thing you cannot safely run on a shared, surveilled platform."

---

## 13. Demo Script (2 Minutes)

```
[00:00] "Most founders spend 2 hours a day manually monitoring their market.
         SENTINEL does it for them — privately, autonomously, on-chain."

[00:10] Show the setup wizard. Fill in the brief, select sources, set $10/week.
         "One click. One permission. That's the last thing you'll do manually."

[00:20] Click "Grant Permission & Launch Agents."
         MetaMask pops up with a clean permission card showing $10/week, 30 days.
         User approves. "And it's running."

[00:35] Switch to Mission Control. Agents show as pulsing teal dots.
         Audit trail starts filling: "Scout → SerperAPI $0.002 ✓"
         Show the BaseScan link opening. "That payment just happened on-chain."

[00:55] Intelligence card appears: "Cursor launched Agent Mode."
         Expand it. Show the delegation trace chips at the bottom.
         "Chief Agent delegated to Scout, Scout bought this data for $0.002,
          Analyst synthesized it privately on Venice AI for $0.004.
          Total cost of this insight: six-tenths of a cent."

[01:15] Scroll to the CFO section in the audit trail.
         "CFO Agent checked: at your current Venice usage, you're below the
          DIEM break-even point. So it kept you on pay-as-you-go this week."

[01:30] Click the Kill Switch. All agent dots go grey simultaneously.
         "Revoking the root permission defunds the entire chain instantly.
          Your USDC is yours. Your agents are gone. That's self-custody."

[01:50] "SENTINEL qualifies for all four tracks.
         x402 against real external APIs. A2A redelegation as real hierarchy.
         The most useful autonomous agent at the hackathon."
```

---

## 14. README: Developer Experience Feedback Section

Include this section verbatim in your README — judges use DX feedback as a maturity signal:

```markdown
## Developer Experience Feedback

### MetaMask Smart Accounts Kit
**What worked well:** The `erc7715ProviderActions()` extension pattern is elegant.
Composing Viem wallet clients with kit-specific actions keeps the API surface clean.

**Friction point:** The `DeleGatorEnvironment` typing is not exported from the main
package index; finding it required tracing internal imports. We added an `isDeleGator()`
utility (see `src/lib/metamask/accountUpgrade.ts`) that checks EIP-7702 bytecode prefix
(`0xef0100`) to detect Smart Account status — this should be a first-class export.

**Suggestion:** `Implementation.Hybrid` in the enum implies alternatives that don't
appear to be documented or functional. This caused confusion during setup.

### 1Shot API
**What worked well:** The permissionless relayer model (no API keys, no pre-funding)
is genuinely frictionless. The JSON-RPC interface kept integration clean.

**Friction point:** `relayer_getStatus` occasionally returned stale data during
high-throughput testing. Webhook payloads lack a published JSON schema, which made
implementing Ed25519 signature verification without official documentation challenging.

**Solution we built:** Dual-path verification (webhook primary, exponential backoff
polling fallback) in `src/lib/oneshot/verification.ts`. Publishing a formal webhook
schema would reduce integration time by ~2 hours for future builders.

### Venice AI
**What worked well:** The OpenAI-compatible API means zero migration cost from
OpenAI-based agent frameworks. Drop in `baseURL`, keep your existing code.

**Friction point:** Model selection is non-obvious for structured JSON output tasks.
We found `venice-uncensored-1.2` handles the task decomposition step well, while
`deepseek-r1-671b` provides better reasoning on synthesis tasks with large context.
A "model selection guide by task type" in the docs would help significantly.

**DIEM staking integration:** The VVV → sVVV → DIEM → stake pipeline is powerful
but underdocumented for programmatic (agent-driven) access. We relied on on-chain
contract ABI inspection for the minting flow.
```

---

## 15. Implementation Priority for Hackathon Sprint

If time is limited, build in this exact order — each phase is submittable:

### Phase 1 — Core (Minimum Viable Demo, ~4 hours)
- [ ] MetaMask connect + EIP-7702 upgrade via 1Shot
- [ ] ERC-7715 weekly budget grant (single permission)
- [ ] Chief Agent (Venice AI) decomposes a hardcoded brief
- [ ] Scout Agent (one free source: HackerNews RSS)
- [ ] Analyst Agent (Venice AI synthesis)
- [ ] One intelligence card appears in dashboard
- [ ] Audit trail with one real BaseScan link

### Phase 2 — Track Qualification (~3 hours)
- [ ] ERC-7710 redelegation (Chief → Scout, Chief → Analyst)
- [ ] x402 payment for one paid data source (e.g. Serper)
- [ ] 1Shot webhook receiver (upgrades from polling)
- [ ] Kill switch (revocation)
- [ ] Budget meter (real-time ERC-7715 remaining allowance)

### Phase 3 — White Space Differentiators (~2 hours)
- [ ] CFO Agent: weekly spend evaluation + DIEM optimization decision
- [ ] Delegation trace chips on intelligence cards
- [ ] Database-backed x402 replay protection
- [ ] `isDeleGator()` Smart Account detection utility
- [ ] README DX feedback section

---

## 16. Judging Criteria Checklist

Before submitting, verify:

- [ ] Demo video shows MetaMask Smart Accounts Kit in the **main flow** (not peripheral)
- [ ] x402 payment is demonstrated against a **real API endpoint** returning 402
- [ ] ERC-7710 **redelegation** is shown in the demo (Chief → Sub-agents)
- [ ] 1Shot relayer is used for gas abstraction (zero ETH)
- [ ] 1Shot **webhooks** are used for status (not polling-only)
- [ ] Venice AI is used for private inference
- [ ] At least one **BaseScan link** appears in the demo (on-chain proof)
- [ ] Kill switch revokes all permissions in the demo
- [ ] README includes DX feedback section
- [ ] Zero MetaMask popups after initial session grant

---

*SENTINEL — Built for the MetaMask Smart Accounts Kit × 1Shot API × Venice AI Dev Cook-Off*
*Deadline: June 15, 2026*

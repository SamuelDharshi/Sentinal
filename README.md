# SENTINEL — Autonomous Intelligence Engine

> **Grant a weekly USDC budget once. SENTINEL's agent workforce goes out on the open web, buys intelligence, synthesizes it privately on Venice AI, and delivers insights to your dashboard — autonomously, forever, without a single extra click from you.**

Built for the **MetaMask Smart Accounts Kit × 1Shot API × Venice AI Dev Cook-Off** · Deadline: June 15, 2026

---

## The Idea

Every indie developer and solo founder fights **information asymmetry**. Large companies have intelligence teams that monitor markets 24/7. You don't. So you spend 2–3 hours a day manually scanning HackerNews, GitHub, and Twitter — and still react too late to competitor moves.

SENTINEL solves this in three ways simultaneously:

1. **It's autonomous** — after a one-time 5-minute setup, zero human interaction required
2. **It's private** — all synthesis runs on Venice AI, which has zero query logging (unlike OpenAI)
3. **It's verifiable** — every agent action produces a BaseScan transaction link as on-chain proof

The system deploys a four-agent workforce under a cryptographically enforced budget hierarchy. One permission revocation kills the entire fleet. No escape hatches.

---

## How the App Works

### The One-Time Setup

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SENTINEL SETUP WIZARD                            │
│                                                                     │
│  STEP 1 ──────────────────────────────────────────────────────      │
│  Connect MetaMask → EIP-7702 auto-upgrade to Smart Account          │
│  (1Shot relayer sponsors gas in USDC — zero ETH required)           │
│                                                                     │
│  STEP 2 ──────────────────────────────────────────────────────      │
│  Write your Intelligence Brief in plain English:                    │
│    "I build developer tools. Track HN, GitHub, Product Hunt.       │
│     Watch: Cursor, Copilot, CodeRabbit."                           │
│  Select data sources: Free (HN, GitHub, PH) or paid via x402       │
│                                                                     │
│  STEP 3 ──────────────────────────────────────────────────────      │
│  Set weekly USDC budget → confirm ONE MetaMask popup (ERC-7715)    │
│  ████████████░░░  Scout   $3.00  (30%)                             │
│  ██████████████░  Analyst $6.00  (60%)                             │
│  ██░░░░░░░░░░░░░  CFO     $1.00  (10%)                             │
│                                                                     │
│  → That's it. You never touch the crypto stack again.               │
└─────────────────────────────────────────────────────────────────────┘
```

### The Running State — Mission Control Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SENTINEL                          Budget: $7.23/$10.00  ████████░░  [KILL] │
├──────────────────┬──────────────────────────────────────┬───────────────────┤
│  AGENT STATUS    │  INTELLIGENCE FEED                   │  AUDIT TRAIL      │
│                  │                                      │                   │
│  ◉ CHIEF         │  ┌─ HIGH URGENCY ─────────────────┐ │ 14:02:33 Scout    │
│  Orchestrating   │  │ Cursor launched Agent Mode —   │ │ → SerperAPI       │
│                  │  │ directly targeting your niche.  │ │ $0.002 ✓ [↗]     │
│  ◉ SCOUT         │  │                                 │ │                   │
│  Querying GitHub │  │ [Chief]→[Scout→Serper $0.002]  │ │ 14:02:35 Analyst  │
│  $2.31 left      │  │ →[Analyst→Venice] [↗] $0.014   │ │ → Venice AI       │
│                  │  │ [Draft response →]              │ │ $0.004 ✓ [↗]     │
│  ◉ ANALYST       │  └─────────────────────────────────┘ │                   │
│  Synthesizing    │                                      │ 14:01:12 CFO      │
│  $5.77 left      │  ┌─ TRENDING ──────────────────────┐ │ → Spend check     │
│                  │  │ "AI code review" queries up     │ │ $6.20/wk → PAYG ✓│
│  ◎ CFO           │  │ 340% on HN this week.           │ │                   │
│  Monitoring      │  │ [Scout→HN free]→[Analyst] ↗    │ │ [↗] = BaseScan    │
│  $0.84 left      │  └─────────────────────────────────┘ │                   │
│                  │                                      │                   │
│  [Revoke All]    │                                      │                   │
└──────────────────┴──────────────────────────────────────┴───────────────────┘
```

---

## Agent Architecture

### The Delegation Chain

```
User Wallet (MetaMask Smart Account)
    │
    │  ERC-7715: "spend up to $10 USDC/week for intelligence research"
    │  Scope: Erc20TransferAmount · 30-day expiry · 1Shot-relayed
    ▼
┌─────────────────────────────────────────┐
│         CHIEF ORCHESTRATOR              │
│  Venice AI (venice-uncensored-1.2)      │
│  ─────────────────────────────────────  │
│  • Decomposes plain-English brief       │
│  • Creates ERC-7710 sub-delegations     │
│  • Budget: $10/week (full allocation)   │
└──────┬──────────────┬───────────────┬───┘
       │ ERC-7710     │ ERC-7710      │ ERC-7710
       │ $3/wk        │ $6/wk         │ $1/wk
       ▼              ▼               ▼
 ┌──────────┐  ┌───────────────┐  ┌──────────┐
 │  SCOUT   │  │    ANALYST    │  │   CFO    │
 │  Agent   │  │    Agent      │  │  Agent   │
 │──────────│  │───────────────│  │──────────│
 │ • HN     │  │ Venice AI     │  │ Monitor  │
 │ • GitHub │  │ deepseek-     │  │ spend    │
 │ • PH RSS │  │ r1-671b       │  │ DIEM     │
 │ • x402   │  │ Private synth │  │ staking  │
 └──────────┘  └───────────────┘  └──────────┘
```

### Kill Switch Propagation

```
User clicks [KILL]
    │
    ▼
revokePermissions(rootPermissionContext)
    │
    │  ERC-7715 root invalidated on-chain
    │
    ├──► Scout delegation: INVALID  (same block)
    ├──► Analyst delegation: INVALID (same block)
    └──► CFO delegation: INVALID    (same block)
         │
         └──► "All agents defunded. Your funds are safe."
```

---

## Full System Flow — Sequence Diagram

```
User          MetaMask SAK      1Shot Relayer    Chief Agent    Scout Agent    Venice AI    CFO Agent
 │                │                  │               │              │              │             │
 │──EIP-7702──────▶                  │               │              │              │             │
 │  upgrade req   │                  │               │              │              │             │
 │                │──sponsor gas─────▶               │              │              │             │
 │                │◀─────tx hash─────│               │              │              │             │
 │◀─Smart Acct────│                  │               │              │              │             │
 │                │                  │               │              │              │             │
 │──ERC-7715 grant▶                  │               │              │              │             │
 │  $10/wk USDC   │──relay tx────────▶               │              │              │             │
 │                │                  │──permission───▶              │              │             │
 │                │                  │   granted     │              │              │             │
 │                │                  │               │─ERC-7710 redelegate─────────────────────▶ │
 │                │                  │               │  Scout $3, Analyst $6, CFO $1            │
 │                │                  │               │              │              │             │
 │                │                  │               │──task list───▶              │             │
 │                │                  │               │  (from brief)│              │             │
 │                │                  │               │              │─HN/GitHub/PH▶              │
 │                │                  │               │              │  free HTTP   │             │
 │                │                  │               │              │              │             │
 │                │                  │               │              │─GET /api──────────────────▶│
 │                │                  │               │              │  (402 resp)  │             │
 │                │                  │               │              │─X-PAYMENT────────────────▶ │
 │                │                  │               │              │  ERC-7710    │             │
 │                │                  │ ◀─webhook─────│──────────────│──────────────│────── tx ─  │
 │                │                  │   confirm     │              │              │             │
 │                │                  │               │◀─raw data────│              │             │
 │                │                  │               │              │              │             │
 │                │                  │               │──synthesize──────────────────▶            │
 │                │                  │               │  (private)   │     Venice AI│             │
 │                │                  │               │◀─intel card──────────────────│             │
 │                │                  │               │              │              │             │
 │◀─insight feed──│──────────────────│───────────────│              │              │             │
 │                │                  │               │              │              │             │
 │                │                  │               │──audit spend────────────────────────────▶ │
 │                │                  │               │              │              │    CFO eval │
 │                │                  │               │              │              │    DIEM?    │
```

---

## x402 Agentic Discovery — How Scout Pays for Data

This is the core innovation of SENTINEL's x402 integration. The Scout Agent does not have hardcoded API prices.

```
Scout Agent                          Serper/Diffbot API
    │                                      │
    │─── GET /api/search?q=cursor ─────────▶
    │                                      │
    │◀── 402 Payment Required ─────────────│
    │    {                                 │
    │      "amount": "2000",               │  (2000 micro-USDC = $0.002)
    │      "token": "0x833589f...",        │
    │      "recipient": "0xSeller...",     │
    │      "chainId": 8453                 │
    │    }                                 │
    │                                      │
    │ Check: $0.002 < remaining budget ✓   │
    │ Check: $0.002 < $0.10 safety limit ✓ │
    │                                      │
    │ Construct X-PAYMENT header:          │
    │  {scheme: "erc7710",                 │
    │   network: "eip155:8453",            │
    │   delegationContext: <ERC-7710>}     │
    │                                      │
    │─── GET /api/search (+ X-PAYMENT) ────▶
    │                                      │
    │◀── 200 OK + raw intelligence ────────│
    │                                      │
    │ Log to audit trail:                  │
    │  "Scout → SerperAPI $0.002 ✓ [↗]"   │
```

### Replay Protection (Database-Backed)

```
Incoming payment request
    │
    ▼
generatePaymentHash({amount, token, recipient, chainId})
    │
    ▼
INSERT OR IGNORE INTO processed_payments (hash, processed_at)
    │
    ├── changes == 1 → NEW payment → process ✓
    │
    └── changes == 0 → DUPLICATE → throw "Payment already processed"
         │
         └── Survives server restarts (SQLite, not in-memory Set)
```

---

## CFO Agent — DIEM Staking Decision Tree

Venice AI launched DIEM tokens in late 2025 (each DIEM = $1/day of inference in perpetuity). The CFO Agent is the only implementation of this economic layer in the hackathon.

```
Every week, CFO Agent runs:

Weekly Venice spend × 4.33 = Projected monthly spend
                │
                ▼
        > $40/month?
       /             \
     YES               NO
      │                 │
      ▼                 ▼
  DIEM_STAKE       PAY_AS_YOU_GO
      │             (x402 continues)
      │
      ▼
  1. USDC → VVV
     (Aerodrome DEX swap on Base)
      │
      ▼
  2. VVV → sVVV
     (4-week lock period)
      │
      ▼
  3. sVVV → DIEM mint
     (each DIEM = $1/day forever)
      │
      ▼
  Zero-marginal-cost inference
  for future Analyst calls
```

All steps execute via 1Shot relayer — no ETH in any wallet.

---

## Technology Stack

| Layer | Technology | What It Does |
|---|---|---|
| Account | MetaMask EIP-7702 | Upgrades EOA to Smart Account (one-time, gas-free) |
| Permissions | ERC-7715 | User grants weekly USDC budget with spend scope |
| Delegation | ERC-7710 | Chief slices budget to Scout/Analyst/CFO |
| Payments | x402 protocol | Scout pays paywalled APIs with `X-PAYMENT` header |
| Gas | 1Shot Relayer | All transactions in USDC — zero ETH anywhere |
| AI | Venice AI | Private inference — no query logging, DIEM staking |
| Models | venice-uncensored-1.2 | Chief (no content filters, competitive intel safe) |
| Models | deepseek-r1-671b | Analyst (671B params, large context, strong reasoning) |
| Chain | Base Mainnet (8453) | All on-chain activity |
| DB | SQLite | Replay protection, audit events, cards, agent state |
| Frontend | Next.js 14 | Landing page + setup wizard + Mission Control dashboard |

### Why Each Component Is Load-Bearing

Remove MetaMask delegation → sub-agents have no budget cap, revocation doesn't propagate  
Remove 1Shot → gas requires ETH, breaks the "zero crypto knowledge" UX  
Remove Venice AI → competitive queries are logged by OpenAI (the exact problem SENTINEL solves)  
Remove x402 → Scout can't buy external data without API keys (the key management problem returns)

---

## Hackathon Track Alignment

| Track | Prize | SENTINEL's submission |
|---|---|---|
| Best x402 + ERC-7710 | $3,000 | First project using x402 against **external paid data APIs** (not just Venice). Scout hits Serper/Diffbot paywalls and pays dynamically. |
| Best Agent | $3,000 | Chief decomposes plain-English brief → spawns 3 sub-agents → synthesizes intelligence — zero human interaction after setup |
| Best A2A Coordination | $3,000 | `Chief → Scout → Analyst → CFO` maps to real org structure. Revoke root permission → entire fleet defunded in one block |
| Best 1Shot Relayer | $1,000 | Every agent tx through 1Shot (USDC gas). Webhook-first verification qualifies for $500 webhook bonus |

---

## Color System

SENTINEL uses the brand colors of the three sponsor platforms as functional signals:

| Color | Hex | Signal |
|---|---|---|
| Background | `#0B0C14` | Deep navy — mission control |
| Surface | `#131424` | Card/panel background |
| Border | `#1E1F35` | Subtle definition |
| **Accent Teal** | `#239AAA` | **1Shot** — agent activity, x402 payments |
| **Accent Purple** | `#7B5FD4` | **Venice AI** — AI processing, private inference |
| **Accent Orange** | `#E27625` | **MetaMask** — wallet state, permission events |
| Success | `#22C55E` | Confirmed on-chain |
| Warning | `#F59E0B` | Budget threshold approaching |
| Danger | `#EF4444` | Anomaly / kill switch |
| Mono Text | `#00E5CC` | Audit trail terminal |

---

## Live Deployment

**Network: Base Mainnet (Chain ID: 8453)** · Deployed: 2026-06-12

| Component | Address / Endpoint |
|---|---|
| 1Shot Relayer Gateway | `https://relayer.1shotapi.com/relayer` |
| Advanced Permissions Enforcer (ERC-7715) | `0x15f8ed352fd940075ec3f7cedc773052f8af72d` (v1.6.0) |
| Smart Account Prefix (EIP-7702) | `0xef0100` |
| USDC on Base | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |

---

## Getting Started

### Prerequisites

- Node.js 20+
- MetaMask wallet with Base Mainnet configured
- USDC on Base (minimum ~$5 for a trial week)

### Install & Run

```bash
# Clone and install
git clone <repo>
cd Sentinal
npm install

# Configure environment
cp .env.example .env
# Fill in:
#   VENICE_API_KEY=         (from venice.ai)
#   ONESHOT_API_KEY=        (from 1shotapi.com)
#   ONESHOT_WEBHOOK_SECRET= (from 1Shot dashboard)

# Development server
npm run dev
# → http://localhost:3000

# Run tests
npm test

# Production build
npm run build
npm start
```

### Environment Variables

```bash
# Required
VENICE_API_KEY=your-venice-api-key
ONESHOT_API_KEY=your-1shot-api-key
ONESHOT_WEBHOOK_SECRET=your-webhook-secret

# Network (defaults to Base mainnet)
NEXT_PUBLIC_BASE_CHAIN_ID=8453
NEXT_PUBLIC_USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
NEXT_PUBLIC_BASESCAN_URL=https://basescan.org/tx

# Optional: 1Shot webhook endpoint (for production)
ONESHOT_WEBHOOK_URL=https://yourdomain.com/api/webhooks/oneshot
```

---

## Step-by-Step Usage

### Step 1 — Connect & Upgrade

1. Open SENTINEL at `http://localhost:3000`
2. Click **Launch SENTINEL** or **Connect MetaMask**
3. Approve the MetaMask connection prompt
4. The app calls `isDeleGator(address)` — checks if your wallet bytecode starts with `0xef0100`
5. If it's a standard EOA: one transaction upgrades to a Smart Account via EIP-7702, gas sponsored by 1Shot in USDC
6. You're redirected to the setup wizard

### Step 2 — Design Your Brief

1. **Step 1 of 3**: Write your business description and competitors (one per line)
   ```
   Business: I build developer tools. My product is a code review assistant.
   
   Competitors:
   Copilot
   Cursor
   CodeRabbit
   Codeium
   ```

2. **Step 2 of 3**: Select data sources
   - Free: HackerNews, GitHub Trending, Product Hunt
   - Paid via x402: Serper Search API (~$0.001/query), Diffbot (~$0.05/query), BuiltWith (~$0.02/query)

3. **Step 3 of 3**: Set your weekly USDC budget with the slider ($5–$50)

### Step 3 — Grant Permission & Launch

1. Review the automatic budget split: Scout 30% / Analyst 60% / CFO 10%
2. Click **⚡ Grant Permission & Launch Agents**
3. One MetaMask popup: `wallet_grantPermissions` (ERC-7715)
4. Confirm → agents start immediately → you're redirected to Mission Control

**This is the last time you interact with the crypto stack.**

### Step 4 — Mission Control Dashboard

The dashboard has three panels:

**Left panel — Agent Status**
- Each agent shows a pulsing status dot (teal = active, grey = idle)
- Current action text (e.g. "Querying GitHub Trending…")
- Remaining budget for the week

**Center panel — Intelligence Feed**
- Intelligence cards arrive in real-time as agents complete synthesis
- Each card shows: urgency badge, headline, summary, suggested action
- At the bottom of each card: the **Delegation Trace** — exactly which agents ran, what each cost, with BaseScan links

  ```
  [Chief] → [Scout → SerperAPI $0.002 ↗] → [Analyst → Venice $0.004 ↗] → [You]
  ```

- Click any card to open the full detail modal with sources and complete delegation trail

**Right panel — Audit Trail**
- Terminal-style live log of every agent action
- Every line has a timestamp, agent name (color-coded), action description, cost, and `[↗]` BaseScan link

### Step 5 — Emergency Stop

Click the red **[KILL]** button in the top-right. This:

1. Calls `wallet_revokePermissions` on the root ERC-7715 context
2. Posts to `/api/agents/revoke` to stop the server-side session
3. All agent status dots turn grey simultaneously
4. Banner appears: "All agents defunded. Your funds are safe."
5. Any unspent USDC in the weekly budget remains in your wallet

---

## Project Structure

```
Sentinal/
│
├── README.md
├── package.json                       # Next.js 14, viem, openai, better-sqlite3
├── sentinel.db                        # SQLite: audit events, cards, agent state, replay protection
├── tests/
│   └── run-tests.mjs                  # 41-test module test suite (node tests/run-tests.mjs)
│
├── src/                               # Main app (backend + app routes)
│   ├── types.ts                       # Shared TypeScript interfaces
│   │
│   ├── agents/
│   │   ├── chief/
│   │   │   ├── orchestrator.ts        # Venice AI brief → TaskList (venice-uncensored-1.2)
│   │   │   └── redelegate.ts          # ERC-7710 budget delegation (30/60/10 split)
│   │   ├── scout/
│   │   │   ├── agent.ts               # HN/GitHub/ProductHunt live HTTP fetches
│   │   │   └── x402Discovery.ts       # 402 detection → X-PAYMENT header construction
│   │   ├── analyst/
│   │   │   └── synthesize.ts          # Venice AI (deepseek-r1-671b) → IntelligenceCard[]
│   │   └── cfo/
│   │       └── optimizeCompute.ts     # DIEM staking decision ($40/month break-even)
│   │
│   ├── app/
│   │   ├── page.tsx                   # Landing page (SENTINEL-branded, wallet connect)
│   │   ├── layout.tsx                 # Root layout + Google Fonts
│   │   ├── globals.css                # Global design system (CSS variables, components)
│   │   ├── setup/page.tsx             # 3-step onboarding wizard
│   │   ├── dashboard/page.tsx         # Mission Control (3-panel: agents / feed / audit)
│   │   └── api/
│   │       ├── agents/start/          # POST: launches Chief agent, creates sub-delegations
│   │       ├── agents/revoke/         # POST: kill switch (revoke permissions + stop session)
│   │       ├── intelligence/          # GET: SSE stream (cards + audit events + agent state)
│   │       ├── balance/               # GET: real-time USDC balance from Base RPC
│   │       ├── check-account/         # GET: isDeleGator() bytecode check
│   │       └── webhooks/oneshot/      # POST: 1Shot Ed25519-signed webhook handler
│   │
│   └── lib/
│       ├── metamask/
│       │   ├── accountUpgrade.ts      # EIP-7702 isDeleGator() check
│       │   ├── permissions.ts         # ERC-7715 grantWeeklyBudget()
│       │   └── revoke.ts              # revokePermissions() kill switch
│       ├── oneshot/
│       │   ├── relayer.ts             # relayer_getFeeData, relayer_send7710Transaction
│       │   ├── submit.ts              # Transaction submission helpers
│       │   └── verification.ts        # Webhook-first + exponential backoff polling fallback
│       ├── venice/
│       │   └── client.ts              # OpenAI-compatible Venice AI client
│       ├── x402/
│       │   ├── client.ts              # x402 HTTP client with ERC-7710 payment construction
│       │   └── replayProtection.ts    # SQLite INSERT OR IGNORE unique payment hash guard
│       ├── chain/
│       │   ├── client.ts              # Viem public + wallet clients (Base mainnet)
│       │   ├── balance.ts             # USDC balance queries
│       │   ├── sessionKey.ts          # Ephemeral session key generation
│       │   └── transactions.ts        # On-chain transaction helpers
│       └── db/
│           └── index.ts               # SQLite schema, audit events, cards, agent state CRUD
│
└── sentinal/                          # Marketing landing page (separate Next.js + Tailwind app)
    └── components/                    # Hero, Navbar, Features, Stats, Pricing, Docs, CTA, Footer
```

---

## Test Report

Run `npm test` to execute all 41 tests:

```
╔══════════════════════════════════════════════════════════════╗
║              SENTINEL — Module Test Report                  ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ── CFO Agent (5 tests)                                      ║
║  ✓ calculateComputeMetrics — sums correctly                  ║
║  ✓ evaluateComputeStrategy — payAsYouGo below threshold      ║
║  ✓ evaluateComputeStrategy — stake when above $40/month      ║
║  ✓ evaluateComputeStrategy — exact threshold boundary        ║
║  ✓ evaluateComputeStrategy — just over threshold             ║
║                                                              ║
║  ── Budget Allocation (4 tests)                              ║
║  ✓ $10/week splits correctly (30/60/10)                      ║
║  ✓ $5/week splits correctly                                  ║
║  ✓ $20/week splits correctly                                 ║
║  ✓ allocation percentages sum to 100%                        ║
║                                                              ║
║  ── x402 Payment Logic (6 tests)                             ║
║  ✓ microToUSDC converts correctly                            ║
║  ✓ validateX402Cost passes within budget and limit           ║
║  ✓ validateX402Cost throws when exceeds budget               ║
║  ✓ validateX402Cost throws when exceeds per-query limit      ║
║  ✓ validateX402Cost passes at exactly $0.10 limit            ║
║  ✓ Serper cost ~$0.001 passes validation                     ║
║                                                              ║
║  ── Replay Protection (5 tests)                              ║
║  ✓ processes new payment successfully                        ║
║  ✓ rejects duplicate payment hash                            ║
║  ✓ different hashes both succeed                             ║
║  ✓ generatePaymentHash is deterministic                      ║
║  ✓ generatePaymentHash differs by amount                     ║
║                                                              ║
║  ── Chief Orchestrator (5 tests)                             ║
║  ✓ fallback generates correct number of scout tasks          ║
║  ✓ fallback uses brief text in first task query              ║
║  ✓ fallback adds competitor tasks with high priority         ║
║  ✓ fallback generates 3 analyst questions                    ║
║  ✓ fallback thresholds set correctly                         ║
║                                                              ║
║  ── EIP-7702 Detection (4 tests)                             ║
║  ✓ detects smart account bytecode                            ║
║  ✓ rejects EOA (null code)                                   ║
║  ✓ rejects EOA (empty bytecode)                              ║
║  ✓ rejects non-delegation bytecode                           ║
║                                                              ║
║  ── Urgency Classification (5 tests)                         ║
║  ✓ high maps to MetaMask orange (#E27625)                    ║
║  ✓ medium maps to Venice purple (#7B5FD4)                    ║
║  ✓ low maps to dim grey                                      ║
║  ✓ invalid value defaults to low                             ║
║  ✓ valid values pass through                                 ║
║                                                              ║
║  ── Budget Display (7 tests)                                 ║
║  ✓ 72.3% of $10 displays correctly                           ║
║  ✓ full budget shows 100%                                    ║
║  ✓ empty budget clamps to 0                                  ║
║  ✓ overdraft clamps to 0                                     ║
║  ✓ <20% triggers danger class                                ║
║  ✓ 20–40% triggers warning class                             ║
║  ✓ >40% no class                                             ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  Results: 41/41 passed                                       ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Protocols & Standards

| Protocol | Role |
|---|---|
| **EIP-7702** | Upgrades EOA to MetaMask Smart Account (one-time, gas-free) |
| **ERC-7715** | User grants scoped weekly USDC spend permission to Chief Agent |
| **ERC-7710** | Chief redelegates budget slices to Scout, Analyst, CFO |
| **x402** | HTTP-native micropayments — Scout pays paywalled external data APIs |
| **1Shot Relayer** | Gas abstraction — all transactions paid in USDC, no ETH anywhere |
| **Venice AI** | Private LLM inference — zero logging, DIEM staking for cost optimization |

---

## Key Implementation Patterns

### ERC-7710 Budget Enforcement (not a runtime check)

```typescript
// Budget allocation is cryptographically enforced at the delegation level
const scoutContext  = deriveChildContext(rootCtx, 'scout',   weeklyBudget * 0.30);
const analystContext = deriveChildContext(rootCtx, 'analyst', weeklyBudget * 0.60);
const cfoContext    = deriveChildContext(rootCtx, 'cfo',     weeklyBudget * 0.10);
// Each child context is signed and linked to parent — cannot exceed its cap
```

### Webhook-First Verification (1Shot)

```typescript
async verify(txHash: string): Promise<Transaction> {
  return Promise.race([
    new Promise<Transaction>((resolve) =>        // Primary: Ed25519 webhook
      this.pendingTxns.set(txHash, resolve)),
    this.pollWithBackoff(txHash),                 // Fallback: exponential backoff
  ]);
}
```

### x402 Agentic Discovery

```typescript
const response = await fetch(endpoint);         // Cold hit — no hardcoded price
if (response.status === 402) {
  const { amount, token, recipient, chainId } = await response.json();
  const cost = Number(amount) / 1_000_000;      // micro-USDC → USDC
  if (cost > remainingBudget) throw new Error('Over budget');
  if (cost > 0.10) throw new Error('Per-query safety limit exceeded');
  const paidResponse = await fetch(endpoint, {
    headers: { 'X-PAYMENT': paymentHeader },     // ERC-7710 delegation-backed
  });
}
```

### SQLite Replay Protection (survives restarts)

```typescript
const inserted = await db.run(
  `INSERT OR IGNORE INTO processed_payments (hash, processed_at) VALUES (?, ?)`,
  [paymentHash, new Date().toISOString()]
);
if (inserted.changes === 0) throw new Error('Payment already processed');
// ↑ Database-backed: survives PM2 restarts unlike in-memory Set
```

### CFO DIEM Staking Logic

```typescript
const projectedMonthlySpend = weeklyX402Spend * 4.33;
if (projectedMonthlySpend > 40) {
  // USDC → VVV (Aerodrome DEX on Base)
  // VVV → sVVV (4-week stake)
  // sVVV → DIEM mint (each = $1/day inference in perpetuity)
  // All via 1Shot relayer — no ETH required
}
```

---

*SENTINEL — Built for MetaMask Smart Accounts Kit × 1Shot API × Venice AI Dev Cook-Off*  
*Hackathon Deadline: June 15, 2026*

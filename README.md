# SENTINEL — Autonomous Intelligence Engine

> **Grant a weekly USDC budget once. SENTINEL's agent workforce goes out on the open web, buys intelligence, synthesizes it privately on Venice AI, and delivers insights to your dashboard — autonomously, forever, without a single extra click from you.**

Built for the **MetaMask Smart Accounts Kit × 1Shot API × Venice AI Dev Cook-Off** · Deadline: June 15, 2026

---

## The Idea

Every indie developer, solo founder, and digital creator fights **information asymmetry**. Large corporations have full-time intelligence teams that monitor markets 24/7—tracking competitor updates, scraping product forums, checking GitHub activity, and detecting trends. Individual builders cannot afford that. 

Solo operators usually resort to scanning HackerNews, GitHub, and Twitter manually for 2 to 3 hours a day, reacting to competitor moves too late, and leaking search intent by querying OpenAI, Google, or other tracking tools with sensitive company queries.

### The SENTINEL Solution
SENTINEL makes every solo operator as intelligence-rich as a venture-backed startup for a small budget (e.g., $5–$15/week) with zero daily effort. It solves this problem by deploying an autonomous, decentralized workforce of specialized AI agents governed by a cryptographic budget hierarchy:

```
+-----------------------------------------------------------------------------+
|                                  SENTINEL                                   |
|                                                                             |
|      [ USER WALLET ] ----( 1. One-time Setup & Budget Authorization )---+   |
|                                                                         |   |
|  +----------------------------------------------------------------------+   |
|  |                                                                          |
|  |   +-------------------------------------------------------------------+  |
|  |   |                        CHIEF ORCHESTRATOR                         |  |
|  |   |         - Decomposes Brief (Venice AI: venice-uncensored-1.2)     |  |
|  +-->|         - Deploys Sub-Delegations (ERC-7710 Budget Slicing)       |  |
|      +----------+-----------------------+-----------------------+--------+  |
|                 |                       |                       |           |
|                 | ERC-7710              | ERC-7710              | ERC-7710  |
|                 | ($3.00/wk)            | ($6.00/wk)            | ($1.00/wk)|
|                 v                       v                       v           |
|            +----------+            +----------+            +----------+     |
|            |  SCOUT   |            | ANALYST  |            |   CFO    |     |
|            |  AGENT   |            |  AGENT   |            |  AGENT   |     |
|            +----+-----+            +----+-----+            +----+-----+     |
|                 |                       ^                       |           |
|        Finds & buys data                | Private               | Monitors  |
|        via RSS or x402                  | Synthesis             | budget &  |
|                 |                       | (deepseek-r1)         | DIEM stake|
|                 v                       |                       v           |
|            +----------+                 |                  +----------+     |
|            | Raw Data |-----------------+                  | sVVV/DIEM|     |
|            +----------+                                    +----------+     |
|                                                                             |
+-----------------------------------------------------------------------------+
```

### Core Architecture Pillars

1. **True Autonomy**: Setup takes 5 minutes. The user connects their MetaMask wallet once, upgrade to a smart account, writes an intelligence brief, sets a weekly budget, and never touches the app again. The system runs 24/7 in the background.
2. **Absolute Privacy**: All intellectual synthesis runs on Venice AI's zero-logging API. Unlike OpenAI or Google, Venice does not log search queries or model inputs, ensuring competitive queries stay private.
3. **On-chain Verifiability**: Every action taken by the agents (purchasing data or calling Venice APIs) executes via smart account delegations and produces a BaseScan transaction link, providing an immutable audit trail.
4. **Agentic Discovery (x402)**: The Scout Agent does not have hardcoded API keys. When it encounters paywalled data provider endpoints, it handles the standard `402 Payment Required` HTTP response, parses the payment metadata, and dynamically pays for the query in USDC using its delegated ERC-7710 budget, completing the transaction via the 1Shot gasless relayer.
5. **Economic CFO Optimization**: The CFO Agent monitors spending. If weekly data gathering and synthesis fees exceed a target threshold, it automatically swaps USDC for Venice's native token (VVV) via Aerodrome, stakes it into sVVV, and mints DIEM tokens to provide zero-marginal-cost inference credits for the Analyst Agent in perpetuity.

---

## How the App Works

### 1. MetaMask Smart Account Upgrade (EIP-7702)
Standard External Owned Accounts (EOAs) cannot delegate permissions or execute complex multi-agent budgets autonomously. SENTINEL upgrades the user's EOA to a hybrid Smart Account using EIP-7702. The upgrade transaction gas is sponsored by the 1Shot Relayer in USDC, requiring no native ETH in the user's wallet.

```
  [ User EOA Wallet ] -------( Request Upgrade )--------> [ 1Shot Relayer ]
                                                                 |
                                                                 | Checks Bytecode & Sponsors
                                                                 v
  [ Smart Account (0xef0100...) ] <------------------------------+
  ( Upgraded in one transaction via EIP-7702 )
```

### 2. The Budget Allocation Hierarchy (ERC-7715 & ERC-7710)
Through a single MetaMask popup, the user authorizes a weekly USDC budget using ERC-7715. The Chief Orchestrator then splits this budget into sub-allowances for the Scout, Analyst, and CFO sub-agents using ERC-7710 sub-delegations:

```
                        [ Root Smart Account ] (Allowance: $10/wk USDC)
                                  |
                                  | (ERC-7715 Permissions Granted)
                                  v
                       [ Chief Orchestrator ]
                        /         |         \
                       /          |          \  (ERC-7710 Sub-delegations)
                      /           |           \
                     v            v            v
                [ Scout ]     [ Analyst ]   [ CFO ]
                ($3.00/wk)    ($6.00/wk)   ($1.00/wk)
```

### 3. x402 Micropayments Handshake
When the Scout Agent scrapes the web, it queries data APIs. If an API is paywalled, it returns an HTTP `402 Payment Required` status. The Scout Agent parses the requirements, verifies the cost against its remaining budget, constructs an ERC-7710 payment header, pays the seller on-chain via 1Shot, and retries the request with the `X-PAYMENT` token header:

```
    [ Scout Agent ]                                       [ Data Provider API ]
           |                                                        |
           |---- 1. GET /api/search?q=cursor ---------------------->|
           |                                                        |
           |<--- 2. 402 Payment Required ---------------------------|
           |        (amount: 2000, recipient: 0xSeller...)          |
           |                                                        |
           |--[ Check: cost < remainingBudget & Safety limit ]      |
           |                                                        |
           |---- 3. GET /api/search + X-PAYMENT ------------------->|
           |        (using ERC-7710 Sub-delegation)                 |
           |                                                        |
           |                                   [ Relayer submits ]  |
           |                                   [ transfer on-chain ]|
           |                                                        |
           |<--- 4. 200 OK + Payload -------------------------------|
```

### 4. CFO Staking Decision tree
Every week, the CFO Agent reviews the running expense logs. If the Venice AI inference cost projects to over $40/month, the CFO swaps USDC for VVV on Aerodrome, locks sVVV for 4 weeks, and mints Venice DIEM tokens. This secures free daily inference limits for the Analyst Agent:

```
                     [ CFO Execution (Weekly check) ]
                                    |
                                    v
                     [ Venice Spend * 4.33 > $40/mo? ]
                               /         \
                             YES          NO
                             /             \
                            v               v
                   [ Stake USDC ]     [ Pay-As-You-Go ]
                        |             (Continue x402)
                        v
                 [ Swap USDC -> VVV ]
                 (Aerodrome on Base)
                        |
                        v
                 [ Lock VVV -> sVVV ]
                    (4-Week Lock)
                        |
                        v
                 [ Stake sVVV -> DIEM ]
                 (Mint perpetual credits)
```

### 5. Mission Control UI Dashboard
The user interacts with a 3-panel realtime terminal mapping agent execution, raw feeds, and on-chain transactions:

```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│ SENTINEL  [Active]                            Budget: $7.23 / $10.00 USDC [■■■■■░░]   │
│ Registered: 0x15f8...d72d                     Resets in: 4d 12h              [ KILL ] │
├─────────────────────────┬──────────────────────────────────────────┬──────────────────┤
│ AGENT STATUS            │ INTELLIGENCE FEED                        │ AUDIT TRAIL      │
│                         │                                          │                  │
│ [◉] CHIEF ORCHESTRATOR  │ ┌─ HIGH URGENCY ───────────────────────┐ │ 23:10:01 Scout   │
│     State: Reasoning    │ │ Cursor launched Agent Mode           │ │ -> GET /github   │
│     Budget: $10.00      │ │ - Direct threat to your niche        │ │ Cost: Free  [✓]  │
│                         │ │                                      │ │                  │
│ [◉] SCOUT AGENT         │ │ [Chief]->[Scout->Serper ↗]->[Analyst]│ │ 23:10:04 Scout   │
│     State: Querying HN  │ │ Total Cost: $0.006 USDC              │ │ -> GET /serper   │
│     Budget: $2.31 Left  │ └──────────────────────────────────────┘ │ Cost: $0.002 [↗] │
│                         │                                          │                  │
│ [◉] ANALYST AGENT       │ ┌─ TRENDING ───────────────────────────┐ │ 23:10:12 Analyst │
│     State: Synthesizing │ │ AI code review search queries up 340%│ │ -> Venice synth  │
│     Budget: $5.77 Left  │ │                                      │ │ Cost: $0.004 [↗] │
│                         │ │ [Chief]->[Scout->HN]->[Analyst]      │ │                  │
│ [◎] CFO AGENT           │ │ Total Cost: $0.004 USDC              │ │ 23:10:15 CFO     │
│     State: Monitoring   │ └──────────────────────────────────────┘ │ -> Audit check   │
│     Budget: $0.84 Left  │                                          │ │ Balance ok   [✓] │
└─────────────────────────┴──────────────────────────────────────────┴──────────────────┘
```

---

## Full System Flow — Sequence Diagram

The diagram below details the entire flow of the application, showing onboarding, setup, the core loops of the Scout, Analyst, and CFO agents, and the revocation kill switch.

```mermaid
sequence diagram
    autonumber
    actor User
    participant MetaMask SAK
    participant 1Shot Relayer
    participant Chief Agent
    participant Scout Agent
    participant Analyst Agent
    participant CFO Agent
    participant Venice AI
    participant DB as SQLite DB

    Note over User, MetaMask SAK: Phase 1: Onboarding & Account Upgrade
    User->>MetaMask SAK: Connect Wallet
    MetaMask SAK->>1Shot Relayer: checkAddressUpgraded(userAddress)
    1Shot Relayer-->>MetaMask SAK: Upgraded: false (EOA)
    MetaMask SAK->>User: Request EIP-7702 Upgrade Signature
    User->>MetaMask SAK: Sign Upgrade Transaction
    MetaMask SAK->>1Shot Relayer: submitUpgradeTx(authSig)
    1Shot Relayer->>1Shot Relayer: Sponsor Gas (USDC)
    1Shot Relayer-->>MetaMask SAK: Upgrade Confirmed (0xef0100 prefix)
    MetaMask SAK-->>User: Redirect to Setup Wizard

    Note over User, Chief Agent: Phase 2: Setup & Launch
    User->>Chief Agent: Input Brief, Competitors, Sources, Budget ($10/wk)
    Chief Agent->>MetaMask SAK: Request ERC-7715 budget grant
    MetaMask SAK->>User: Prompt budget authorization (1 popup)
    User->>MetaMask SAK: Approve Budget
    MetaMask SAK->>DB: Save Session Context & Start
    
    Note over Chief Agent, CFO Agent: Phase 3: Autonomous Workforce Execution Loop
    Loop Every 1 Hour
        Chief Agent->>DB: Fetch Active Session
        Chief Agent->>Venice AI: Decompose brief into tasks (venice-uncensored-1.2)
        Venice AI-->>Chief Agent: TaskList JSON
        Chief Agent->>Chief Agent: Redelegate Budgets via ERC-7710
        Chief Agent->>Scout Agent: Launch tasks (Scout Budget: $3)
        Chief Agent->>Analyst Agent: Assign synthesis questions (Analyst Budget: $6)
        Chief Agent->>CFO Agent: Launch spend evaluation (CFO Budget: $1)

        Note over Scout Agent, 1Shot Relayer: Scout Agent Data Gathering (x402)
        Scout Agent->>Scout Agent: Query free RSS feeds (HN, Github, PH)
        Scout Agent->>Scout Agent: Query Serper API (paid)
        Note over Scout Agent: API returns 402 Payment Required
        Scout Agent->>1Shot Relayer: Submit ERC-7710 USDC Transfer to Seller
        1Shot Relayer->>1Shot Relayer: Relays tx on-chain (Base Mainnet)
        1Shot Relayer-->>Scout Agent: Webhook notification + Tx hash
        Scout Agent->>Scout Agent: Append X-PAYMENT header
        Scout Agent->>Scout Agent: Retry API with Payment Header -> Returns data
        Scout Agent->>DB: Log Scout Raw Data & Audit Trail Event

        Note over Analyst Agent, Venice AI: Analyst Agent private synthesis
        Analyst Agent->>DB: Fetch Scout Raw Data
        Analyst Agent->>Venice AI: Private synthesis (deepseek-r1-671b)
        Venice AI-->>Analyst Agent: Intelligence Card JSON ( headline, summary, urgency, actions )
        Analyst Agent->>DB: Write Intelligence Card to DB (BaseScan linked trace)

        Note over CFO Agent, 1Shot Relayer: CFO Agent cost optimization
        CFO Agent->>DB: Fetch weekly Venice spending metrics
        CFO Agent->>CFO Agent: Evaluate projected monthly spend
        alt Spend > $40/month
            CFO Agent->>1Shot Relayer: Swap USDC to VVV (Aerodrome Base)
            CFO Agent->>1Shot Relayer: Stake VVV to sVVV
            CFO Agent->>1Shot Relayer: Mint DIEM (zero-marginal-cost inference)
            CFO Agent->>DB: Log Staking Event in Audit Trail
        else Spend <= $40/month
            CFO Agent->>DB: Log Pay-As-You-Go status
        end
    end

    Note over User, MetaMask SAK: Phase 4: Emergency Revocation
    User->>Chief Agent: Click [KILL] Switch
    Chief Agent->>MetaMask SAK: Call wallet_revokePermissions()
    MetaMask SAK->>1Shot Relayer: Revoke root permission context on-chain
    1Shot Relayer-->>MetaMask SAK: Revoked
    Chief Agent->>DB: Set session status to 'killed' and defund agents
    Chief Agent-->>User: Show "All agents defunded. Funds safe."
```

---

## Detailed Step-by-Step Usage Instructions

### Step 1: Wallet Connection & Account Upgrade
1. Open the SENTINEL web app (defaults to `http://localhost:3000`).
2. Click **Connect Wallet** in the top-right header or on the landing page.
3. MetaMask will prompt you to connect. Approve the prompt.
4. The system automatically inspects your wallet bytecode (`isDeleGator(address)`) for the EIP-7702 prefix (`0xef0100`).
5. If your account is a standard EOA, you will be prompted with a MetaMask upgrade dialog. Click **Sign**.
6. The 1Shot Relayer registers this EIP-7702 authorization and executes the upgrade on-chain. Gas fees are sponsored using USDC—**you do not need any ETH**.

### Step 2: Formulating the Intelligence Brief
1. You will be redirected to the Onboarding Setup Wizard.
2. In **Step 1 of 3: What's your business?**, write a plain-English brief of your product, audience, and what signals you want to track.
   - *Example:* "I build developer tools. My product is an AI-powered code review assistant. Track HN, GitHub, and Product Hunt. Watch Cursor, Copilot, and CodeRabbit. Alert me on new competitive features or launches."
3. In the **Competitors** textarea, list your direct competitors, one per line:
   ```
   Cursor
   Copilot
   CodeRabbit
   ```

### Step 3: Selecting Data Sources & Budgeting
1. In **Step 2 of 3: Where should we look?**, select the sources you want the Scout Agent to scan.
   - Free sources include HackerNews, GitHub Trending, and Product Hunt RSS feeds.
   - Paid sources operate via x402 micropayments. These include the Serper Search API, Diffbot Web Intelligence, and BuiltWith Tech API.
2. In **Step 3 of 3: Set your budget**, use the interactive slider to configure a weekly budget limit in USDC ($5 to $50).
3. The UI automatically displays the budget slicing split:
   - **Scout Agent**: 30% (used to query RSS feeds and purchase paid data via x402).
   - **Analyst Agent**: 60% (used for private Venice AI reasoning and report generation).
   - **CFO Agent**: 10% (monitors spend records, Swaps USDC -> VVV, and stakes DIEM to lower compute overhead).

### Step 4: Granting Permissions
1. Click the **⚡ Grant Permission & Launch Agents** button.
2. MetaMask will show a single `wallet_grantPermissions` popup (ERC-7715). This grants the Chief Agent the permission to spend up to your weekly USDC budget limit.
3. Confirm the popup.
4. The setup wizard completes, and you are automatically redirected to the **Mission Control Dashboard**.

### Step 5: Interacting with Mission Control
The dashboard is split into three main modules:
- **Left Panel (Agent Status)**: Displays the running status of your agents. Active agents pulse teal (`#239AAA`), while idle agents display grey. You can track each agent's individual remaining weekly budget here.
- **Center Panel (Intelligence Feed)**: This is your private feed. Cards are loaded in real-time. Urgent competitive updates show an orange border, trending updates show a purple border, and low-urgency insights show grey.
  - At the bottom of each card is a **Delegation Trace** chip row:
    `[Chief] -> [Scout: Serper $0.002 ↗] -> [Analyst: Venice $0.004 ↗] -> [You]`
  - Clicking `[↗]` opens the BaseScan transaction, proving the agent's work.
- **Right Panel (Audit Trail)**: A live scrolling terminal reflecting agent transactions, API calls, and gas fees. Every entry contains a clickable transaction link to BaseScan.

### Step 6: Triggering the Emergency Stop
1. If you want to stop the workforce, click the red **[KILL]** button in the top-right corner of the dashboard.
2. The app calls `wallet_revokePermissions` on your root ERC-7715 permission context.
3. The MetaMask SAK revokes the permission on-chain, rendering all child delegations (Scout, Analyst, CFO) invalid in the same block.
4. The UI displays an overlay: **"All agents defunded. Your funds are safe."** All status indicators turn grey.

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Account** | [MetaMask EIP-7702 SAK](https://docs.metamask.io/smart-accounts-kit/) | Upgrades user wallets to Smart Accounts with no native ETH gas requirements. |
| **Permissions** | [ERC-7715](https://docs.metamask.io/smart-accounts-kit/concepts/advanced-permissions/) | Grants periodic weekly spending allowances in USDC. |
| **Delegation** | [ERC-7710](https://docs.metamask.io/smart-accounts-kit/1.1.0/guides/delegation/create-redelegation/) | Slices the weekly budget among Scout, Analyst, and CFO sub-agents. |
| **Payments** | [x402 Protocol](https://docs.metamask.io/smart-accounts-kit/development/guides/x402/buyer/delegations/) | Handshakes, pricing discoveries, and on-chain payments to paywalled API endpoints. |
| **Gas Relayer** | [1Shot API Relayer](https://1shotapi.com/) | Executes Smart Account transactions with USDC gas-sponsorship. |
| **Privacy AI** | [Venice AI API](https://docs.venice.ai/) | Executes LLM queries with no query logging or data surveillance. |
| **Models** | `venice-uncensored-1.2` | Chief Orchestrator: Unfiltered task decomposition. |
| **Models** | `deepseek-r1-671b` | Analyst Agent: Reasoning-focused synthesis of competitive data. |
| **Blockchain** | Base Mainnet (8453) | Smart contracts, USDC tokens, and transaction settlements. |
| **Database** | SQLite (`better-sqlite3`) | Persistent storage of sessions, state, audit logs, and x402 payment hashes. |
| **Frontend** | Next.js 14 | Hybrid server-client framework hosting the wizard and dashboard. |

---

## Project Structure

This directory structure describes the entire workspace, mapping out files and subdirectories. Click the links below to open files directly.

* **[package.json](file:///d:/Sentinal/package.json)** — Node.js dependencies (Next.js, Viem, Better-SQLite3, OpenAI API client).
* **[sentinel.db](file:///d:/Sentinal/sentinel.db)** — SQLite local database for audit trail, feed cards, session state, and replay records.
* **[tests/](file:///d:/Sentinal/tests/)** — Workspace testing directories.
  * **[run-tests.mjs](file:///d:/Sentinal/tests/run-tests.mjs)** — Automated 41-module test suite.
* **[src/](file:///d:/Sentinal/src/)** — App codebase directory.
  * **[types.ts](file:///d:/Sentinal/src/types.ts)** — Shared TypeScript type interfaces.
  * **[agents/](file:///d:/Sentinal/src/agents/)** — Autonomous Agent logic files.
    * **[chief/](file:///d:/Sentinal/src/agents/chief/)** — Orchestrator module.
      * **[orchestrator.ts](file:///d:/Sentinal/src/agents/chief/orchestrator.ts)** — Tasks and query plan generator using `venice-uncensored-1.2`.
      * **[redelegate.ts](file:///d:/Sentinal/src/agents/chief/redelegate.ts)** — Budget redelegation logic (30% Scout, 60% Analyst, 10% CFO).
    * **[scout/](file:///d:/Sentinal/src/agents/scout/)** — Data scraper module.
      * **[agent.ts](file:///d:/Sentinal/src/agents/scout/agent.ts)** — RSS and live web search handlers.
      * **[x402Discovery.ts](file:///d:/Sentinal/src/agents/scout/x402Discovery.ts)** — x402 client handler. Sets the `X-PAYMENT` header.
    * **[analyst/](file:///d:/Sentinal/src/agents/analyst/)** — Synthesizer module.
      * **[synthesize.ts](file:///d:/Sentinal/src/agents/analyst/synthesize.ts)** — Privately digests scraped facts into clean reports via `deepseek-r1-671b`.
    * **[cfo/](file:///d:/Sentinal/src/agents/cfo/)** — Finance optimizer module.
      * **[optimizeCompute.ts](file:///d:/Sentinal/src/agents/cfo/optimizeCompute.ts)** — DIEM token staking logic checking Venice cost thresholds.
  * **[app/](file:///d:/Sentinal/src/app/)** — Next.js routing and styling.
    * **[page.tsx](file:///d:/Sentinal/src/app/page.tsx)** — Wallet connection and landing page.
    * **[layout.tsx](file:///d:/Sentinal/src/app/layout.tsx)** — Root styling layout injecting google display fonts.
    * **[globals.css](file:///d:/Sentinal/src/app/globals.css)** — Styling parameters.
    * **[setup/](file:///d:/Sentinal/src/app/setup/)** — Onboarding Wizard page.
      * **[page.tsx](file:///d:/Sentinal/src/app/setup/page.tsx)** — 3-step setup form (Brief -> Sources -> Budget).
    * **[dashboard/](file:///d:/Sentinal/src/app/dashboard/)** — Live Mission Control interface.
      * **[page.tsx](file:///d:/Sentinal/src/app/dashboard/page.tsx)** — 3-panel UI grid showing active statuses, cards, and events.
    * **[api/](file:///d:/Sentinal/src/app/api/)** — Backend server endpoints.
      * **[agents/start/route.ts](file:///d:/Sentinal/src/app/api/agents/start/route.ts)** — POST: Initializes Chief Agent and launches the workforce.
      * **[agents/revoke/route.ts](file:///d:/Sentinal/src/app/api/agents/revoke/route.ts)** — POST: Revokes ERC-7715 allowances and terminates agent sessions.
      * **[intelligence/route.ts](file:///d:/Sentinal/src/app/api/intelligence/route.ts)** — GET: SSE stream delivering card and audit log updates.
      * **[balance/route.ts](file:///d:/Sentinal/src/app/api/balance/route.ts)** — GET: Queries user USDC balance from the Base RPC node.
      * **[check-account/route.ts](file:///d:/Sentinal/src/app/api/check-account/route.ts)** — GET: Bytecode inspection routing.
      * **[webhooks/oneshot/route.ts](file:///d:/Sentinal/src/app/api/webhooks/oneshot/route.ts)** — POST: Webhook receiver processing Ed25519-signed 1Shot confirmations.
  * **[lib/](file:///d:/Sentinal/src/lib/)** — Library utilities.
    * **[metamask/](file:///d:/Sentinal/src/lib/metamask/)** — MetaMask Smart Accounts Kit wrappers.
      * **[accountUpgrade.ts](file:///d:/Sentinal/src/lib/metamask/accountUpgrade.ts)** — EIP-7702 detector utilities.
      * **[permissions.ts](file:///d:/Sentinal/src/lib/metamask/permissions.ts)** — ERC-7715 periodic allowance creators.
      * **[revoke.ts](file:///d:/Sentinal/src/lib/metamask/revoke.ts)** — Allowance revocation handlers.
    * **[oneshot/](file:///d:/Sentinal/src/lib/oneshot/)** — 1Shot API transaction relayers.
      * **[relayer.ts](file:///d:/Sentinal/src/lib/oneshot/relayer.ts)** — Encodes JSON-RPC queries.
      * **[submit.ts](file:///d:/Sentinal/src/lib/oneshot/submit.ts)** — Bundle compiler helper functions.
      * **[verification.ts](file:///d:/Sentinal/src/lib/oneshot/verification.ts)** — Dual status listener matching webhooks and RPC polling fallbacks.
    * **[venice/](file:///d:/Sentinal/src/lib/venice/)** — Venice AI connector wrappers.
      * **[client.ts](file:///d:/Sentinal/src/lib/venice/client.ts)** — Configures API endpoints and header arrays.
    * **[x402/](file:///d:/Sentinal/src/lib/x402/)** — x402 payment processor.
      * **[client.ts](file:///d:/Sentinal/src/lib/x402/client.ts)** — Payment header encoders.
      * **[replayProtection.ts](file:///d:/Sentinal/src/lib/x402/replayProtection.ts)** — SQLite insert guard validating unique hashes.
    * **[chain/](file:///d:/Sentinal/src/lib/chain/)** — Viem blockchain connectors.
      * **[client.ts](file:///d:/Sentinal/src/lib/chain/client.ts)** — Client initializers.
      * **[balance.ts](file:///d:/Sentinal/src/lib/chain/balance.ts)** — Reads wallet balances.
      * **[sessionKey.ts](file:///d:/Sentinal/src/lib/chain/sessionKey.ts)** — Temporary session key storage utilities.
      * **[transactions.ts](file:///d:/Sentinal/src/lib/chain/transactions.ts)** — On-chain calldata encoders for USDC transfers.
    * **[db/](file:///d:/Sentinal/src/lib/db/)** — Persistent database.
      * **[index.ts](file:///d:/Sentinal/src/lib/db/index.ts)** — Schema setup, query handlers, and data writers.
* **[sentinal/](file:///d:/Sentinal/sentinal/)** — Marketing website directory.
  * **[app/globals.css](file:///d:/Sentinal/sentinal/app/globals.css)** — Global styles for the Tailwind landing page.
  * **[components/features-section.tsx](file:///d:/Sentinal/sentinal/components/features-section.tsx)** — React UI elements for displaying project features.

---

## Live Deployment Address Registry

These endpoints and contracts are deployed on the **Base Mainnet (Chain ID: 8453)**:

| Component | Target Address / Endpoint | Version / Notes |
|---|---|---|
| **1Shot Relayer Gateway** | `https://relayer.1shotapi.com/relayer` | Production API Gateway |
| **Permissions Enforcer** | `0x15f8ed352fd940075ec3f7cedc773052f8af72d` | ERC-7715 Enforcer contract (v1.6.0) |
| **Smart Account Upgrade Prefix** | `0xef0100` | EIP-7702 delegation bytecode prefix |
| **USDC Token Contract** | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | USDC contract deployed on Base |

---

## Test Report

Run `npm test` to execute the automated test suite. The system contains 41 unit and integration tests checking all agent logic:

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

## Key Implementation Patterns

### 1. ERC-7710 Budget Delegation
Enforced cryptographically at the child delegation level:

```typescript
// Budget allocation is cryptographically enforced at the delegation level
const scoutContext   = deriveChildContext(rootCtx, 'scout',   weeklyBudget * 0.30);
const analystContext = deriveChildContext(rootCtx, 'analyst', weeklyBudget * 0.60);
const cfoContext     = deriveChildContext(rootCtx, 'cfo',     weeklyBudget * 0.10);
// Each child context is signed and linked to the parent — it cannot exceed its budget cap.
```

### 2. x402 Micropayment Handshake
Autonomous buyer handshake routing when hitting a data paywall:

```typescript
const response = await fetch(endpoint);         // Cold hit — no hardcoded price
if (response.status === 402) {
  const { amount, token, recipient, chainId } = await response.json();
  const cost = Number(amount) / 1_000_000;      // Convert micro-USDC to USDC
  if (cost > remainingBudget) throw new Error('Over budget');
  if (cost > 0.10) throw new Error('Per-query safety limit exceeded');
  const paidResponse = await fetch(endpoint, {
    headers: { 'X-PAYMENT': paymentHeader },     // ERC-7710 delegation-backed payment header
  });
}
```

### 3. SQLite Replay Protection
Prevents replay attacks across restarts by recording hashes in SQLite:

```typescript
const inserted = await db.run(
  `INSERT OR IGNORE INTO processed_payments (hash, processed_at) VALUES (?, ?)`,
  [paymentHash, new Date().toISOString()]
);
if (inserted.changes === 0) throw new Error('Payment already processed');
// ↑ Database-backed: survives PM2 restarts unlike in-memory Sets
```

---

*SENTINEL — Built for MetaMask Smart Accounts Kit × 1Shot API × Venice AI Dev Cook-Off*  
*Hackathon Deadline: June 15, 2026*

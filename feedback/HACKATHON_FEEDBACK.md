# Hackathon Feedback — MetaMask Smart Accounts Kit × 1Shot API × Venice AI Dev Cook-Off

**From:** the team behind SENTINEL
**Category:** Agentic / On-chain AI
**Date:** June 2026

---

## How it went, overall

Building SENTINEL this weekend was honestly one of the more fun and frustrating hackathons we've done in a while — in a good way. Stitching together MetaMask Smart Accounts Kit, 1Shot API, and Venice AI is a legitimately ambitious combo, and you can tell the organizers thought hard about how these three pieces are supposed to fit together. But we hit enough friction along the way that we wanted to write it all down, partly to vent and partly because we think a few small doc fixes would save the next batch of teams a lot of late nights.

None of this is meant as a complaint. We'd do this hackathon again. We just think the gap between "what's possible" and "what's easy to figure out at 2am" is bigger than it needs to be.

---

## MetaMask Smart Accounts Kit

**`wallet_grantPermissions` almost sank our demo.** This ERC-7715 method is the whole foundation of permissioned agent budgets — it's the thing that lets an agent spend within a cryptographically enforced allowance instead of just trusting an `if` statement. The problem is that it's not in standard MetaMask, and nothing in the docs tells you that up front. We found out the hard way, mid-build, when the call threw "Method does not exist" and we spent a confused hour assuming we'd written buggy code before realizing it was a version issue, not a logic issue. The docs never say which MetaMask build ships this, whether you need Flask (the experimental build) versus production, what the actual semver requirement is, or how to check support before you start coding against it.

A "Prerequisites" callout at the very top of the SAK docs would fix this in five minutes. Even just a one-liner like:

```js
// Check SAK support before you build against it
const isSupported =
  typeof window.ethereum?.request === "function" &&
  !!(await window.ethereum
    .request({ method: "wallet_getCapabilities" })
    .catch(() => null));
console.log("SAK supported:", isSupported);
```

We'd guess this single check has cost teams more combined hours than any other gap in the docs.

**ERC-7710 sub-delegation has no working example anywhere.** This is the standard for carving out sub-budgets for child agents — exactly what we needed for our Chief agent to hand smaller allowances to its Scout, Analyst, and CFO sub-agents. The EIP spec is linked from the docs, but a raw EIP is not implementation guidance. We ended up reading the `delegation-framework` contracts directly on GitHub and reverse-engineering the delegation struct from test files. That took the better part of two days. With even one runnable example showing the full chain — grant a root permission, slice off a sub-delegation, submit it through 1Shot — this would've been a two-hour problem instead.

**The EIP-7702 "gasless" upgrade flow leaves a few things unclear.** The docs say the account upgrade is gasless thanks to 1Shot sponsorship, which is great, but they don't say whether the relayer needs to be pre-funded by the developer or comes with some free demo quota, what the actual 1Shot endpoint and request body look like for sponsoring this specific transaction type, or what happens if you accidentally try to upgrade an account that's already been upgraded. A short, concrete quickstart with real Base Sepolia addresses in both the SAK and 1Shot docs would clear all three of these up fast.

---

## 1Shot API

**Webhook signature verification took way longer than it should have.** 1Shot signs webhooks with Ed25519 and serves the public key over a JWKS endpoint, which is a solid design — but the docs mention signatures exist without explaining the key rotation policy, whether the `x-signature` header is always present or only shows up once the relayer is fully configured, or what byte encoding the signature actually uses. We built proper JWKS-based verification with `crypto.subtle.verify`, plus a polling fallback in case the webhook never arrives, but getting there meant pulling the raw JWKS response and just trying encodings until one worked. A complete code sample would've turned this into a thirty-minute task:

```ts
// Full webhook verification, start to finish
const JWKS_URL = "https://relayer.1shotapi.com/jwks.json";

async function verifyWebhook(
  body: string,
  signature: string,
): Promise<boolean> {
  const { keys } = await fetch(JWKS_URL).then((r) => r.json());
  const edKey = keys.find((k: any) => k.kty === "OKP" && k.crv === "Ed25519");
  const publicKey = await crypto.subtle.importKey(
    "jwk",
    edKey,
    { name: "Ed25519" },
    false,
    ["verify"],
  );
  const sigBytes = Buffer.from(signature, "base64");
  return crypto.subtle.verify(
    "Ed25519",
    publicKey,
    sigBytes,
    new TextEncoder().encode(body),
  );
}
```

**The transaction status states are never spelled out.** We saw `Pending`, `Submitted`, `Confirmed`, and `Failed` come back from the relayer, but nothing documents the full list, whether `Submitted` always leads to `Confirmed` or can also fail outright, or roughly how long that should take on Base Sepolia. We needed this to know when our polling fallback should give up, and ended up guessing at backoff timings through trial and error. A simple state diagram plus a typical latency figure (ours landed around 5–15 seconds under normal load) would make this a non-issue.

**`ONESHOT_WEBHOOK_PUBLIC_KEY` shows up in example code with zero context.** We genuinely couldn't tell if this was meant to replace the JWKS auto-fetch, where you'd even get the value from, or whether it's the same key the JWKS endpoint serves. One sentence in the `.env.example` template would close this gap entirely — something like noting it's optional, only needed if outbound HTTPS to 1Shot is blocked in your environment, and otherwise safe to leave blank.

---

## Venice AI

**We had no way to compare models without just testing all of them ourselves.** Venice offers several models, but there's no capability matrix anywhere covering context window size, structured JSON output support, speed-versus-quality tradeoffs, or pricing. We landed on `venice-uncensored-1.2` for our orchestrator and `deepseek-r1` for deeper synthesis, but only after burning real time on manual comparisons that a simple table would've replaced instantly:

| Model                   | Context | JSON Mode | Speed  | Best For                      |
| ----------------------- | ------- | --------- | ------ | ----------------------------- |
| `venice-uncensored-1.2` | 128K    | Yes       | Fast   | Orchestration, classification |
| `deepseek-r1-671b`      | 64K     | Yes       | Slower | Deep reasoning, synthesis     |
| `llama-3.3-70b`         | 128K    | Yes       | Fast   | General tasks                 |

**x402 has no sandbox, so testing the payment flow means spending real money.** The HTTP-402-then-pay-then-retry flow is a neat idea, but right now you can only exercise it with actual on-chain USDC. That means every test costs real funds and there's no realistic way to wire this into CI. Even a lightweight mock server that fakes the 402 responses and accepts dummy payment headers locally would make this dramatically easier to build and test against.

---

## A couple of process notes

The live-demo requirement and the experimental SAK status don't play well together. `wallet_grantPermissions` needs a Flask build that most judges almost certainly won't have installed, which means projects doing the most ambitious thing with SAK risk looking "broken" next to simpler projects that just avoided the feature. We added an Observer Mode banner to our UI specifically to work around this, but we suspect a lot of teams won't think to do that and will get judged unfairly for it. Either giving judges a pre-configured Flask profile, or building some kind of "Observer Mode" credit into the rubric, would go a long way.

Also, a few documentation links pointed to inconsistent base URLs — `relayer.1shotapi.com` versus `relayer.1shotapi.dev` being the main one that tripped us up. A single canonical-endpoints reference pinned in the hackathon portal would prevent that kind of confusion:

```
1Shot Relayer (Sepolia):  https://relayer.1shotapi.dev/relayers
1Shot JWKS:               https://relayer.1shotapi.com/jwks.json
Venice API:               https://api.venice.ai/api/v1
Base Sepolia RPC:         https://sepolia.base.org
Base Sepolia Explorer:    https://sepolia.basescan.org
```

---

## What we actually loved

It's worth saying clearly: the stack itself is genuinely novel, and we don't say that lightly after sitting through a lot of "ChatGPT wrapper" hackathons. Permissioned budgets enforced by ERC-7715 mean you can't just patch around a limit with an `if` statement — the chain itself stops you. Venice's no-logging design means privacy is something you architect for, not a checkbox. And gasless onboarding via 1Shot genuinely changes what the first five minutes of using an agent-powered app can feel like, since users never need to think about ETH at all.

The vision here is ahead of the tooling, which is a good problem to have. Every fix we've described above feels like it fits in a single sprint, and we think it would meaningfully raise the bar for whatever comes out of the next version of this hackathon.

---

## Quick summary table

| #   | Area         | What we'd fix                                               | Effort |
| --- | ------------ | ----------------------------------------------------------- | ------ |
| 1   | MetaMask SAK | Prerequisites banner + a capability-check snippet           | Low    |
| 2   | MetaMask SAK | A real `budget-delegation.ts` example for ERC-7710          | Medium |
| 3   | MetaMask SAK | Clear EIP-7702 + 1Shot gasless upgrade quickstart           | Low    |
| 4   | 1Shot API    | Full webhook verification code recipe                       | Low    |
| 5   | 1Shot API    | Document the transaction status state machine + latency     | Low    |
| 6   | 1Shot API    | One sentence of context on `ONESHOT_WEBHOOK_PUBLIC_KEY`     | Low    |
| 7   | Venice AI    | Model capability matrix (context, JSON mode, speed, price)  | Low    |
| 8   | Venice AI    | x402 mock server for local dev/CI                           | Medium |
| 9   | Process      | Judge-ready MetaMask Flask profile, or Observer Mode credit | Medium |
| 10  | Process      | One pinned canonical-endpoints reference                    | Low    |

---

Thanks for putting together a hackathon that asked for real engineering instead of prompt-engineering theater. We hit our heads on a few walls, but we'd rather hit our heads on something this ambitious than coast through something easy.

_— Team SENTINEL_

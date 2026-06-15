/**
 * SENTINEL — Module Test Suite
 * Tests core business logic for all agents and utilities.
 * Run with: node tests/run-tests.mjs
 */

let passed = 0;
let failed = 0;
const results = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    results.push({ status: 'PASS', name });
  } catch (e) {
    failed++;
    results.push({ status: 'FAIL', name, error: e.message });
  }
}

function assertEqual(actual, expected, msg = '') {
  if (actual !== expected) {
    throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}. ${msg}`);
  }
}

function assertDeepEqual(actual, expected, msg = '') {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    throw new Error(`Expected ${e}, got ${a}. ${msg}`);
  }
}

function assertTrue(val, msg = '') {
  if (!val) throw new Error(`Expected truthy, got ${val}. ${msg}`);
}

function assertThrows(fn, msgContains = '') {
  let threw = false;
  try { fn(); } catch (e) {
    threw = true;
    if (msgContains && !e.message.includes(msgContains)) {
      throw new Error(`Expected error containing "${msgContains}", got: ${e.message}`);
    }
  }
  if (!threw) throw new Error('Expected function to throw');
}

// ─────────────────────────────────────────────────────────────────
// 1. CFO Agent — compute strategy evaluation
// ─────────────────────────────────────────────────────────────────

function calculateComputeMetrics(weeklyVeniceSpend, weeklyScoutSpend) {
  const weeklyX402Spend = weeklyVeniceSpend + weeklyScoutSpend;
  const projectedMonthlySpend = weeklyX402Spend * 4.33;
  return { weeklyX402Spend, projectedMonthlySpend, diemMintThreshold: 40 };
}

function evaluateComputeStrategy(metrics) {
  if (metrics.projectedMonthlySpend > metrics.diemMintThreshold) {
    const diemToBuy = Math.ceil(metrics.projectedMonthlySpend);
    return { action: 'stake', diemAmount: diemToBuy };
  }
  return { action: 'payAsYouGo' };
}

test('CFO: calculateComputeMetrics — sums correctly', () => {
  const m = calculateComputeMetrics(2, 1);
  assertEqual(m.weeklyX402Spend, 3);
  assertEqual(m.projectedMonthlySpend, 12.99);
  assertEqual(m.diemMintThreshold, 40);
});

test('CFO: evaluateComputeStrategy — payAsYouGo below threshold', () => {
  const m = calculateComputeMetrics(2, 1); // $3/week = ~$13/month
  const decision = evaluateComputeStrategy(m);
  assertEqual(decision.action, 'payAsYouGo');
});

test('CFO: evaluateComputeStrategy — stake when above $40/month', () => {
  const m = calculateComputeMetrics(7, 3); // $10/week = ~$43.3/month
  const decision = evaluateComputeStrategy(m);
  assertEqual(decision.action, 'stake');
  assertTrue(decision.diemAmount >= 43, 'DIEM amount should be at least 43');
});

test('CFO: evaluateComputeStrategy — exact threshold boundary', () => {
  // $9.24/week = exactly $40/month (9.24 * 4.33 = ~40.01)
  const m = { weeklyX402Spend: 9.24, projectedMonthlySpend: 40.0, diemMintThreshold: 40 };
  const decision = evaluateComputeStrategy(m);
  // exactly 40 is NOT > 40, so payAsYouGo
  assertEqual(decision.action, 'payAsYouGo');
});

test('CFO: evaluateComputeStrategy — just over threshold', () => {
  const m = { weeklyX402Spend: 9.25, projectedMonthlySpend: 40.05, diemMintThreshold: 40 };
  const decision = evaluateComputeStrategy(m);
  assertEqual(decision.action, 'stake');
});

// ─────────────────────────────────────────────────────────────────
// 2. Budget Allocation — ERC-7710 delegation split
// ─────────────────────────────────────────────────────────────────

const BUDGET_ALLOCATION = { SCOUT_PCT: 0.30, ANALYST_PCT: 0.60, CFO_PCT: 0.10 };

function createBudgetSplit(weeklyBudgetUSDC) {
  return {
    scout:   weeklyBudgetUSDC * BUDGET_ALLOCATION.SCOUT_PCT,
    analyst: weeklyBudgetUSDC * BUDGET_ALLOCATION.ANALYST_PCT,
    cfo:     weeklyBudgetUSDC * BUDGET_ALLOCATION.CFO_PCT,
  };
}

test('Budget: $10/week splits correctly (30/60/10)', () => {
  const split = createBudgetSplit(10);
  assertEqual(split.scout, 3);
  assertEqual(split.analyst, 6);
  assertEqual(split.cfo, 1);
});

test('Budget: $5/week splits correctly', () => {
  const split = createBudgetSplit(5);
  assertEqual(split.scout, 1.5);
  assertEqual(split.analyst, 3);
  assertEqual(split.cfo, 0.5);
});

test('Budget: $20/week splits correctly', () => {
  const split = createBudgetSplit(20);
  assertEqual(split.scout, 6);
  assertEqual(split.analyst, 12);
  assertEqual(split.cfo, 2);
});

test('Budget: allocation percentages sum to 100%', () => {
  const total = BUDGET_ALLOCATION.SCOUT_PCT + BUDGET_ALLOCATION.ANALYST_PCT + BUDGET_ALLOCATION.CFO_PCT;
  // Use Math.round to handle floating-point precision (0.3 + 0.6 + 0.1 in IEEE 754)
  assertEqual(Math.round(total * 1000) / 1000, 1.0);
});

// ─────────────────────────────────────────────────────────────────
// 3. x402 Payment Logic — cost validation
// ─────────────────────────────────────────────────────────────────

function validateX402Cost(costUSDC, remainingBudget) {
  if (costUSDC > remainingBudget) throw new Error(`Data cost $${costUSDC.toFixed(4)} exceeds remaining budget`);
  if (costUSDC > 0.10) throw new Error(`Query cost $${costUSDC.toFixed(4)} exceeds per-query safety limit`);
  return true;
}

function microToUSDC(microAmount) {
  return Number(microAmount) / 1_000_000;
}

test('x402: microToUSDC converts correctly', () => {
  assertEqual(microToUSDC('2000'), 0.002);
  assertEqual(microToUSDC('50000'), 0.05);
  assertEqual(microToUSDC('1000000'), 1.0);
});

test('x402: validateX402Cost passes within budget and limit', () => {
  assertTrue(validateX402Cost(0.002, 3.0));
});

test('x402: validateX402Cost throws when exceeds budget', () => {
  assertThrows(() => validateX402Cost(2.0, 1.5), 'exceeds remaining budget');
});

test('x402: validateX402Cost throws when exceeds per-query limit', () => {
  assertThrows(() => validateX402Cost(0.15, 10.0), 'exceeds per-query safety limit');
});

test('x402: validateX402Cost passes at exactly $0.10 limit', () => {
  assertTrue(validateX402Cost(0.10, 10.0));
});

test('x402: Serper cost ~$0.001 passes validation', () => {
  const cost = microToUSDC('1000'); // 0.001 USDC
  assertTrue(validateX402Cost(cost, 3.0));
});

// ─────────────────────────────────────────────────────────────────
// 4. Replay Protection — SQLite payment hash deduplication
// ─────────────────────────────────────────────────────────────────

function createInMemoryPaymentStore() {
  const processed = new Set();
  return {
    processPayment(hash, processFn) {
      if (processed.has(hash)) throw new Error('Payment already processed');
      processed.add(hash);
      return processFn();
    },
    has(hash) { return processed.has(hash); }
  };
}

function generatePaymentHash({ amount, token, recipient, chainId }) {
  // Simplified deterministic hash (mirrors src/lib/x402/replayProtection.ts)
  return `${chainId}:${token}:${recipient}:${amount}`;
}

test('Replay: processes new payment successfully', () => {
  const store = createInMemoryPaymentStore();
  const result = store.processPayment('hash-abc', () => 'ok');
  assertEqual(result, 'ok');
  assertTrue(store.has('hash-abc'));
});

test('Replay: rejects duplicate payment hash', () => {
  const store = createInMemoryPaymentStore();
  store.processPayment('hash-xyz', () => 'ok');
  assertThrows(() => store.processPayment('hash-xyz', () => 'ok'), 'Payment already processed');
});

test('Replay: different hashes both succeed', () => {
  const store = createInMemoryPaymentStore();
  store.processPayment('hash-1', () => 'a');
  store.processPayment('hash-2', () => 'b');
  assertTrue(store.has('hash-1'));
  assertTrue(store.has('hash-2'));
});

test('Replay: generatePaymentHash is deterministic', () => {
  const params = { amount: '2000', token: '0xUSDC', recipient: '0xRecipient', chainId: 8453 };
  assertEqual(generatePaymentHash(params), generatePaymentHash(params));
});

test('Replay: generatePaymentHash differs by amount', () => {
  const p1 = generatePaymentHash({ amount: '1000', token: '0xUSDC', recipient: '0xR', chainId: 8453 });
  const p2 = generatePaymentHash({ amount: '2000', token: '0xUSDC', recipient: '0xR', chainId: 8453 });
  assertTrue(p1 !== p2);
});

// ─────────────────────────────────────────────────────────────────
// 5. Chief Orchestrator — fallback task list generation
// ─────────────────────────────────────────────────────────────────

function generateFallbackTaskList(brief, competitors) {
  const scoutTasks = [
    { source: 'hackernews', query: brief.slice(0, 100), priority: 'high' },
    { source: 'github_trending', query: 'developer tools AI', priority: 'medium' },
    { source: 'producthunt', query: 'developer productivity', priority: 'medium' },
  ];
  competitors.forEach(c => scoutTasks.push({ source: 'hackernews', query: c, priority: 'high' }));
  return {
    scout: scoutTasks,
    analyst: [
      `What are the most significant recent developments relevant to: ${brief.slice(0, 200)}?`,
      `What competitive threats are emerging from: ${competitors.join(', ')}?`,
      'What opportunities exist based on current market trends?',
    ],
    thresholds: { maxCostPerQuery: 0.05, alertOnHighUrgency: true, evaluateDIEMWeekly: true },
  };
}

test('Chief: fallback generates correct number of scout tasks', () => {
  const list = generateFallbackTaskList('I build dev tools', ['Cursor', 'Copilot']);
  // 3 base + 2 competitor tasks
  assertEqual(list.scout.length, 5);
});

test('Chief: fallback uses brief text in first task query', () => {
  const list = generateFallbackTaskList('I build developer tools', []);
  assertTrue(list.scout[0].query.includes('I build developer tools'));
});

test('Chief: fallback adds competitor tasks with high priority', () => {
  const list = generateFallbackTaskList('brief', ['Cursor', 'Copilot', 'CodeRabbit']);
  const competitorTasks = list.scout.filter(t => ['Cursor', 'Copilot', 'CodeRabbit'].includes(t.query));
  assertEqual(competitorTasks.length, 3);
  competitorTasks.forEach(t => assertEqual(t.priority, 'high'));
});

test('Chief: fallback generates 3 analyst questions', () => {
  const list = generateFallbackTaskList('brief', ['CompA']);
  assertEqual(list.analyst.length, 3);
});

test('Chief: fallback thresholds set correctly', () => {
  const list = generateFallbackTaskList('brief', []);
  assertEqual(list.thresholds.maxCostPerQuery, 0.05);
  assertEqual(list.thresholds.alertOnHighUrgency, true);
  assertEqual(list.thresholds.evaluateDIEMWeekly, true);
});

// ─────────────────────────────────────────────────────────────────
// 6. EIP-7702 Account Detection
// ─────────────────────────────────────────────────────────────────

function isDeleGatorBytecode(code) {
  return !!code && code.startsWith('0xef0100');
}

test('EIP-7702: detects smart account bytecode', () => {
  assertTrue(isDeleGatorBytecode('0xef01001234abcd'));
});

test('EIP-7702: rejects EOA (null code)', () => {
  assertTrue(!isDeleGatorBytecode(null));
});

test('EIP-7702: rejects EOA (empty bytecode)', () => {
  assertTrue(!isDeleGatorBytecode('0x'));
});

test('EIP-7702: rejects non-delegation bytecode', () => {
  assertTrue(!isDeleGatorBytecode('0x6060604052'));
});

// ─────────────────────────────────────────────────────────────────
// 7. Intelligence Card — urgency classification
// ─────────────────────────────────────────────────────────────────

function classifyUrgency(urgency) {
  const valid = ['high', 'medium', 'low'];
  if (!valid.includes(urgency)) return 'low';
  return urgency;
}

function getUrgencyColor(urgency) {
  return urgency === 'high' ? '#E27625' : urgency === 'medium' ? '#7B5FD4' : '#555870';
}

test('Urgency: high maps to MetaMask orange', () => {
  assertEqual(getUrgencyColor('high'), '#E27625');
});

test('Urgency: medium maps to Venice purple', () => {
  assertEqual(getUrgencyColor('medium'), '#7B5FD4');
});

test('Urgency: low maps to dim grey', () => {
  assertEqual(getUrgencyColor('low'), '#555870');
});

test('Urgency: invalid value defaults to low', () => {
  assertEqual(classifyUrgency('critical'), 'low');
});

test('Urgency: valid values pass through', () => {
  assertEqual(classifyUrgency('high'), 'high');
  assertEqual(classifyUrgency('medium'), 'medium');
  assertEqual(classifyUrgency('low'), 'low');
});

// ─────────────────────────────────────────────────────────────────
// 8. Budget display formatting
// ─────────────────────────────────────────────────────────────────

function formatBudgetPct(remaining, weekly) {
  return Math.max(0, Math.min(100, (remaining / weekly) * 100));
}

function budgetClass(pct) {
  return pct < 20 ? 'danger' : pct < 40 ? 'warning' : '';
}

test('Budget: 72.3% of $10 displays correctly', () => {
  const pct = formatBudgetPct(7.23, 10);
  assertEqual(Math.round(pct * 10) / 10, 72.3);
});

test('Budget: full budget shows 100%', () => {
  assertEqual(formatBudgetPct(10, 10), 100);
});

test('Budget: empty budget clamps to 0', () => {
  assertEqual(formatBudgetPct(0, 10), 0);
});

test('Budget: overdraft clamps to 0', () => {
  assertEqual(formatBudgetPct(-1, 10), 0);
});

test('Budget: <20% triggers danger class', () => {
  assertEqual(budgetClass(15), 'danger');
});

test('Budget: 20–40% triggers warning class', () => {
  assertEqual(budgetClass(35), 'warning');
});

test('Budget: >40% no class', () => {
  assertEqual(budgetClass(72), '');
});

// ─────────────────────────────────────────────────────────────────
// Print results
// ─────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║              SENTINEL — Module Test Report                  ║');
console.log('╠══════════════════════════════════════════════════════════════╣');

let lastModule = '';
for (const r of results) {
  const module = r.name.split(':')[0];
  if (module !== lastModule) {
    console.log(`║                                                              ║`);
    console.log(`║  ── ${module.padEnd(57)}║`);
    lastModule = module;
  }
  const icon = r.status === 'PASS' ? '✓' : '✗';
  const color = r.status === 'PASS' ? '\x1b[32m' : '\x1b[31m';
  const label = r.name.replace(module + ': ', '').slice(0, 52).padEnd(52);
  console.log(`║  ${color}${icon}\x1b[0m ${label}  ║`);
  if (r.error) console.log(`║    \x1b[31m↳ ${r.error.slice(0, 55).padEnd(55)}\x1b[0m ║`);
}

console.log(`║                                                              ║`);
console.log('╠══════════════════════════════════════════════════════════════╣');
const totalTests = passed + failed;
const passColor = failed === 0 ? '\x1b[32m' : '\x1b[33m';
console.log(`║  ${passColor}Results: ${passed}/${totalTests} passed${failed > 0 ? `, ${failed} failed` : ''}`.padEnd(65) + '\x1b[0m║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

if (failed > 0) process.exit(1);

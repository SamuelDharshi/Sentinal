// src/lib/db/index.ts
// SQLite database layer via better-sqlite3 (local dev)
// Automatic in-memory fallback for Vercel serverless (no native addons)
// All exported function signatures are identical — callers are unaffected.

import path from 'path';

// ─── DB Mode Detection ───────────────────────────────────────────────────────

type SqliteDb = import('better-sqlite3').Database;
let _sqliteDb: SqliteDb | null = null;
let _useMemory = false;

function getSqliteDb(): SqliteDb | null {
  if (_sqliteDb) return _sqliteDb;
  if (_useMemory) return null;

  try {
    // Dynamic require — avoids bundler errors on Vercel
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Database = require('better-sqlite3');
    const DB_PATH = process.env.DATABASE_URL
      ? path.resolve(process.env.DATABASE_URL)
      : path.resolve('./sentinel.db');

    _sqliteDb = new Database(DB_PATH, { verbose: undefined }) as SqliteDb;
    _sqliteDb.pragma('journal_mode = WAL');
    _sqliteDb.pragma('foreign_keys = ON');
    initSchema(_sqliteDb);
    return _sqliteDb;
  } catch (e) {
    console.warn('[DB] better-sqlite3 unavailable — using in-memory store:', (e as Error).message);
    _useMemory = true;
    initMemory();
    return null;
  }
}

// ─── In-Memory Store ─────────────────────────────────────────────────────────

interface MemCard {
  id: string; headline: string; summary: string; urgency: string;
  action_suggested: string; source_count: number; sources: string;
  delegation_trace: string; total_cost: number; brief: string;
  created_at: string;
}
interface MemAudit {
  id: string; timestamp: string; agent: string; action: string;
  detail: string; cost: number; tx_hash: string | null; confirmed: number;
}
interface MemPayment {
  hash: string; amount: number; recipient: string; endpoint: string; processed_at: string;
}
interface MemSession {
  id: string; brief: string; competitors: string; sources: string;
  weekly_budget_usdc: number; user_address: string; permission_context: string | null;
  status: string; created_at: string; updated_at: string;
}
interface MemAgent {
  agent_id: string; status: string; current_action: string | null;
  remaining_budget: number; weekly_budget: number; last_seen: string;
}

const mem = {
  cards:    new Map<string, MemCard>(),
  audit:    new Map<string, MemAudit>(),
  payments: new Map<string, MemPayment>(),
  sessions: new Map<string, MemSession>(),
  agents:   new Map<string, MemAgent>(),
};

function initMemory() {
  for (const id of ['chief', 'scout', 'analyst', 'cfo']) {
    mem.agents.set(id, {
      agent_id: id, status: 'idle', current_action: null,
      remaining_budget: 0, weekly_budget: 0,
      last_seen: new Date().toISOString(),
    });
  }
}

function now() { return new Date().toISOString(); }

// ─── Schema (SQLite only) ────────────────────────────────────────────────────

function initSchema(db: SqliteDb): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS intelligence_cards (
      id TEXT PRIMARY KEY,
      headline TEXT NOT NULL,
      summary TEXT NOT NULL,
      urgency TEXT NOT NULL CHECK(urgency IN ('low','medium','high')),
      action_suggested TEXT,
      source_count INTEGER DEFAULT 0,
      sources TEXT DEFAULT '[]',
      delegation_trace TEXT DEFAULT '[]',
      total_cost REAL DEFAULT 0,
      brief TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      agent TEXT NOT NULL,
      action TEXT NOT NULL,
      detail TEXT,
      cost REAL DEFAULT 0,
      tx_hash TEXT,
      confirmed INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS processed_payments (
      hash TEXT PRIMARY KEY,
      processed_at TEXT NOT NULL DEFAULT (datetime('now')),
      amount REAL,
      recipient TEXT,
      endpoint TEXT
    );

    CREATE TABLE IF NOT EXISTS agent_sessions (
      id TEXT PRIMARY KEY,
      brief TEXT NOT NULL,
      competitors TEXT DEFAULT '[]',
      sources TEXT DEFAULT '[]',
      weekly_budget_usdc REAL NOT NULL,
      user_address TEXT NOT NULL,
      permission_context TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active','killed','completed')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS agent_state (
      agent_id TEXT PRIMARY KEY,
      status TEXT DEFAULT 'idle',
      current_action TEXT,
      remaining_budget REAL DEFAULT 0,
      weekly_budget REAL DEFAULT 0,
      last_seen TEXT
    );

    INSERT OR IGNORE INTO agent_state (agent_id, status) VALUES
      ('chief', 'idle'),
      ('scout', 'idle'),
      ('analyst', 'idle'),
      ('cfo', 'idle');
  `);
}

// ─── Intelligence Cards ──────────────────────────────────────────────────────

export function insertCard(card: {
  id: string;
  headline: string;
  summary: string;
  urgency: string;
  actionSuggested: string;
  sources: object[];
  delegationTrace: object[];
  totalCost: number;
  brief: string;
}): void {
  const db = getSqliteDb();
  if (db) {
    db.prepare(`
      INSERT OR REPLACE INTO intelligence_cards
      (id, headline, summary, urgency, action_suggested, source_count, sources, delegation_trace, total_cost, brief)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      card.id, card.headline, card.summary, card.urgency, card.actionSuggested,
      card.sources.length, JSON.stringify(card.sources),
      JSON.stringify(card.delegationTrace), card.totalCost, card.brief
    );
  } else {
    mem.cards.set(card.id, {
      id: card.id, headline: card.headline, summary: card.summary,
      urgency: card.urgency, action_suggested: card.actionSuggested,
      source_count: card.sources.length, sources: JSON.stringify(card.sources),
      delegation_trace: JSON.stringify(card.delegationTrace),
      total_cost: card.totalCost, brief: card.brief, created_at: now(),
    });
  }
}

export function getCards(limit = 20, offset = 0): unknown[] {
  const db = getSqliteDb();
  if (db) {
    const rows = db.prepare(`
      SELECT * FROM intelligence_cards ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(limit, offset);
    return rows.map(parseCard);
  }
  return [...mem.cards.values()]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(offset, offset + limit)
    .map(parseCard);
}

function parseCard(row: unknown): unknown {
  const r = row as Record<string, unknown>;
  return {
    ...r,
    sources: JSON.parse(r.sources as string || '[]'),
    delegationTrace: JSON.parse(r.delegation_trace as string || '[]'),
    createdAt: r.created_at,
    actionSuggested: r.action_suggested,
    sourceCount: r.source_count,
    totalCost: r.total_cost,
  };
}

// ─── Audit Log ───────────────────────────────────────────────────────────────

export function insertAuditEvent(event: {
  id: string;
  agent: string;
  action: string;
  detail?: string;
  cost?: number;
  txHash?: string;
  confirmed?: boolean;
}): void {
  const db = getSqliteDb();
  if (db) {
    db.prepare(`
      INSERT INTO audit_log (id, agent, action, detail, cost, tx_hash, confirmed)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      event.id, event.agent, event.action, event.detail || '',
      event.cost || 0, event.txHash || null, event.confirmed ? 1 : 0
    );
  } else {
    mem.audit.set(event.id, {
      id: event.id, timestamp: now(), agent: event.agent, action: event.action,
      detail: event.detail || '', cost: event.cost || 0,
      tx_hash: event.txHash || null, confirmed: event.confirmed ? 1 : 0,
    });
  }
}

export function getAuditEvents(limit = 50): unknown[] {
  const db = getSqliteDb();
  if (db) {
    return db.prepare('SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT ?').all(limit);
  }
  return [...mem.audit.values()]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, limit);
}

// ─── Replay Protection ───────────────────────────────────────────────────────

export async function processPayment<T>(
  paymentHash: string,
  amount: number,
  recipient: string,
  endpoint: string,
  processFn: () => Promise<T>
): Promise<T> {
  const db = getSqliteDb();
  if (db) {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO processed_payments (hash, amount, recipient, endpoint)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(paymentHash, amount, recipient, endpoint);
    if (result.changes === 0) {
      console.warn(`[x402.replay_attempt] Hash ${paymentHash} already processed`);
      throw new Error('Payment already processed — replay attack prevented');
    }
  } else {
    if (mem.payments.has(paymentHash)) {
      console.warn(`[x402.replay_attempt] Hash ${paymentHash} already processed (memory)`);
      throw new Error('Payment already processed — replay attack prevented');
    }
    mem.payments.set(paymentHash, { hash: paymentHash, amount, recipient, endpoint, processed_at: now() });
  }
  return processFn();
}

// ─── Agent State ─────────────────────────────────────────────────────────────

export function updateAgentState(
  agentId: string,
  update: {
    status?: string;
    currentAction?: string | null;
    remainingBudget?: number;
    weeklyBudget?: number;
  }
): void {
  const db = getSqliteDb();
  if (db) {
    const parts: string[] = ["last_seen = datetime('now')"];
    const values: unknown[] = [];
    if (update.status !== undefined)         { parts.push('status = ?');           values.push(update.status); }
    if (update.currentAction !== undefined)  { parts.push('current_action = ?');   values.push(update.currentAction); }
    if (update.remainingBudget !== undefined){ parts.push('remaining_budget = ?'); values.push(update.remainingBudget); }
    if (update.weeklyBudget !== undefined)   { parts.push('weekly_budget = ?');    values.push(update.weeklyBudget); }
    values.push(agentId);
    db.prepare(`UPDATE agent_state SET ${parts.join(', ')} WHERE agent_id = ?`).run(...values);
  } else {
    const existing = mem.agents.get(agentId) || {
      agent_id: agentId, status: 'idle', current_action: null,
      remaining_budget: 0, weekly_budget: 0, last_seen: now(),
    };
    mem.agents.set(agentId, {
      ...existing,
      last_seen: now(),
      ...(update.status !== undefined         && { status: update.status }),
      ...(update.currentAction !== undefined  && { current_action: update.currentAction }),
      ...(update.remainingBudget !== undefined && { remaining_budget: update.remainingBudget }),
      ...(update.weeklyBudget !== undefined   && { weekly_budget: update.weeklyBudget }),
    });
  }
}

export function getAgentStates(): unknown[] {
  const db = getSqliteDb();
  if (db) return db.prepare('SELECT * FROM agent_state').all();
  return [...mem.agents.values()];
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export function createSession(session: {
  id: string;
  brief: string;
  competitors: string[];
  sources: string[];
  weeklyBudgetUsdc: number;
  userAddress: string;
  permissionContext?: unknown;
}): void {
  const db = getSqliteDb();
  const permCtx = session.permissionContext ? JSON.stringify(session.permissionContext) : null;
  if (db) {
    db.prepare(`
      INSERT INTO agent_sessions
      (id, brief, competitors, sources, weekly_budget_usdc, user_address, permission_context)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      session.id, session.brief,
      JSON.stringify(session.competitors), JSON.stringify(session.sources),
      session.weeklyBudgetUsdc, session.userAddress, permCtx
    );
  } else {
    mem.sessions.set(session.id, {
      id: session.id, brief: session.brief,
      competitors: JSON.stringify(session.competitors),
      sources: JSON.stringify(session.sources),
      weekly_budget_usdc: session.weeklyBudgetUsdc,
      user_address: session.userAddress,
      permission_context: permCtx,
      status: 'active', created_at: now(), updated_at: now(),
    });
  }
}

export function getActiveSession(): unknown {
  const db = getSqliteDb();
  if (db) {
    return db.prepare("SELECT * FROM agent_sessions WHERE status = ? ORDER BY created_at DESC LIMIT 1")
      .get('active');
  }
  return [...mem.sessions.values()]
    .filter(s => s.status === 'active')
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] || null;
}

export function killSession(sessionId: string): void {
  const db = getSqliteDb();
  if (db) {
    db.prepare("UPDATE agent_sessions SET status = ?, updated_at = datetime('now') WHERE id = ?")
      .run('killed', sessionId);
  } else {
    const s = mem.sessions.get(sessionId);
    if (s) mem.sessions.set(sessionId, { ...s, status: 'killed', updated_at: now() });
  }
}

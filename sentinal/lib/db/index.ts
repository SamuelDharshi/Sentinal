// src/lib/db/index.ts
// SQLite database layer via better-sqlite3
// Survives server restarts — critical for x402 replay protection

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DATABASE_URL
  ? path.resolve(process.env.DATABASE_URL)
  : path.resolve('./sentinel.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  _db = new Database(DB_PATH, { verbose: undefined });
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');

  initSchema(_db);
  return _db;
}

function initSchema(db: Database.Database): void {
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

// ─── Intelligence Cards ─────────────────────────────────────────────────────

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
  const db = getDb();
  db.prepare(`
    INSERT OR REPLACE INTO intelligence_cards
    (id, headline, summary, urgency, action_suggested, source_count, sources, delegation_trace, total_cost, brief)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    card.id,
    card.headline,
    card.summary,
    card.urgency,
    card.actionSuggested,
    card.sources.length,
    JSON.stringify(card.sources),
    JSON.stringify(card.delegationTrace),
    card.totalCost,
    card.brief
  );
}

export function getCards(limit = 20, offset = 0): unknown[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT * FROM intelligence_cards ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(limit, offset);
  return rows.map(parseCard);
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

// ─── Audit Log ──────────────────────────────────────────────────────────────

export function insertAuditEvent(event: {
  id: string;
  agent: string;
  action: string;
  detail?: string;
  cost?: number;
  txHash?: string;
  confirmed?: boolean;
}): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO audit_log (id, agent, action, detail, cost, tx_hash, confirmed)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    event.id,
    event.agent,
    event.action,
    event.detail || '',
    event.cost || 0,
    event.txHash || null,
    event.confirmed ? 1 : 0
  );
}

export function getAuditEvents(limit = 50): unknown[] {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT ?
  `).all(limit);
}

// ─── Replay Protection ──────────────────────────────────────────────────────

export async function processPayment<T>(
  paymentHash: string,
  amount: number,
  recipient: string,
  endpoint: string,
  processFn: () => Promise<T>
): Promise<T> {
  const db = getDb();

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO processed_payments (hash, amount, recipient, endpoint)
    VALUES (?, ?, ?, ?)
  `);

  const result = stmt.run(paymentHash, amount, recipient, endpoint);

  if (result.changes === 0) {
    console.warn(`[x402.replay_attempt] Hash ${paymentHash} already processed`);
    throw new Error('Payment already processed — replay attack prevented');
  }

  return processFn();
}

// ─── Agent State ────────────────────────────────────────────────────────────

export function updateAgentState(
  agentId: string,
  update: {
    status?: string;
    currentAction?: string | null;
    remainingBudget?: number;
    weeklyBudget?: number;
  }
): void {
  const db = getDb();
  const parts: string[] = ['last_seen = datetime(\'now\')'];
  const values: unknown[] = [];

  if (update.status !== undefined) { parts.push('status = ?'); values.push(update.status); }
  if (update.currentAction !== undefined) { parts.push('current_action = ?'); values.push(update.currentAction); }
  if (update.remainingBudget !== undefined) { parts.push('remaining_budget = ?'); values.push(update.remainingBudget); }
  if (update.weeklyBudget !== undefined) { parts.push('weekly_budget = ?'); values.push(update.weeklyBudget); }

  values.push(agentId);
  db.prepare(`UPDATE agent_state SET ${parts.join(', ')} WHERE agent_id = ?`).run(...values);
}

export function getAgentStates(): unknown[] {
  const db = getDb();
  return db.prepare('SELECT * FROM agent_state').all();
}

// ─── Sessions ───────────────────────────────────────────────────────────────

export function createSession(session: {
  id: string;
  brief: string;
  competitors: string[];
  sources: string[];
  weeklyBudgetUsdc: number;
  userAddress: string;
  permissionContext?: unknown;
}): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO agent_sessions
    (id, brief, competitors, sources, weekly_budget_usdc, user_address, permission_context)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    session.id,
    session.brief,
    JSON.stringify(session.competitors),
    JSON.stringify(session.sources),
    session.weeklyBudgetUsdc,
    session.userAddress,
    session.permissionContext ? JSON.stringify(session.permissionContext) : null
  );
}

export function getActiveSession(): unknown {
  const db = getDb();
  return db.prepare('SELECT * FROM agent_sessions WHERE status = ? ORDER BY created_at DESC LIMIT 1')
    .get('active');
}

export function killSession(sessionId: string): void {
  const db = getDb();
  db.prepare('UPDATE agent_sessions SET status = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .run('killed', sessionId);
}

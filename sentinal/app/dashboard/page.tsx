'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from './dashboard.module.css';
import { IntelligenceCard as ICard, AuditEvent, AgentState } from '@/types';

const BASESCAN = process.env.NEXT_PUBLIC_BASESCAN_URL || 'https://sepolia.basescan.org/tx';
const AGENTS_META = [
  { id: 'chief',   name: 'CHIEF',   role: 'Orchestrator', icon: '◎', color: 'var(--purple)' },
  { id: 'scout',   name: 'SCOUT',   role: 'Data Acquisition', icon: '◎', color: 'var(--teal)' },
  { id: 'analyst', name: 'ANALYST', role: 'Intelligence Synthesis', icon: '◎', color: '#60a5fa' },
  { id: 'cfo',     name: 'CFO',     role: 'Compute Optimization', icon: '◎', color: 'var(--warning)' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [cards, setCards] = useState<ICard[]>([]);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [agents, setAgents] = useState<Record<string, AgentState>>({});
  const [selectedCard, setSelectedCard] = useState<ICard | null>(null);
  const [killed, setKilled] = useState(false);
  const [killConfirm, setKillConfirm] = useState(false);
  const [weeklyBudget, setWeeklyBudget] = useState(0);
  const [remainingBudget, setRemainingBudget] = useState(0);
  const [activeTab, setActiveTab] = useState<'feed' | 'pipeline'>('feed');
  const sseRef = useRef<EventSource | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const session = localStorage.getItem('sentinel_session');
    if (!session) {
      router.push('/');
      return;
    }

    const cfg = JSON.parse(session);
    setWeeklyBudget(cfg.weeklyBudgetUSDC || 10);
    setRemainingBudget(cfg.weeklyBudgetUSDC || 10);
    setKilled(!!localStorage.getItem('sentinel_killed'));
    connectSSE();
    return () => sseRef.current?.close();
  }, [router]);

  const connectSSE = useCallback(() => {
    if (sseRef.current) sseRef.current.close();
    const es = new EventSource('/api/intelligence');
    sseRef.current = es;

    es.addEventListener('init', (e) => {
      const data = JSON.parse(e.data);
      if (data.cards) setCards(data.cards);
      if (data.audit) setAudit(data.audit);
      if (data.agents) setAgents(parseAgents(data.agents));
    });

    es.addEventListener('card', (e) => {
      const card = JSON.parse(e.data);
      setCards(prev => [card, ...prev]);
    });

    es.addEventListener('audit', (e) => {
      const event = JSON.parse(e.data);
      setAudit(prev => [event, ...prev].slice(0, 100));
    });

    es.addEventListener('agents', (e) => {
      const agentList = JSON.parse(e.data);
      setAgents(parseAgents(agentList));
    });

    es.onerror = () => {
      setTimeout(connectSSE, 3000); // Auto-reconnect
    };
  }, []);

  // Poll real on-chain balance every 30s
  const pollOnChainBalance = useCallback(async () => {
    const session = localStorage.getItem('sentinel_session');
    if (!session) return;
    const cfg = JSON.parse(session);
    const addr = cfg.userAddress;
    const sessionAddr = cfg.sessionKeyAddress;
    if (!addr) return;
    try {
      const res = await fetch(`/api/balance?user=${addr}${sessionAddr ? `&session=${sessionAddr}` : ''}`);
      if (!res.ok) return;
      const data = await res.json();
      // Show user wallet USDC balance as the remaining budget indicator
      if (data.userBalanceUSDC !== undefined) {
        const remaining = Math.min(data.userBalanceUSDC, weeklyBudget);
        setRemainingBudget(remaining);
      }
    } catch (e) {
      console.warn('[Balance] RPC read failed:', e);
    }
  }, [weeklyBudget]);

  useEffect(() => {
    const session = localStorage.getItem('sentinel_session');
    if (!session) return;
    // Initial balance read
    pollOnChainBalance();
    // Refresh every 30 seconds
    const balanceInterval = setInterval(pollOnChainBalance, 30000);
    return () => clearInterval(balanceInterval);
  }, [pollOnChainBalance]);

  function parseAgents(list: unknown[]): Record<string, AgentState> {
    const map: Record<string, AgentState> = {};
    list.forEach((a: unknown) => {
      const ag = a as Record<string, unknown>;
      map[ag.agent_id as string] = {
        id: ag.agent_id as 'chief',
        name: (ag.agent_id as string).toUpperCase(),
        status: (ag.status as string || 'idle') as 'idle',
        currentAction: ag.current_action as string,
        remainingBudget: Number(ag.remaining_budget || 0),
        weeklyBudget: Number(ag.weekly_budget || 0),
        lastSeen: ag.last_seen as string,
      };
    });
    return map;
  }

  async function handleKill() {
    const sessionId = localStorage.getItem('sentinel_session_id');

    // 1. Call revoke on MetaMask
    const session = localStorage.getItem('sentinel_session');
    if (session && window.ethereum) {
      try {
        const cfg = JSON.parse(session);
        const ctx = cfg.permissionContext?.permissionsContext;
        if (ctx && !ctx.startsWith('0xmock')) {
          await window.ethereum.request({
            method: 'wallet_revokePermissions',
            params: [{ permissionsContext: ctx }],
          });
        }
      } catch (e) {
        console.warn('Revoke RPC failed:', e);
      }
    }

    // 2. Kill server-side session
    await fetch('/api/agents/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });

    localStorage.setItem('sentinel_killed', '1');
    setKilled(true);
    setKillConfirm(false);
  }

  const budgetPct = Math.max(0, Math.min(100, (remainingBudget / weeklyBudget) * 100));
  const budgetClass = budgetPct < 20 ? 'danger' : budgetPct < 40 ? 'warning' : '';

  return (
    <div className={styles.root}>
      <div className="ambient-mesh" aria-hidden="true" />
      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.logo}>SENTINEL</span>
          <span className={styles.headerSep} />
          <span className={styles.headerStatus}>
            <span className={`agent-dot ${killed ? 'killed' : 'active'}`} />
            {killed ? 'Agents Defunded' : 'Agents Running'}
          </span>
        </div>

        <div className={styles.headerCenter}>
          <span className={styles.budgetLabel}>Budget</span>
          <div className={styles.budgetMeter}>
            <div className={`budget-bar ${styles.budgetBarWide}`}>
              <div className={`budget-fill ${budgetClass}`} style={{ width: `${budgetPct}%` }} />
            </div>
            <span className={styles.budgetNumbers}>
              <span className={styles.budgetRemain}>${remainingBudget.toFixed(2)}</span>
              <span className={styles.budgetSep}>/</span>
              <span>${weeklyBudget.toFixed(2)}</span>
            </span>
          </div>
          <span className={styles.budgetReset}>Resets in 4d 12h</span>
        </div>

        <div className={styles.headerRight} style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-ghost"
            style={{ padding: '8px 16px', fontSize: '13px', border: '1px solid var(--border)' }}
            onClick={() => {
              localStorage.removeItem('sentinel_address');
              localStorage.removeItem('sentinel_session');
              localStorage.removeItem('sentinel_session_id');
              localStorage.removeItem('sentinel_killed');
              sessionStorage.removeItem('sentinel_session_privkey');
              router.push('/');
            }}
          >
            Disconnect
          </button>
          <button
            id="kill-switch-btn"
            className={`btn btn-danger ${styles.killBtn}`}
            onClick={() => !killed && setKillConfirm(true)}
            disabled={killed}
          >
            {killed ? '🔴 KILLED' : '⬛ KILL'}
          </button>
        </div>
      </header>

      {/* ── 3-Panel Grid ── */}
      <div className={`${styles.grid} mission-control-grid`}>

        {/* LEFT — Agent Status */}
        <aside className={`${styles.panel} ${styles.agentPanel} agent-panel`}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>AGENT STATUS</span>
          </div>
          <div className={styles.agentList}>
            {AGENTS_META.map(meta => {
              const state = agents[meta.id];
              const status = state?.status || (killed ? 'killed' : 'idle');
              return (
                <div key={meta.id} className={`agent-card ${status}`}>
                  <div className={styles.agentTop}>
                    <span className={`agent-dot ${status}`} />
                    <span className={styles.agentName} style={{ color: meta.color }}>{meta.name}</span>
                    <span className={`${styles.agentStatusLabel} ${styles[status]}`}>{status.toUpperCase()}</span>
                  </div>
                  <p className={styles.agentRole}>{meta.role}</p>
                  {state?.currentAction && (
                    <p className={styles.agentAction}>{state.currentAction}</p>
                  )}
                  {state && state.weeklyBudget > 0 && (
                    <div className={styles.agentBudget}>
                      <div className="budget-bar">
                        <div
                          className="budget-fill"
                          style={{
                            width: `${Math.max(0, (state.remainingBudget / state.weeklyBudget) * 100)}%`,
                            background: meta.color,
                          }}
                        />
                      </div>
                      <span className={styles.agentBudgetLabel}>
                        ${state.remainingBudget.toFixed(2)} left
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            {!killed && (
              <button
                className={`btn btn-ghost ${styles.revokeBtn}`}
                onClick={() => setKillConfirm(true)}
              >
                Revoke All Permissions
              </button>
            )}
          </div>
        </aside>

        {/* CENTER — Intelligence Feed */}
        <main className={`${styles.panel} ${styles.feedPanel}`}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>INTELLIGENCE</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className={`${styles.pipelineTabBtn} ${activeTab === 'feed' ? styles.pipelineTabActive : ''}`}
                onClick={() => setActiveTab('feed')}
              >
                Feed
              </button>
              <button
                className={`${styles.pipelineTabBtn} ${activeTab === 'pipeline' ? styles.pipelineTabActive : ''}`}
                onClick={() => setActiveTab('pipeline')}
              >
                Pipeline
              </button>
            </div>
            <span className={styles.cardCount}>{cards.length} cards</span>
          </div>

          {activeTab === 'feed' ? (
            <div className={styles.feed} id="intelligence-feed">
              {cards.length === 0 && (
                <div className={styles.emptyFeed}>
                  <div className={styles.emptyIcon}>⚡</div>
                  <p>Agents are gathering intelligence…</p>
                  <p className={styles.emptyNote}>First cards appear in ~30 seconds</p>
                </div>
              )}
              {cards.map((card, i) => (
                <IntelligenceCardComp
                  key={card.id || i}
                  card={card}
                  onClick={() => setSelectedCard(card)}
                />
              ))}
            </div>
          ) : (
            <div className={styles.pipelineCanvas}>
              <div style={{ position: 'relative', width: 460, height: 500, margin: 'auto' }}>
                {/* SVG connection wires */}
                <svg className={styles.svgWires} width="460" height="500" viewBox="0 0 460 500">
                  {/* Wallet -> Chief */}
                  <path
                    d="M 230,70 L 230,110"
                    className={(agents.chief?.status === 'active' || !killed) ? styles.wirePathActive : styles.wirePath}
                  />

                  {/* Chief -> Scout */}
                  <path
                    d="M 230,170 C 230,200 75,200 75,230"
                    className={agents.scout?.status === 'active' ? styles.wirePathActive : styles.wirePath}
                  />

                  {/* Chief -> Analyst */}
                  <path
                    d="M 230,170 L 230,230"
                    className={agents.analyst?.status === 'active' ? styles.wirePathActive : styles.wirePath}
                  />

                  {/* Chief -> CFO */}
                  <path
                    d="M 230,170 C 230,200 385,200 385,230"
                    className={agents.cfo?.status === 'active' ? styles.wirePathActive : styles.wirePath}
                  />

                  {/* Scout -> Output */}
                  <path
                    d="M 75,295 C 75,360 230,360 230,420"
                    className={agents.scout?.status === 'active' ? styles.wirePathActive : styles.wirePath}
                  />

                  {/* Analyst -> Output */}
                  <path
                    d="M 230,295 L 230,420"
                    className={agents.analyst?.status === 'active' ? styles.wirePathActive : styles.wirePath}
                  />

                  {/* CFO -> Output */}
                  <path
                    d="M 385,295 C 385,360 230,360 230,420"
                    className={agents.cfo?.status === 'active' ? styles.wirePathActive : styles.wirePath}
                  />
                </svg>

                {/* Node 1: User Wallet */}
                <div className={`${styles.forgeNode} ${!killed ? styles.activeNode : ''}`} style={{ position: 'absolute', top: 10, left: 120, width: 220 }}>
                  <div className={styles.nodeHeader} style={{ background: '#2563eb' }}>
                    🔌 USER WALLET
                  </div>
                  <div className={styles.nodeBody}>
                    <span className={styles.nodeRole}>Base Sepolia (Upgraded)</span>
                    <span className={styles.nodeStatus}>Budget: ${weeklyBudget}/week USDC</span>
                  </div>
                  <div className={`${styles.nodePort} ${styles.portOutput}`} />
                </div>

                {/* Node 2: Chief Orchestrator */}
                <div className={`${styles.forgeNode} ${agents.chief?.status === 'active' ? styles.activeNode : ''}`} style={{ position: 'absolute', top: 110, left: 140, width: 180 }}>
                  <div className={styles.nodeHeader} style={{ background: 'var(--purple)' }}>
                    🧠 CHIEF AGENT
                  </div>
                  <div className={styles.nodeBody}>
                    <span className={styles.nodeRole}>Orchestration (Venice AI)</span>
                    <span className={`${styles.nodeStatus} ${agents.chief?.status === 'active' ? styles.active : ''}`}>
                      {agents.chief?.status === 'active' ? 'Orchestrating...' : 'Idle'}
                    </span>
                  </div>
                  <div className={`${styles.nodePort} ${styles.portInput}`} />
                  <div className={`${styles.nodePort} ${styles.portOutput}`} />
                </div>

                {/* Node 3: Scout */}
                <div className={`${styles.forgeNode} ${agents.scout?.status === 'active' ? styles.activeNode : ''}`} style={{ position: 'absolute', top: 230, left: 10, width: 130 }}>
                  <div className={styles.nodeHeader} style={{ background: 'var(--teal)' }}>
                    📡 SCOUT
                  </div>
                  <div className={styles.nodeBody}>
                    <span className={styles.nodeRole}>Data Buyer (x402)</span>
                    <span className={`${styles.nodeStatus} ${agents.scout?.status === 'active' ? styles.active : ''}`}>
                      {agents.scout?.status === 'active' ? 'Querying feeds...' : 'Idle'}
                    </span>
                  </div>
                  <div className={`${styles.nodePort} ${styles.portInput}`} />
                  <div className={`${styles.nodePort} ${styles.portOutput}`} />
                </div>

                {/* Node 4: Analyst */}
                <div className={`${styles.forgeNode} ${agents.analyst?.status === 'active' ? styles.activeNode : ''}`} style={{ position: 'absolute', top: 230, left: 165, width: 130 }}>
                  <div className={styles.nodeHeader} style={{ background: '#60a5fa' }}>
                    🔬 ANALYST
                  </div>
                  <div className={styles.nodeBody}>
                    <span className={styles.nodeRole}>Synthesis (Venice AI)</span>
                    <span className={`${styles.nodeStatus} ${agents.analyst?.status === 'active' ? styles.active : ''}`}>
                      {agents.analyst?.status === 'active' ? 'Synthesizing...' : 'Idle'}
                    </span>
                  </div>
                  <div className={`${styles.nodePort} ${styles.portInput}`} />
                  <div className={`${styles.nodePort} ${styles.portOutput}`} />
                </div>

                {/* Node 5: CFO */}
                <div className={`${styles.forgeNode} ${agents.cfo?.status === 'active' ? styles.activeNode : ''}`} style={{ position: 'absolute', top: 230, left: 320, width: 130 }}>
                  <div className={styles.nodeHeader} style={{ background: 'var(--warning)' }}>
                    ⚖️ CFO
                  </div>
                  <div className={styles.nodeBody}>
                    <span className={styles.nodeRole}>Compute Optimization</span>
                    <span className={`${styles.nodeStatus} ${agents.cfo?.status === 'active' ? styles.active : ''}`}>
                      {agents.cfo?.status === 'active' ? 'Optimizing...' : 'Idle'}
                    </span>
                  </div>
                  <div className={`${styles.nodePort} ${styles.portInput}`} />
                  <div className={`${styles.nodePort} ${styles.portOutput}`} />
                </div>

                {/* Node 6: Intelligence Output */}
                <div className={`${styles.forgeNode} ${cards.length > 0 ? styles.activeNode : ''}`} style={{ position: 'absolute', top: 420, left: 120, width: 220 }}>
                  <div className={styles.nodeHeader} style={{ background: '#22c55e' }}>
                    📋 INTELLIGENCE FEED
                  </div>
                  <div className={styles.nodeBody}>
                    <span className={styles.nodeRole}>Output Report Delivery</span>
                    <span className={styles.nodeStatus}>{cards.length} cards generated</span>
                  </div>
                  <div className={`${styles.nodePort} ${styles.portInput}`} />
                </div>
              </div>
            </div>
          )}
        </main>

        {/* RIGHT — Audit Trail */}
        <aside className={`${styles.panel} ${styles.auditPanel} audit-panel`}>
          <div className="terminal" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="terminal-header">
              <div className="terminal-dot red" />
              <div className="terminal-dot yellow" />
              <div className="terminal-dot green" />
              <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                AUDIT TRAIL
              </span>
            </div>
            <div className="terminal-body" ref={terminalRef} style={{ flex: 1, maxHeight: 'calc(100% - 40px)' }}>
              {audit.length === 0 && (
                <div style={{ color: 'var(--text-dim)', fontSize: 11 }}>Waiting for agent activity…</div>
              )}
              {audit.map((event, i) => (
                <AuditLine key={event.id ? `${event.id}-${i}` : i} event={event} />
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* ── Card Detail Modal ── */}
      {selectedCard && (
        <CardModal card={selectedCard} onClose={() => setSelectedCard(null)} />
      )}

      {/* ── Kill Confirm Modal ── */}
      {killConfirm && (
        <div className="kill-overlay">
          <div className="kill-panel">
            <div className={styles.killIcon}>🔴</div>
            <h2 className={styles.killTitle}>Revoke All Permissions?</h2>
            <p className={styles.killDesc}>
              This immediately revokes the root ERC-7715 permission.
              All sub-agent delegations (Scout, Analyst, CFO) become
              mathematically invalid. No further USDC can be spent.
            </p>
            <div className={styles.killActions}>
              <button className="btn btn-ghost" onClick={() => setKillConfirm(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleKill} id="confirm-kill-btn">
                ⬛ Revoke All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── All Killed Overlay ── */}
      {killed && (
        <div className={styles.killedBanner}>
          <span className={styles.killedIcon}>🔴</span>
          <span>All agents defunded. Your funds are safe.</span>
          <button className="btn btn-primary" onClick={() => {
            localStorage.removeItem('sentinel_killed');
            localStorage.removeItem('sentinel_session');
            localStorage.removeItem('sentinel_session_id');
            router.push('/');
          }}>
            Start New Session
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Intelligence Card Component ── */
function IntelligenceCardComp({ card, onClick }: { card: ICard; onClick: () => void }) {
  const trace = Array.isArray(card.delegationTrace) ? card.delegationTrace : [];
  const totalCost = card.totalCost || 0;

  return (
    <div className={`intel-card urgency-${card.urgency}`} onClick={onClick} id={`card-${card.id}`}>
      <div className={styles.cardTop}>
        <span className={`urgency-badge ${card.urgency}`}>
          {card.urgency === 'high' ? '🔴' : card.urgency === 'medium' ? '🟡' : '🟢'}
          {' '}{card.urgency.toUpperCase()} URGENCY
        </span>
        <span className={styles.cardCost}>${totalCost.toFixed(4)}</span>
      </div>

      <h3 className={styles.cardHeadline}>{card.headline}</h3>
      <p className={styles.cardSummary}>{card.summary}</p>

      {card.actionSuggested && (
        <div className={styles.cardAction}>
          <span className={styles.cardActionLabel}>→ ACTION</span>
          <span>{card.actionSuggested}</span>
        </div>
      )}

      {/* Delegation Trace — the signature SENTINEL element */}
      {trace.length > 0 && (
        <div className="delegation-trace">
          {trace.map((step, i) => (
            <div key={`trace-${i}`} style={{ display: 'contents' }}>
              {i > 0 && <span className="trace-arrow">→</span>}
              <a
                href={step.txHash ? `${BASESCAN}/${step.txHash}` : '#'}
                target={step.txHash ? '_blank' : '_self'}
                rel="noopener noreferrer"
                className={`trace-chip ${step.confirmed ? 'confirmed' : ''}`}
                onClick={e => e.stopPropagation()}
                title={step.txHash ? 'View on BaseScan' : step.agent}
              >
                [{step.agent}]
                {step.cost > 0 && ` $${step.cost.toFixed(4)}`}
                {step.txHash && ' ↗'}
              </a>
            </div>
          ))}
          <span className="trace-arrow">→</span>
          <span className="trace-chip">[You]</span>
        </div>
      )}

      <div className={styles.cardMeta}>
        <span>{new Date(card.createdAt).toLocaleTimeString()}</span>
        <span>{card.sourceCount || 0} sources</span>
      </div>
    </div>
  );
}

/* ── Audit Trail Line ── */
function AuditLine({ event }: { event: AuditEvent }) {
  const agent = (event.agent || 'System').toLowerCase();
  const time = new Date(event.timestamp).toLocaleTimeString('en', {
    hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

  return (
    <div className="terminal-line">
      <span className="terminal-time">{time}</span>
      <span className={`terminal-agent ${agent}`}>[{event.agent}]</span>
      <span className="terminal-detail">{event.detail || event.action}</span>
      {event.cost != null && event.cost > 0 && (
        <span className="terminal-cost">${event.cost.toFixed(4)}</span>
      )}
      {event.txHash && (
        <a
          href={`${BASESCAN}/${event.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="terminal-link"
          title="View on BaseScan"
        >
          [↗]
        </a>
      )}
    </div>
  );
}

/* ── Card Detail Modal ── */
function CardModal({ card, onClose }: { card: ICard; onClose: () => void }) {
  const trace = Array.isArray(card.delegationTrace) ? card.delegationTrace : [];
  const sources = Array.isArray(card.sources) ? card.sources : [];

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <button className={styles.modalBack} onClick={onClose}>← Back to Feed</button>
          <span className={`urgency-badge ${card.urgency}`}>
            {card.urgency.toUpperCase()} URGENCY
          </span>
        </div>

        <h2 className={styles.modalHeadline}>{card.headline}</h2>

        <section className={styles.modalSection}>
          <h3 className={styles.modalSectionTitle}>SUMMARY</h3>
          <p className={styles.modalText}>{card.summary}</p>
        </section>

        {card.actionSuggested && (
          <section className={styles.modalSection}>
            <h3 className={styles.modalSectionTitle}>SUGGESTED ACTION</h3>
            <p className={styles.modalText}>{card.actionSuggested}</p>
          </section>
        )}

        {sources.length > 0 && (
          <section className={styles.modalSection}>
            <h3 className={styles.modalSectionTitle}>SOURCES ({sources.length})</h3>
            <div className={styles.modalSources}>
              {sources.map((src, i) => (
                <a
                  key={i}
                  href={src.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.modalSource}
                >
                  {src.title || src.type} {src.cost ? `$${src.cost.toFixed(4)}` : '(free)'} ↗
                </a>
              ))}
            </div>
          </section>
        )}

        <section className={styles.modalSection}>
          <h3 className={styles.modalSectionTitle}>DELEGATION TRAIL</h3>
          <div className="delegation-trace" style={{ flexWrap: 'nowrap', overflowX: 'auto' }}>
            {trace.map((step, i) => (
              <div key={`modal-trace-${i}`} style={{ display: 'contents' }}>
                {i > 0 && <span className="trace-arrow">→</span>}
                <a
                  href={step.txHash ? `${BASESCAN}/${step.txHash}` : '#'}
                  target={step.txHash ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  className={`trace-chip ${step.confirmed ? 'confirmed' : ''}`}
                >
                  [{step.agent}: {step.action}
                  {step.cost > 0 ? ` $${step.cost.toFixed(4)}` : ''}]
                  {step.txHash && ' ✓ ↗'}
                </a>
              </div>
            ))}
            <span className="trace-arrow">→</span>
            <span className="trace-chip">[You]</span>
          </div>
        </section>

        <div className={styles.modalFooter}>
          <span>Total cost: <strong>${(card.totalCost || 0).toFixed(4)}</strong></span>
          <span>Generated: {new Date(card.createdAt).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

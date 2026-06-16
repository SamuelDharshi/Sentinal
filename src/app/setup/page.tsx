'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './setup.module.css';

const DATA_SOURCES = [
  { id: 'hackernews',  label: 'HackerNews',          badge: 'FREE', cost: '',          desc: 'Top stories & discussions (Algolia API)' },
  { id: 'github',      label: 'GitHub Trending',      badge: 'FREE', cost: '',          desc: 'Trending repos via GitHub Search API' },
  { id: 'producthunt', label: 'Product Hunt',         badge: 'FREE', cost: '',          desc: 'New launches via RSS feed' },
  { id: 'serper',      label: 'Serper Search API',    badge: 'x402', cost: '~$0.001/q', desc: 'Real-time web search (paid on-chain)' },
  { id: 'diffbot',     label: 'Diffbot Web Intel',    badge: 'x402', cost: '~$0.05/q',  desc: 'Deep web data extraction (paid on-chain)' },
  { id: 'builtwith',   label: 'BuiltWith Technology', badge: 'x402', cost: '~$0.02/q',  desc: 'Competitor tech stack (paid on-chain)' },
];

const BUDGET_PRESETS = [5, 10, 20, 50];

// Serper x402 endpoint (Scout uses this when 'serper' source is selected)
const X402_ENDPOINTS: Record<string, string> = {
  serper:    'https://api.serper.dev/x402/search',
  diffbot:   'https://api.diffbot.com/x402/analyze',
  builtwith: 'https://api.builtwith.com/x402/lookup',
};

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [brief, setBrief] = useState('');
  const [competitors, setCompetitors] = useState('');
  const [selectedSources, setSelectedSources] = useState<string[]>(['hackernews', 'github', 'producthunt']);
  const [weeklyBudget, setWeeklyBudget] = useState(10);
  const [granting, setGranting] = useState(false);
  const [error, setError] = useState('');
  const [address, setAddress] = useState('');
  const [permMode, setPermMode] = useState<'real' | 'observer' | null>(null);
  const [sessionKeyAddr, setSessionKeyAddr] = useState('');

  useEffect(() => {
    const addr = localStorage.getItem('sentinel_address');
    if (!addr) { router.push('/'); return; }
    setAddress(addr);

    // Generate real session keypair on mount
    import('@/lib/chain/sessionKey').then(({ getOrCreateSessionKey }) => {
      const kp = getOrCreateSessionKey();
      setSessionKeyAddr(kp.address);
    });
  }, [router]);

  const toggleSource = (id: string) =>
    setSelectedSources(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  const split = {
    scout:   (weeklyBudget * 0.30).toFixed(2),
    analyst: (weeklyBudget * 0.60).toFixed(2),
    cfo:     (weeklyBudget * 0.10).toFixed(2),
  };

  async function grantAndLaunch() {
    if (!window.ethereum) { setError('MetaMask not found'); return; }
    setGranting(true);
    setError('');

    try {
      // Import real session key module
      const { getOrCreateSessionKey } = await import('@/lib/chain/sessionKey');
      const sessionKey = getOrCreateSessionKey();

      // ERC-7715: grant weekly budget to the real session key address
      const { grantWeeklyBudget } = await import('@/lib/metamask/permissions');
      let permissionContext: unknown;

      try {
        permissionContext = await grantWeeklyBudget(
          sessionKey.address,
          weeklyBudget
        );
        setPermMode('real');
      } catch (walletErr: unknown) {
        console.warn('[Setup] wallet_grantPermissions failed — observer mode:', walletErr);
        // MetaMask Flask / SAK build required for wallet_grantPermissions.
        // Observer mode: Venice AI + free data sources still run fully.
        // On-chain USDC payments via 1Shot are simulated in this mode.
        setPermMode('observer');
        permissionContext = {
          permissionsContext: `0xef0100${sessionKey.address.slice(2)}` as `0x${string}`,
          permissions: [],
          expiry: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
          observerMode: true,
        };
      }

      // Build x402 endpoint list from selected paid sources
      const x402Sources = selectedSources
        .filter(s => X402_ENDPOINTS[s])
        .map(s => X402_ENDPOINTS[s]);

      const config = {
        brief,
        competitors: competitors.split('\n').map(c => c.trim()).filter(Boolean),
        sources: selectedSources,
        x402Endpoints: x402Sources,
        weeklyBudgetUSDC: weeklyBudget,
        userAddress:      address,
        permissionContext,
        sessionKeyAddress: sessionKey.address,
        // NOTE: private key passed to server for signing agent txs.
        // In production: agents sign locally; server just builds calldata.
        sessionPrivKey: sessionKey.privateKey,
      };

      localStorage.setItem('sentinel_session', JSON.stringify({
        ...config,
        sessionPrivKey: undefined, // never store privkey in localStorage
      }));

      const res = await fetch('/api/agents/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Agent launch failed');
      }

      const { sessionId } = await res.json();
      localStorage.setItem('sentinel_session_id', sessionId);
      router.push('/dashboard');

    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Setup failed');
    } finally {
      setGranting(false);
    }
  }

  return (
    <main className={styles.main}>
      <div className="ambient-mesh" aria-hidden="true" />

      <nav className={styles.nav}>
        <button className={styles.back} onClick={() => step > 1 ? setStep(s => s - 1) : router.push('/')}>
          ← {step > 1 ? 'Back' : 'Home'}
        </button>
        <span className={styles.logo}>SENTINEL</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className={styles.walletAddr}>{address ? `${address.slice(0,6)}…${address.slice(-4)}` : ''}</span>
          <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 11, height: 'auto', minHeight: 'unset', border: '1px solid var(--border)' }} onClick={() => {
            localStorage.removeItem('sentinel_address');
            localStorage.removeItem('sentinel_session');
            localStorage.removeItem('sentinel_session_id');
            localStorage.removeItem('sentinel_killed');
            sessionStorage.removeItem('sentinel_session_privkey');
            router.push('/');
          }}>
            Disconnect
          </button>
        </div>
      </nav>

      <div className={styles.container}>
        {/* Step Indicators */}
        <div className="step-indicator">
          {[1, 2, 3].map((n, i) => (
            <div key={`step-${n}`} style={{ display: 'contents' }}>
              <div className={`step-dot ${n < step ? 'done' : n === step ? 'active' : 'pending'}`}>
                {n < step ? '✓' : n}
              </div>
              {i < 2 && <div key={`line-${n}`} className={`step-line ${n < step ? 'done' : ''}`} />}
            </div>
          ))}
        </div>

        {/* ── Step 1: Brief ── */}
        {step === 1 && (
          <div className="wizard-step">
            <h2 className={styles.stepHeading}>What's your business?</h2>
            <p className={styles.stepSub}>Describe it in plain English. Your agents will do the rest.</p>

            <div className={styles.field}>
              <label className={styles.label}>Business brief</label>
              <textarea
                id="brief-input"
                className="input-field"
                rows={5}
                placeholder="I build developer tools. My main product is a code review assistant for teams. I want to track AI coding trends, new competitor launches, and GitHub activity in the code review space."
                value={brief}
                onChange={e => setBrief(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Competitors to track <span className={styles.optional}>(one per line)</span></label>
              <textarea
                id="competitors-input"
                className="input-field"
                rows={4}
                placeholder={'Copilot\nCursor\nCodeRabbit\nCodeium'}
                value={competitors}
                onChange={e => setCompetitors(e.target.value)}
              />
            </div>

            <button id="step1-next" className="btn btn-primary" onClick={() => setStep(2)} disabled={!brief.trim()}>
              Next: Choose Data Sources →
            </button>
          </div>
        )}

        {/* ── Step 2: Sources ── */}
        {step === 2 && (
          <div className="wizard-step">
            <h2 className={styles.stepHeading}>Where should we look?</h2>
            <p className={styles.stepSub}>x402 sources are paid on-chain automatically — no pre-funding needed.</p>

            <div className={styles.sourceGrid}>
              {DATA_SOURCES.map(src => (
                <label key={src.id} className={`source-checkbox ${styles.sourceCard} ${selectedSources.includes(src.id) ? styles.sourceSelected : ''}`}>
                  <input type="checkbox" checked={selectedSources.includes(src.id)} onChange={() => toggleSource(src.id)} id={`source-${src.id}`} />
                  <div className="checkmark">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className={styles.sourceInfo}>
                    <div className={styles.sourceTop}>
                      <span className={styles.sourceName}>{src.label}</span>
                      <span className={`${styles.sourceBadge} ${src.badge === 'FREE' ? styles.free : styles.x402}`}>{src.badge}</span>
                      {src.cost && <span className={styles.sourceCost}>{src.cost}</span>}
                    </div>
                    <span className={styles.sourceDesc}>{src.desc}</span>
                  </div>
                </label>
              ))}
            </div>

            <p className={styles.sourceNote}>
              ℹ x402 payments go directly on-chain via the 1Shot relayer. Cost is deducted from your Scout Agent budget. SQLite replay protection prevents double-spend.
            </p>

            <div className={styles.stepActions}>
              <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
              <button id="step2-next" className="btn btn-primary" onClick={() => setStep(3)} disabled={selectedSources.length === 0}>
                Next: Set Budget →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Budget & Grant ── */}
        {step === 3 && (
          <div className="wizard-step">
            <h2 className={styles.stepHeading}>Set your budget</h2>
            <p className={styles.stepSub}>One ERC-7715 permission. Agents operate within this for 30 days.</p>

            {/* Observer mode banner — shown after grant attempt fails */}
            {permMode === 'observer' && (
              <div style={{
                background: 'rgba(251,146,60,0.08)',
                border: '1px solid rgba(251,146,60,0.35)',
                borderRadius: 10,
                padding: '12px 16px',
                marginBottom: 16,
                fontSize: 13,
                lineHeight: 1.6,
              }}>
                <strong style={{ color: '#fb923c' }}>⚠ Observer Mode</strong>
                <br />
                <span style={{ color: 'var(--text-secondary)' }}>
                  <code>wallet_grantPermissions</code> (ERC-7715) requires MetaMask with the
                  Smart Accounts Kit enabled. Your current MetaMask build doesn&apos;t support it yet.
                  <br />
                  <strong style={{ color: 'var(--text-primary)' }}>The demo still runs fully:</strong>{' '}
                  Venice AI synthesizes real intelligence, HackerNews / GitHub / ProductHunt feeds are live.
                  On-chain USDC payments via 1Shot are simulated in this mode.
                </span>
              </div>
            )}
            {permMode === 'real' && (
              <div style={{
                background: 'rgba(34,197,94,0.08)',
                border: '1px solid rgba(34,197,94,0.35)',
                borderRadius: 10,
                padding: '12px 16px',
                marginBottom: 16,
                fontSize: 13,
              }}>
                <strong style={{ color: '#22c55e' }}>✓ ERC-7715 Permission Granted</strong>
                <span style={{ color: 'var(--text-secondary)', marginLeft: 8 }}>
                  Real on-chain budget delegation active. Agents will submit live USDC payments via 1Shot.
                </span>
              </div>
            )}

            <div className={styles.budgetWidget}>
              <div className={styles.budgetDisplay}>
                <span className={styles.budgetCurrency}>$</span>
                <span className={styles.budgetAmount}>{weeklyBudget}</span>
                <span className={styles.budgetPer}>/week USDC</span>
              </div>
              <input id="budget-slider" type="range" min={5} max={50} step={1} value={weeklyBudget}
                onChange={e => setWeeklyBudget(Number(e.target.value))} className={styles.slider} />
              <div className={styles.budgetPresets}>
                {BUDGET_PRESETS.map(p => (
                  <button key={p} className={`btn btn-ghost ${weeklyBudget === p ? styles.presetActive : ''}`} onClick={() => setWeeklyBudget(p)}>${p}</button>
                ))}
              </div>
            </div>

            {/* Budget split */}
            <div className={styles.splitViz}>
              <h3 className={styles.splitTitle}>Automatic budget split (ERC-7710)</h3>
              {[
                { label: 'Scout Agent',   pct: 30, amount: split.scout,   color: 'var(--teal)',    desc: 'Data + x402 on-chain payments' },
                { label: 'Analyst Agent', pct: 60, amount: split.analyst, color: 'var(--purple)',  desc: 'Venice AI private synthesis' },
                { label: 'CFO Agent',     pct: 10, amount: split.cfo,     color: 'var(--warning)', desc: 'Compute cost optimisation' },
              ].map(row => (
                <div key={row.label} className={styles.splitRow}>
                  <div className={styles.splitLabel}>
                    <span className={styles.splitDot} style={{ background: row.color }} />
                    <span>{row.label}</span>
                    <span className={styles.splitDesc}>{row.desc}</span>
                  </div>
                  <div className={styles.splitBarWrap}>
                    <div className={styles.splitBar}><div className={styles.splitFill} style={{ width: `${row.pct}%`, background: row.color }} /></div>
                    <span className={styles.splitAmount}>${row.amount}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Session key info */}
            {sessionKeyAddr && (
              <div className={styles.sessionKeyInfo}>
                <span className={styles.skLabel}>Session Key</span>
                <span className={styles.skAddr}>{sessionKeyAddr.slice(0,10)}…{sessionKeyAddr.slice(-6)}</span>
                <span className={styles.skNote}>Ephemeral — clears on tab close</span>
              </div>
            )}

            <div className={styles.estimate}>
              <span>📊</span>
              <span>Est. {Math.round(weeklyBudget * 2.2)}–{Math.round(weeklyBudget * 3.0)} intelligence cards/week</span>
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.stepActions}>
              <button className="btn btn-ghost" onClick={() => setStep(2)}>← Back</button>
              <button id="grant-permissions-btn" className={`btn btn-primary ${styles.grantBtn}`} onClick={grantAndLaunch} disabled={granting}>
                {granting ? <><span className="spinner" /> Granting ERC-7715 Permission…</> : <>⚡ Grant Permission &amp; Launch Agents →</>}
              </button>
            </div>

            <p className={styles.permNote}>
              This signs <strong>one</strong> MetaMask transaction (ERC-7715 <code>wallet_grantPermissions</code>). 
              No future approvals. Your $10/week cap is enforced by smart contract — agents cannot exceed it.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

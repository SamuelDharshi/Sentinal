'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Sliders, Shield, Database, Sparkles } from 'lucide-react';

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
      const permissionContext = await grantWeeklyBudget(
        sessionKey.address,
        weeklyBudget
      );

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
    <main className="relative min-h-screen bg-background text-foreground overflow-hidden flex flex-col font-sans select-none">
      {/* Premium background mesh & grid pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(35,154,170,0.08),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(123,95,212,0.06),transparent_50%)]" aria-hidden="true" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px]" aria-hidden="true" />

      {/* Navigation Header */}
      <nav className="relative z-50 border-b border-border/40 bg-background/50 backdrop-blur-xl flex items-center justify-between px-6 py-4">
        <button 
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-transparent border-none outline-none font-medium"
          onClick={() => step > 1 ? setStep(s => s - 1) : router.push('/')}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{step > 1 ? 'Back' : 'Home'}</span>
        </button>
        <span className="text-md font-bold tracking-[0.2em] font-mono bg-gradient-to-r from-teal via-teal-dim to-purple bg-clip-text text-transparent">
          SENTINEL
        </span>
        <div className="flex items-center gap-3">
          {address && (
            <span className="text-xs text-muted-foreground font-mono bg-border/40 px-3 py-1 rounded-full border border-border/60">
              {address.slice(0, 6)}…{address.slice(-4)}
            </span>
          )}
          <button 
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border/80 bg-background/80 hover:bg-border/60 transition-colors text-muted-foreground hover:text-foreground"
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
        </div>
      </nav>

      {/* Content Container */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 z-10">
        <div className="w-full max-w-2xl bg-[#0f0f18]/80 border border-border/60 rounded-2xl p-8 shadow-2xl backdrop-blur-xl flex flex-col gap-6 relative">
          
          {/* Header indicator glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[1px] bg-gradient-to-r from-transparent via-teal to-transparent" />

          {/* Step Indicators */}
          <div className="flex items-center justify-center gap-3 mb-4">
            {[1, 2, 3].map((n, i) => (
              <div key={`step-${n}`} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border transition-all duration-300 ${
                  n < step 
                    ? 'bg-success border-success text-white' 
                    : n === step 
                      ? 'bg-teal border-teal text-white shadow-[0_0_15px_rgba(35,154,170,0.4)]' 
                      : 'bg-[#181824] border-border text-muted-foreground'
                }`}>
                  {n < step ? <Check className="h-4 w-4" /> : n}
                </div>
                {i < 2 && (
                  <div className={`h-[2px] w-16 mx-2 rounded transition-all duration-500 ${
                    n < step ? 'bg-teal' : 'bg-[#181824]'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* ── Step 1: Brief ── */}
          {step === 1 && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold font-display tracking-tight text-foreground flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-teal" /> What's your business?
                </h2>
                <p className="text-sm text-muted-foreground mt-1">Describe it in plain English. Your agents will do the rest.</p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">Business brief</label>
                <textarea
                  id="brief-input"
                  className="w-full min-h-[120px] rounded-xl border border-border/60 bg-[#12121a] px-4 py-3 text-foreground placeholder-muted-foreground/60 focus:border-teal/80 focus:ring-1 focus:ring-teal/30 focus:outline-none transition-all duration-200 resize-none font-sans text-sm"
                  rows={4}
                  placeholder="I build developer tools. My main product is a code review assistant for teams. I want to track AI coding trends, new competitor launches, and GitHub activity in the code review space."
                  value={brief}
                  onChange={e => setBrief(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono flex items-center gap-1.5">
                  Competitors to track <span className="text-[10px] text-muted-foreground/60 normal-case font-sans font-normal">(one per line)</span>
                </label>
                <textarea
                  id="competitors-input"
                  className="w-full min-h-[100px] rounded-xl border border-border/60 bg-[#12121a] px-4 py-3 text-foreground placeholder-muted-foreground/60 focus:border-teal/80 focus:ring-1 focus:ring-teal/30 focus:outline-none transition-all duration-200 resize-none font-sans text-sm"
                  rows={3}
                  placeholder={'Copilot\nCursor\nCodeRabbit\nCodeium'}
                  value={competitors}
                  onChange={e => setCompetitors(e.target.value)}
                />
              </div>

              <button 
                id="step1-next" 
                className="w-full h-11 rounded-xl bg-gradient-to-r from-teal to-teal-dim hover:from-teal-dim hover:to-teal text-white font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_4px_20px_rgba(35,154,170,0.3)]"
                onClick={() => setStep(2)} 
                disabled={!brief.trim()}
              >
                <span>Next: Choose Data Sources</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* ── Step 2: Sources ── */}
          {step === 2 && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold font-display tracking-tight text-foreground flex items-center gap-2">
                  <Database className="h-5 w-5 text-teal" /> Where should we look?
                </h2>
                <p className="text-sm text-muted-foreground mt-1">x402 sources are paid on-chain automatically — no pre-funding needed.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {DATA_SOURCES.map(src => (
                  <label 
                    key={src.id} 
                    className={`flex flex-col gap-2 p-4 rounded-xl border bg-[#12121a]/80 backdrop-blur-md cursor-pointer transition-all duration-200 ${
                      selectedSources.includes(src.id) 
                        ? 'border-teal bg-teal/5 shadow-[0_0_15px_rgba(35,154,170,0.1)]' 
                        : 'border-border/60 hover:border-teal/40 hover:bg-[#151522]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          className="rounded border-border text-teal focus:ring-teal bg-transparent"
                          checked={selectedSources.includes(src.id)} 
                          onChange={() => toggleSource(src.id)} 
                          id={`source-${src.id}`} 
                        />
                        <span className="font-semibold text-sm text-foreground">{src.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full font-mono ${
                          src.badge === 'FREE' ? 'bg-success/10 text-success' : 'bg-teal/15 text-teal'
                        }`}>
                          {src.badge}
                        </span>
                        {src.cost && <span className="text-[10px] text-muted-foreground font-mono">{src.cost}</span>}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground leading-normal">{src.desc}</span>
                  </label>
                ))}
              </div>

              <p className="text-[11px] text-muted-foreground/80 leading-relaxed border border-border/40 rounded-xl p-3 bg-border/10 flex gap-2 items-start">
                <span>ℹ</span>
                <span>x402 payments go directly on-chain via the 1Shot relayer. Cost is deducted from your Scout Agent budget. SQLite replay protection prevents double-spend.</span>
              </p>

              <div className="flex gap-3">
                <button 
                  className="flex-1 h-11 rounded-xl border border-border bg-background/80 hover:bg-border/60 text-muted-foreground hover:text-foreground font-medium text-sm transition-colors"
                  onClick={() => setStep(1)}
                >
                  ← Back
                </button>
                <button 
                  id="step2-next" 
                  className="flex-1 h-11 rounded-xl bg-gradient-to-r from-teal to-teal-dim hover:from-teal-dim hover:to-teal text-white font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_4px_20px_rgba(35,154,170,0.3)]" 
                  onClick={() => setStep(3)} 
                  disabled={selectedSources.length === 0}
                >
                  <span>Next: Set Budget</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Budget & Grant ── */}
          {step === 3 && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold font-display tracking-tight text-foreground flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-teal" /> Set your budget
                </h2>
                <p className="text-sm text-muted-foreground mt-1">One ERC-7715 permission. Agents operate within this for 30 days.</p>
              </div>

              {/* Budget Widget */}
              <div className="bg-[#12121a] border border-border/60 rounded-xl p-6 flex flex-col items-center gap-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-muted-foreground font-mono">$</span>
                  <span className="text-5xl font-black font-display bg-gradient-to-r from-teal to-purple bg-clip-text text-transparent">{weeklyBudget}</span>
                  <span className="text-sm font-semibold text-muted-foreground ml-1">/week USDC</span>
                </div>
                <input 
                  id="budget-slider" 
                  type="range" 
                  min={5} 
                  max={50} 
                  step={1} 
                  value={weeklyBudget}
                  onChange={e => setWeeklyBudget(Number(e.target.value))} 
                  className="w-full accent-teal h-1.5 bg-border rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex gap-2">
                  {BUDGET_PRESETS.map(p => (
                    <button 
                      key={p} 
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all duration-200 ${
                        weeklyBudget === p 
                          ? 'border-teal bg-teal/10 text-teal shadow-[0_0_10px_rgba(35,154,170,0.2)]' 
                          : 'border-border/60 hover:border-teal/40 bg-background/50 text-muted-foreground hover:text-foreground'
                      }`}
                      onClick={() => setWeeklyBudget(p)}
                    >
                      ${p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget split */}
              <div className="border border-border/60 rounded-xl p-5 bg-[#12121a]/40 flex flex-col gap-3.5">
                <h3 className="text-xs font-semibold tracking-wider font-mono text-muted-foreground uppercase">Automatic budget split (ERC-7710)</h3>
                {[
                  { label: 'Scout Agent',   pct: 30, amount: split.scout,   color: '#239AAA',    desc: 'Data + x402 on-chain payments' },
                  { label: 'Analyst Agent', pct: 60, amount: split.analyst, color: '#7B5FD4',  desc: 'Venice AI private synthesis' },
                  { label: 'CFO Agent',     pct: 10, amount: split.cfo,     color: '#E27625', desc: 'Compute cost optimisation' },
                ].map(row => (
                  <div key={row.label} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-medium">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: row.color }} />
                        <span>{row.label}</span>
                      </div>
                      <span className="text-muted-foreground font-mono">${row.amount}</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#1c1c28] rounded-full overflow-hidden flex">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${row.pct}%`, background: row.color }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground/60">{row.desc}</span>
                  </div>
                ))}
              </div>

              {/* Session key info */}
              {sessionKeyAddr && (
                <div className="flex items-center justify-between p-3.5 border border-border/40 bg-border/10 rounded-xl font-mono text-xs">
                  <span className="text-teal font-semibold text-[10px] uppercase tracking-wider">Session Key</span>
                  <span className="text-foreground">{sessionKeyAddr.slice(0,10)}…{sessionKeyAddr.slice(-6)}</span>
                  <span className="text-muted-foreground/60 text-[10px]">EPHEMERAL</span>
                </div>
              )}

              <div className="text-xs text-teal font-medium flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-teal/5 border border-teal/10">
                <span>📊</span>
                <span>Est. {Math.round(weeklyBudget * 2.2)}–{Math.round(weeklyBudget * 3.0)} intelligence cards/week</span>
              </div>

              {error && <p className="text-xs text-danger text-center bg-danger/10 border border-danger/25 p-3 rounded-lg">{error}</p>}

              <div className="flex gap-3">
                <button 
                  className="flex-1 h-11 rounded-xl border border-border bg-background/80 hover:bg-border/60 text-muted-foreground hover:text-foreground font-medium text-sm transition-colors"
                  onClick={() => setStep(2)}
                >
                  ← Back
                </button>
                <button 
                  id="grant-permissions-btn" 
                  className="flex-[2] h-11 rounded-xl bg-gradient-to-r from-teal via-teal-dim to-purple hover:opacity-95 text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_4px_25px_rgba(123,95,212,0.3)]"
                  onClick={grantAndLaunch} 
                  disabled={granting}
                >
                  {granting ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                      <span>Granting ERC-7715 Permission…</span>
                    </>
                  ) : (
                    <>
                      <Shield className="h-4.5 w-4.5" />
                      <span>Grant Permission &amp; Launch Agents</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-muted-foreground/60 leading-relaxed text-center px-4">
                This signs <strong>one</strong> MetaMask transaction (ERC-7715 <code>wallet_grantPermissions</code>). 
                No future approvals. Your ${weeklyBudget}/week cap is enforced by smart contract — agents cannot exceed it.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

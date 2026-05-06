import React, { useState } from 'react';
import { Lock, Zap, TrendingUp, Info, ArrowRight, BarChart3 } from 'lucide-react';

function DonutChart({ principalPct, yieldPct }) {
  const size = 120;
  const strokeWidth = 14;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;

  const pDash = (principalPct / 100) * circ;
  const yDash = (yieldPct / 100) * circ;
  const pOffset = 0;
  const yOffset = -(pDash);

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1E2336" strokeWidth={strokeWidth} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#5B6EF5" strokeWidth={strokeWidth} strokeDasharray={`${pDash} ${circ - pDash}`} strokeDashoffset={pOffset} strokeLinecap="butt" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#A855F7" strokeWidth={strokeWidth} strokeDasharray={`${yDash} ${circ - yDash}`} strokeDashoffset={yOffset} strokeLinecap="butt" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-kamino-text font-mono">{principalPct}%</span>
        <span className="text-[10px] text-kamino-muted">Principal</span>
      </div>
    </div>
  );
}

function StrategyBar({ label, value, total, color, icon: Icon, description }) {
  const safeValue = Number(value) || 0;
  const safeTotal = Number(total) || 0;
  const pct = safeTotal > 0 ? ((safeValue / safeTotal) * 100).toFixed(1) : 0;
  const fmt = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color.icon}`}>
            <Icon size={14} />
          </div>
          <div>
            <p className="text-sm font-medium text-kamino-text">{label}</p>
            <p className="text-[10px] text-kamino-muted">{description}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono text-sm font-semibold text-kamino-text">{fmt(safeValue)}</p>
          <p className={`text-[10px] font-medium ${color.text}`}>{pct}% of total</p>
        </div>
      </div>
      <div className="h-2 bg-kamino-border rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color.bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function VaultBreakdown({ vault }) {
  if (!vault) return null;
  
  // Blindagem: pega os dados que a IA queria ou os que nós temos de verdade
  const principal = vault.principalUSDC || vault.userDeposit || 0;
  const predYield = vault.predictionYield || vault.earned || 0;
  const total = principal + predYield;
  
  const principalPct = total > 0 ? Math.round((principal / total) * 100) : 80;
  const yieldPct = 100 - principalPct;
  const apy = vault.apy || 0;

  const fmt = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="p-4 rounded-xl bg-kamino-bg border border-kamino-border space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-kamino-text">{vault.name || 'Unknown'}</h4>
        <span className="text-xs font-mono text-kamino-green">+{Number(apy).toFixed(2)}% APY</span>
      </div>

      <div className="flex items-center gap-4">
        <DonutChart principalPct={principalPct} yieldPct={yieldPct} />
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm bg-kamino-accent" />
            <span className="text-[11px] text-kamino-dim">Principal</span>
            <span className="ml-auto font-mono text-xs text-kamino-text">{fmt(principal)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm bg-purple-500" />
            <span className="text-[11px] text-kamino-dim">Prediction Yield</span>
            <span className="ml-auto font-mono text-xs text-purple-400">{fmt(predYield)}</span>
          </div>
          <div className="pt-1 border-t border-kamino-border flex items-center gap-2">
            <span className="text-[11px] text-kamino-muted">Total</span>
            <span className="ml-auto font-mono text-xs text-kamino-text font-semibold">{fmt(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Aceitamos 'stats' também, caso 'totals' não venha
export default function YieldStrategy({ vaults = [], totals, stats }) {
  const [activeVault, setActiveVault] = useState(null);
  const [showInfo, setShowInfo] = useState(false);

  // Usa 'totals' ou 'stats', o que tiver dados. Se não tiver nada, vira {}
  const safeData = totals || stats || {};
  
  const principal = safeData.totalPrincipal || safeData.totalDeposited || 0;
  const predYield = safeData.totalPredictionYield || safeData.predictionYield || 0;
  const total = principal + predYield;
  const principalPct = total > 0 ? Math.round((principal / total) * 100) : 80;
  const avgApy = safeData.avgApy || 0;

  return (
    <div className="bg-kamino-card border border-kamino-border rounded-2xl overflow-hidden shadow-card">
      <div className="px-5 py-4 border-b border-kamino-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-purple-400" />
            <h2 className="font-semibold text-kamino-text text-sm">Yield Strategy</h2>
            <button onClick={() => setShowInfo(!showInfo)} className="text-kamino-muted hover:text-kamino-dim transition-colors">
              <Info size={13} />
            </button>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-yield-split/10 border border-purple-500/20">
            <span className="text-[10px] font-medium text-purple-300">Dual-Layer Strategy</span>
          </div>
        </div>

        {showInfo && (
          <div className="mt-3 p-3 rounded-xl bg-kamino-border/20 text-[11px] text-kamino-dim leading-relaxed">
            <strong className="text-kamino-dim">How it works:</strong> Your deposit is split into two layers.
            The <span className="text-kamino-accent">Principal Capital</span> is deployed into Kamino's
            concentrated liquidity vaults for base yield. The <span className="text-purple-400">Prediction Market Yield</span>{' '}
            portion is allocated to directional market strategies using Kamino's AI-powered rebalancing,
            capturing additional returns from market movements.
          </div>
        )}
      </div>

      <div className="p-5 space-y-5">
        <div className="p-4 rounded-xl bg-gradient-to-r from-kamino-accent/5 to-purple-500/5 border border-kamino-accent/20 space-y-4">
          <p className="text-[11px] text-kamino-muted uppercase tracking-wider font-medium">Portfolio Allocation</p>
          <div className="flex items-stretch gap-4">
            <div className="flex flex-col items-center justify-center gap-1">
              <DonutChart principalPct={principalPct} yieldPct={100 - principalPct} />
            </div>
            <div className="flex-1 space-y-3">
              <StrategyBar
                label="Principal Capital" value={principal} total={total} icon={Lock}
                description="Kamino CL Vaults · Base yield"
                color={{ icon: 'bg-kamino-accent/10 text-kamino-accent', bar: 'bg-kamino-accent', text: 'text-kamino-accent' }}
              />
              <StrategyBar
                label="Prediction Market Yield" value={predYield} total={total} icon={Zap}
                description="Directional strategies · Alpha capture"
                color={{ icon: 'bg-purple-500/10 text-purple-400', bar: 'bg-gradient-to-r from-purple-500 to-pink-500', text: 'text-purple-400' }}
              />
            </div>
          </div>
        </div>

        <div className="relative flex items-center gap-3">
          <div className="flex-1 h-px bg-kamino-border" />
          <span className="text-[10px] text-kamino-muted uppercase tracking-wider font-medium px-2">Per-Vault Breakdown</span>
          <div className="flex-1 h-px bg-kamino-border" />
        </div>

        <div className="flex flex-wrap gap-2">
          {Array.isArray(vaults) && vaults.map(v => (
            <button
              key={v.id || Math.random()}
              onClick={() => setActiveVault(activeVault?.id === v.id ? null : v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 ${
                activeVault?.id === v.id ? 'bg-kamino-accent/10 border-kamino-accent/40 text-kamino-accent' : 'border-kamino-border text-kamino-muted hover:border-kamino-accent/20 hover:text-kamino-dim'
              }`}
            >
              {v.name || 'Vault'}
              <ArrowRight size={10} className={`transition-transform ${activeVault?.id === v.id ? 'rotate-90' : ''}`} />
            </button>
          ))}
        </div>

        {activeVault && <VaultBreakdown vault={activeVault} />}

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Principal APY', value: '12–15%', color: 'text-kamino-accent' },
            { label: 'Prediction APY', value: '6–18%', color: 'text-purple-400' },
            { label: 'Total Target APY', value: `${Number(avgApy).toFixed(1)}%`, color: 'text-kamino-green' },
          ].map(({ label, value, color }) => (
            <div key={label} className="p-3 rounded-xl bg-kamino-bg border border-kamino-border text-center">
              <p className="text-[10px] text-kamino-muted mb-1">{label}</p>
              <p className={`text-base font-bold font-mono ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {[
            { label: 'Auto-Rebalance', active: true },
            { label: 'Impermanent Loss Protection', active: true },
            { label: 'Compounding', active: true },
            { label: 'Leverage', active: false },
          ].map(({ label, active }) => (
            <span key={label} className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium border ${active ? 'bg-kamino-green/5 border-kamino-green/20 text-kamino-green' : 'bg-kamino-border/20 border-kamino-border text-kamino-muted line-through'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-kamino-green' : 'bg-kamino-muted'}`} />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
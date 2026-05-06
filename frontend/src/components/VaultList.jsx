import React from 'react';
import { Shield, TrendingUp, ExternalLink, ChevronRight, Activity } from 'lucide-react';

const RISK_CONFIG = {
  'very-low': { label: 'Very Low', color: 'text-kamino-green bg-kamino-green/10 border-kamino-green/20' },
  'low': { label: 'Low', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  'medium': { label: 'Medium', color: 'text-kamino-yellow bg-kamino-yellow/10 border-kamino-yellow/20' },
  'high': { label: 'High', color: 'text-kamino-red bg-kamino-red/10 border-kamino-red/20' },
};

const TOKEN_COLORS = {
  USDC: 'bg-blue-500',
  SOL: 'bg-gradient-to-br from-purple-500 to-pink-500',
  USDT: 'bg-green-500',
  ETH: 'bg-blue-700',
  mSOL: 'bg-green-600',
  BTC: 'bg-orange-500',
};

function TokenBadge({ symbol }) {
  // BLINDAGEM 1: Se o nome da moeda não vier, não faz nada em vez de quebrar a tela
  if (!symbol) return null; 
  const safeSymbol = String(symbol);
  const bg = TOKEN_COLORS[safeSymbol] || 'bg-kamino-muted';
  return (
    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${bg} text-white text-[9px] font-bold border-2 border-kamino-card`}>
      {safeSymbol.slice(0, 2)}
    </span>
  );
}

function ApyBar({ apy }) {
  // BLINDAGEM 2: Protege a matemática do gráfico
  const safeApy = Number(apy) || 0;
  const max = 40;
  const pct = Math.min((safeApy / max) * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-kamino-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-accent-glow transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-kamino-green font-mono font-semibold text-sm min-w-[52px] text-right">
        {safeApy.toFixed(2)}%
      </span>
    </div>
  );
}

export default function VaultList({ vaults = [], selectedVault, onSelect }) {
  const fmt = (n) => {
    const num = Number(n) || 0;
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  const fmtTVL = (n) => {
    const num = Number(n) || 0;
    return num >= 1_000_000 ? `$${(num / 1_000_000).toFixed(1)}M` : `$${(num / 1000).toFixed(0)}K`;
  };

  // BLINDAGEM 3: Se a lista de cofres estiver vazia, não tenta desenhar a tela
  if (!vaults || !Array.isArray(vaults) || vaults.length === 0) {
    return null; 
  }

  return (
    <div className="bg-kamino-card border border-kamino-border rounded-2xl overflow-hidden shadow-card">
      <div className="flex items-center justify-between px-5 py-4 border-b border-kamino-border">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-kamino-accent" />
          <h2 className="font-semibold text-kamino-text text-sm">Active Vault Positions</h2>
          <span className="px-1.5 py-0.5 rounded-md bg-kamino-accent/10 text-kamino-accent text-[11px] font-medium">
            {vaults.length}
          </span>
        </div>
        <a
          href="https://app.kamino.finance/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-[11px] text-kamino-muted hover:text-kamino-accent transition-colors"
        >
          View on Kamino <ExternalLink size={11} />
        </a>
      </div>

      <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_40px] gap-3 px-5 py-2.5 text-[11px] font-medium text-kamino-muted uppercase tracking-wider border-b border-kamino-border/50">
        <span>Vault</span>
        <span>Strategy</span>
        <span>APY</span>
        <span>Your Deposit</span>
        <span>Earned</span>
        <span></span>
      </div>

      <div className="divide-y divide-kamino-border/40">
        {vaults.map((vault) => {
          const risk = RISK_CONFIG[vault.risk] || RISK_CONFIG.medium;
          const isSelected = selectedVault?.id === vault.id;

          // BLINDAGEM 4: Procura as moedas de qualquer jeito, independentemente do nome que a IA inventou
          const tokenA = vault.tokenA || (vault.tokens && vault.tokens[0]) || 'USDC';
          const tokenB = vault.tokenB || (vault.tokens && vault.tokens[1]) || 'SOL';

          return (
            <div
              key={vault.id || Math.random()}
              onClick={() => onSelect && onSelect(isSelected ? null : vault)}
              className={`grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_40px] gap-3 px-5 py-4 cursor-pointer transition-all duration-150 group ${
                isSelected
                  ? 'bg-kamino-accent/5 border-l-2 border-l-kamino-accent'
                  : 'hover:bg-kamino-border/20 border-l-2 border-l-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex -space-x-1.5 flex-shrink-0">
                  <TokenBadge symbol={tokenA} />
                  <TokenBadge symbol={tokenB} />
                </div>
                <div>
                  <p className="font-medium text-kamino-text text-sm group-hover:text-white transition-colors">
                    {vault.name || 'Unknown Vault'}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium border ${risk.color}`}>
                      <Shield size={9} />
                      {risk.label} Risk
                    </span>
                    <span className="text-[10px] text-kamino-muted font-mono">
                      TVL {fmtTVL(vault.tvl)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex md:items-center">
                <span className="text-xs text-kamino-dim">{vault.strategy || 'Standard'}</span>
              </div>

              <div className="flex md:items-center">
                <div className="w-full md:max-w-[120px]">
                  <ApyBar apy={vault.apy} />
                </div>
              </div>

              <div className="flex md:items-center">
                <div>
                  <p className="font-mono text-sm text-kamino-text font-medium">{fmt(vault.userDeposit)}</p>
                  <p className="text-[10px] text-kamino-muted">USDC</p>
                </div>
              </div>

              <div className="flex md:items-center">
                <div>
                  <p className="font-mono text-sm text-kamino-green font-medium">+{fmt(vault.earned)}</p>
                  <p className="text-[10px] text-kamino-muted">Lifetime</p>
                </div>
              </div>

              <div className="hidden md:flex items-center justify-center">
                <ChevronRight
                  size={16}
                  className={`text-kamino-muted transition-all duration-150 ${isSelected ? 'rotate-90 text-kamino-accent' : 'group-hover:text-kamino-dim'}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
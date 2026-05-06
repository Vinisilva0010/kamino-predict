import React from 'react';
import { TrendingUp, DollarSign, Percent, Zap } from 'lucide-react';

function StatCard({ icon: Icon, label, value, sub, color = 'accent' }) {
  const colorMap = {
    accent: 'text-kamino-accent bg-kamino-accent/10 border-kamino-accent/20',
    green: 'text-kamino-green bg-kamino-green/10 border-kamino-green/20',
    yellow: 'text-kamino-yellow bg-kamino-yellow/10 border-kamino-yellow/20',
    purple: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  };

  return (
    <div className="bg-kamino-card border border-kamino-border rounded-2xl p-4 flex items-center gap-4 shadow-card hover:border-kamino-accent/20 transition-all duration-200">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colorMap[color]}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-[11px] text-kamino-muted font-medium uppercase tracking-wider">{label}</p>
        <p className="text-xl font-semibold text-kamino-text mt-0.5 font-mono">{value}</p>
        {sub && <p className="text-[11px] text-kamino-dim mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// Nós trocamos o 'totals' fajuto por 'stats', e colocamos um valor padrão '{}' para nunca quebrar.
export default function StatsBar({ stats = {} }) {
  const fmt = (n) => {
    if (!n || isNaN(n)) return "$0.00"; // Blindagem contra números vazios
    return n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(2)}M`
      : `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Puxando os dados com segurança (se vier vazio, vira zero)
  const deposited = stats.totalDeposited || 0;
  const earned = stats.totalEarned || 0;
  const apy = stats.avgApy || 0;
  const predYield = stats.predictionYield || 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        icon={DollarSign}
        label="Total Deposited"
        value={fmt(deposited)}
        sub="Across all vaults"
        color="accent"
      />
      <StatCard
        icon={TrendingUp}
        label="Total Earned"
        value={fmt(earned)}
        sub="Lifetime yield"
        color="green"
      />
      <StatCard
        icon={Percent}
        label="Avg APY"
        value={`${apy.toFixed(2)}%`}
        sub="Weighted average"
        color="yellow"
      />
      <StatCard
        icon={Zap}
        label="Prediction Yield"
        value={fmt(predYield)}
        sub="Market strategy share"
        color="purple"
      />
    </div>
  );
}
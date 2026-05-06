import React, { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const fmt = (n) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return (
    <div className="bg-kamino-card border border-kamino-border rounded-xl p-3 shadow-card text-xs space-y-1.5">
      <p className="text-kamino-muted font-medium">{label}</p>
      {payload.map(entry => (
        <div key={entry.name} className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            <span className="text-kamino-dim">{entry.name}</span>
          </div>
          <span className="font-mono text-kamino-text font-medium">{fmt(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function YieldChart({ data }) {
  const [view, setView] = useState('stacked');

  return (
    <div className="bg-kamino-card border border-kamino-border rounded-2xl overflow-hidden shadow-card">
      <div className="flex items-center justify-between px-5 py-4 border-b border-kamino-border">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-kamino-green" />
          <h2 className="font-semibold text-kamino-text text-sm">Portfolio Performance</h2>
          <span className="text-[10px] text-kamino-muted">30 days</span>
        </div>
        <div className="flex items-center gap-1 p-0.5 bg-kamino-bg rounded-lg border border-kamino-border">
          {['stacked', 'split'].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all ${
                view === v ? 'bg-kamino-card text-kamino-text shadow' : 'text-kamino-muted hover:text-kamino-dim'
              }`}
            >
              {v === 'stacked' ? 'Combined' : 'Split'}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            {view === 'stacked' ? (
              <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gradPrincipal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5B6EF5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#5B6EF5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradPrediction" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A855F7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2336" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#6B7280', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval={6}
                />
                <YAxis
                  tick={{ fill: '#6B7280', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                  width={44}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '12px', color: '#6B7280' }}
                  formatter={(value) => <span style={{ color: '#94A3B8' }}>{value}</span>}
                />
                <Area
                  type="monotone"
                  dataKey="principal"
                  name="Principal Capital"
                  stroke="#5B6EF5"
                  strokeWidth={2}
                  fill="url(#gradPrincipal)"
                  stackId="1"
                />
                <Area
                  type="monotone"
                  dataKey="predictionYield"
                  name="Prediction Market Yield"
                  stroke="#A855F7"
                  strokeWidth={2}
                  fill="url(#gradPrediction)"
                  stackId="1"
                />
              </AreaChart>
            ) : (
              <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2336" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#6B7280', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval={6}
                />
                <YAxis
                  tick={{ fill: '#6B7280', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                  width={44}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '12px', color: '#6B7280' }}
                  formatter={(value) => <span style={{ color: '#94A3B8' }}>{value}</span>}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Total Portfolio"
                  stroke="#22C55E"
                  strokeWidth={2}
                  fill="url(#gradTotal)"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-kamino-border">
          {[
            { label: '30D Change', value: '+$1,950', color: 'text-kamino-green' },
            { label: 'Avg Daily Yield', value: '+$65', color: 'text-kamino-green' },
            { label: 'Peak Portfolio', value: '$31,800', color: 'text-kamino-text' },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center">
              <p className="text-[10px] text-kamino-muted">{label}</p>
              <p className={`text-sm font-mono font-semibold mt-0.5 ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Clock, Trash2 } from 'lucide-react';

function relativeTime(iso) {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

export default function TxHistory({ txHistory, onClear }) {
  if (txHistory.length === 0) {
    return (
      <div className="bg-kamino-card border border-kamino-border rounded-2xl p-6 text-center shadow-card">
        <Clock size={28} className="text-kamino-border mx-auto mb-2" />
        <p className="text-sm text-kamino-muted">No transactions yet</p>
        <p className="text-[11px] text-kamino-border mt-1">Deposits and withdrawals will appear here</p>
      </div>
    );
  }

  return (
    <div className="bg-kamino-card border border-kamino-border rounded-2xl overflow-hidden shadow-card">
      <div className="flex items-center justify-between px-5 py-4 border-b border-kamino-border">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-kamino-muted" />
          <h2 className="font-semibold text-kamino-text text-sm">Transaction History</h2>
          <span className="px-1.5 py-0.5 rounded-md bg-kamino-border/40 text-kamino-muted text-[11px]">
            {txHistory.length}
          </span>
        </div>
        <button
          onClick={onClear}
          className="flex items-center gap-1.5 text-[11px] text-kamino-muted hover:text-kamino-red transition-colors"
        >
          <Trash2 size={12} />
          Clear
        </button>
      </div>

      <div className="divide-y divide-kamino-border/40 max-h-64 overflow-y-auto">
        {txHistory.map(tx => (
          <div key={tx.id} className="flex items-center gap-3 px-5 py-3 hover:bg-kamino-border/10 transition-colors">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              tx.type === 'deposit'
                ? 'bg-kamino-green/10 text-kamino-green border border-kamino-green/20'
                : 'bg-kamino-red/10 text-kamino-red border border-kamino-red/20'
            }`}>
              {tx.type === 'deposit' ? <ArrowDownToLine size={14} /> : <ArrowUpFromLine size={14} />}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-kamino-text truncate">
                {tx.type === 'deposit' ? 'Deposited' : 'Withdrew'} to {tx.vaultName}
              </p>
              <p className="text-[10px] text-kamino-muted">{relativeTime(tx.ts)}</p>
            </div>

            <div className="text-right flex-shrink-0">
              <p className={`font-mono text-sm font-semibold ${tx.type === 'deposit' ? 'text-kamino-green' : 'text-kamino-red'}`}>
                {tx.type === 'deposit' ? '+' : '-'}${parseFloat(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-kamino-muted">USDC</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

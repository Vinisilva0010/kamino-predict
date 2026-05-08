import React from 'react';
import { RefreshCw, Bell } from 'lucide-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function Header({ loading, onRefresh, lastUpdated }) {
  return (
    <header className="sticky top-0 z-50 border-b border-kamino-border bg-kamino-bg/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Logo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-accent-glow flex items-center justify-center shadow-glow-accent">
            <span className="text-white font-bold text-sm">K</span>
          </div>
          <div>
            <span className="font-semibold text-kamino-text text-sm tracking-wide">Kamino</span>
            <span className="text-kamino-accent font-semibold text-sm"> Vault</span>
          </div>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-kamino-accent/10 text-kamino-accent border border-kamino-accent/20">
            DEVNET 
          </span>
        </div>

        

        {/* Right controls */}
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <span className="hidden sm:block text-[11px] text-kamino-muted font-mono">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 rounded-lg text-kamino-muted hover:text-kamino-text hover:bg-kamino-card transition-all duration-150 disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>

            <button className="p-2 rounded-lg text-kamino-muted hover:text-kamino-text hover:bg-kamino-card transition-all duration-150 relative">
              <Bell size={15} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-kamino-accent"></span>
            </button>
          </div>

          {/* O BOTÃO OFICIAL DA SOLANA ENTRA AQUI */}
          <WalletMultiButton className="!bg-kamino-card !border !border-kamino-border hover:!border-kamino-accent/40 !h-9 !rounded-xl !text-sm !font-mono !px-4 transition-all" />
        </div>
      </div>
    </header>
  );
}
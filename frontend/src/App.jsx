import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import '@solana/wallet-adapter-react-ui/styles.css';

import Header from './components/Header';
import StatsBar from './components/StatsBar';
import YieldChart from './components/YieldChart';
import VaultList from './components/VaultList';
import DepositWithdraw from './components/DepositWithdraw';
import YieldStrategy from './components/YieldStrategy';
import { useKaminoData } from './hooks/useKaminoData';

export default function App() {
  const { vaultData, history, stats, loading } = useKaminoData();
  const [selectedVaultId, setSelectedVaultId] = React.useState('usdc-sol');

  const selectedVault = vaultData?.find(v => v.id === selectedVaultId) || null;
  const safeStats = stats || {};

  const endpoint = "http://127.0.0.1:8899";
  const wallets = useMemo(() => [new SolflareWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="min-h-screen bg-kamino-base text-kamino-text pb-12 font-sans selection:bg-kamino-accent/30">
            
            <div className="absolute top-4 right-4 z-50">
              <WalletMultiButton className="bg-accent-glow hover:bg-kamino-accent transition-colors" />
            </div>

            <Header />

            {loading ? (
              <div className="flex items-center justify-center mt-32">
                <div className="text-kamino-accent animate-pulse font-mono text-lg">
                  Carregando dados da blockchain...
                </div>
              </div>
            ) : (
              <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 space-y-6">
                
                {/* LIGANDO TODOS OS GRÁFICOS NOVAMENTE */}
                <StatsBar stats={safeStats} /> 
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <YieldChart history={history} />
                    <VaultList vaults={vaultData} selectedVault={selectedVault} onSelect={(v) => setSelectedVaultId(v?.id)} />
                  </div>
                  <div className="space-y-6">
                    <DepositWithdraw vault={selectedVault} />
                    <YieldStrategy vaults={vaultData} stats={safeStats} />
                  </div>
                </div>

              </main>
            )}
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
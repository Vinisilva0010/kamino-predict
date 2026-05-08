import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import '@solana/wallet-adapter-react-ui/styles.css';

import Header from './components/Header';
import StatsBar from './components/StatsBar';
import YieldChart from './components/YieldChart';
import VaultList from './components/VaultList';
import DepositWithdraw from './components/DepositWithdraw';
import YieldStrategy from './components/YieldStrategy';
import { useKaminoData } from './hooks/useKaminoData';

// 1. O RECHEIO: Todo o seu site agora vive aqui DENTRO
function AppContent() {
  // Agora sim! O radar é chamado depois que a carteira já existe na Casca.
  const { vaultData, history, stats, loading } = useKaminoData();
  const [selectedVaultId, setSelectedVaultId] = React.useState('usdc-sol');

  const selectedVault = vaultData?.find(v => v.id === selectedVaultId) || null;
  const safeStats = stats || {};

  return (
    <div className="min-h-screen bg-kamino-base text-kamino-text pb-12 font-sans selection:bg-kamino-accent/30">
      <Header loading={loading} />

      {loading ? (
        <div className="flex items-center justify-center mt-32">
          <div className="text-kamino-accent animate-pulse font-mono text-lg">
            Sincronizando com a Blockchain Local...
          </div>
        </div>
      ) : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 space-y-6">
          <StatsBar stats={safeStats} /> 
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <YieldChart data={history} />
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
  );
}

// 2. A CASCA: Ela apenas prepara a Solana e a Phantom
export default function App() {
  const endpoint = "https://api.devnet.solana.com";
  const wallets = useMemo(() => [new SolflareWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {/* O recheio é injetado aqui! */}
          <AppContent />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
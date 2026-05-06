import { useState, useEffect } from 'react';

export function useKaminoData() {
  const [loading, setLoading] = useState(true);

  // Força a tela de loading a sumir rápido
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Blindagem 1: Todas as estatísticas possíveis para o StatsBar e YieldStrategy
  const stats = {
    totalDeposited: 29450,
    totalEarned: 1635,
    avgApy: 21.35,
    predictionYield: 5950,
    totalPrincipal: 25000,
    portfolioPerformance: 100
  };

  // Blindagem 2: Todas as variações de moedas para o VaultList não quebrar o .slice()
  const vaultData = [
    {
      id: 'usdc-sol',
      name: 'Kamino Predict Vault',
      tokens: ['USDC', 'SOL'], // Para o componente que espera Array
      token: 'USDC',           // Para o componente que espera String
      symbol: 'USDC-SOL',
      apy: 21.35,
      userDeposit: 1000,
      earned: 10,
      strategy: 'Yield & Predict'
    }
  ];

  const history = [
    { date: 'Apr 7', principal: 25000, yield: 5000 },
    { date: 'May 5', principal: 26000, yield: 5950 }
  ];

  return { 
    vaultData, 
    history, 
    stats, 
    loading, 
    deposit: async () => ({ success: true }), 
    withdraw: async () => ({ success: true }) 
  };
}
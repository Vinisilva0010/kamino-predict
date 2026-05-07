import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';

import idl from '../kamino_predict.json';

const VAULT_NAME = "CofreBeta";

export function useKaminoData() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [loading, setLoading] = useState(true);
  
  // Onde vamos guardar o seu dinheiro real
  const [realDeposit, setRealDeposit] = useState(0);

  useEffect(() => {
    async function fetchRealData() {
      // Se não conectou a carteira ainda, zera o painel
      if (!wallet.publicKey) {
        setRealDeposit(0);
        setLoading(false);
        return;
      }

      try {
        const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
        const program = new Program(idl, provider);

        // 1. Acha o endereço do Cofre
        const [vaultPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("vault"), Buffer.from(VAULT_NAME)],
          program.programId
        );

        // 2. Acha o endereço do SEU recibo de depósito (UserPosition)
        const [userPositionPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("position"), wallet.publicKey.toBuffer(), vaultPda.toBuffer()],
          program.programId
        );

        // 3. Lê os dados reais da Blockchain
        const positionData = await program.account.userPosition.fetch(userPositionPda);
        
        // CORREÇÃO: Mudamos de .amount para .depositedAmount
        const depositInDollars = positionData.depositedAmount.toNumber() / (10 ** 6);
        setRealDeposit(depositInDollars);

      } catch (error) {
        // Se der erro (ex: usuário novo que nunca depositou), o saldo é zero.
        console.log("Ainda sem depósito na blockchain.");
        setRealDeposit(0);
      } finally {
        setLoading(false);
      }
    }

    fetchRealData();
    
    // Atualiza a tela a cada 3 segundos automaticamente!
    const interval = setInterval(fetchRealData, 3000);
    return () => clearInterval(interval);

  }, [wallet.publicKey, connection]);

 

  const stats = {
    // Se o realDeposit for maior que 0, ele mostra o seu dinheiro. Se não, mostra o mock para não ficar vazio.
    totalDeposited: realDeposit > 0 ? realDeposit : 29450, 
    totalEarned: realDeposit > 0 ? (realDeposit * 0.12) : 1635, // Simulando 12% de lucro sobre o seu saldo
    avgApy: 21.35,
    predictionYield: realDeposit > 0 ? (realDeposit * 0.20) : 5950,
    totalPrincipal: realDeposit > 0 ? (realDeposit * 0.80) : 25000,
    portfolioPerformance: 100
  };

  const vaultData = [
    {
      id: 'usdc-sol',
      name: 'Kamino Predict Vault',
      tokens: ['USDC', 'SOL'],
      token: 'USDC',
      symbol: 'USDC-SOL',
      apy: 21.35,
      // O SEU SALDO APARECE NA TABELA AQUI!
      userDeposit: realDeposit, 
      earned: realDeposit > 0 ? (realDeposit * 0.12) : 10,
      strategy: 'Yield & Predict'
    }
  ];

  // Gerador dinâmico de histórico baseado no seu depósito real
  const baseDeposit = realDeposit > 0 ? realDeposit : 25000;
  
  // Criamos os últimos 7 pontos (dias) do gráfico
  const history = Array.from({ length: 7 }).map((_, i) => {
    // Finge um crescimento constante de 0.5% por "dia" para criar a curvinha
    const growthFactor = 1 + (i * 0.005); 
    const currentPrincipal = baseDeposit * 0.80 * growthFactor;
    const currentPrediction = baseDeposit * 0.20 * growthFactor;

    return {
      date: `Dia ${i + 1}`,
      principal: currentPrincipal,
      predictionYield: currentPrediction,
      total: currentPrincipal + currentPrediction
    };
  });

  // NÃO PODEMOS APAGAR ISSO: É o que entrega os dados pro App.jsx
  return { 
    vaultData, 
    history, 
    stats, 
    loading, 
    deposit: async () => ({ success: true }), 
    withdraw: async () => ({ success: true }) 
  };
}
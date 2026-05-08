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

 

 
  const isConnected = !!wallet.publicKey;
  const displayDeposit = isConnected ? realDeposit : 0;

  const stats = {
    totalDeposited: displayDeposit, 
    totalEarned: displayDeposit * 0.12, 
    avgApy: 21.35, // O APY a gente mantém porque é a taxa do cofre!
    predictionYield: displayDeposit * 0.20,
    totalPrincipal: displayDeposit * 0.80,
    portfolioPerformance: isConnected ? 100 : 0
  };

  const vaultData = [
    {
      id: 'usdc-sol',
      name: 'Kamino Predict Vault',
      tokens: ['USDC', 'SOL'],
      token: 'USDC',
      symbol: 'USDC-SOL',
      apy: 21.35,
      userDeposit: displayDeposit, 
      earned: displayDeposit * 0.12,
      strategy: 'Yield & Predict'
    }
  ];

  // Gráfico zera se não tiver carteira conectada
  const history = Array.from({ length: 7 }).map((_, i) => {
    const growthFactor = 1 + (i * 0.005); 
    const currentPrincipal = displayDeposit * 0.80 * growthFactor;
    const currentPrediction = displayDeposit * 0.20 * growthFactor;

    return {
      date: `Dia ${i + 1}`,
      principal: currentPrincipal,
      predictionYield: currentPrediction,
      total: currentPrincipal + currentPrediction
    };
  });

  return { 
    vaultData, 
    history, 
    stats, 
    loading, 
    deposit: async () => ({ success: true }), 
    withdraw: async () => ({ success: true }) 
  };
}
import React, { useState, useEffect } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Wallet, Info, CheckCircle, AlertCircle, X } from 'lucide-react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';

// Importa o dicionário gerado pelo Rust
import idl from '../kamino_predict.json';


const FAKE_USDC_MINT = new PublicKey("4T2VJZ5pmTESnZUXYTbCAwtQ1PQeFf5FBhX6kEhJ4DR1");

function Toast({ msg, type, onClose }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border text-sm animate-pulse ${
      type === 'success' ? 'bg-kamino-green/10 border-kamino-green/30 text-kamino-green' : 'bg-kamino-red/10 border-kamino-red/30 text-kamino-red'
    }`}>
      {type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      <span className="flex-1">{msg}</span>
      <button onClick={onClose} className="opacity-60 hover:opacity-100"><X size={14} /></button>
    </div>
  );
}

export default function DepositWithdraw({ vault }) {
  const [tab, setTab] = useState('deposit');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  
  // Conexões Reais com a Solana
  const { connection } = useConnection();
  const wallet = useWallet();
  const [realBalance, setRealBalance] = useState(0);

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Lê o saldo real da carteira
  useEffect(() => {
    async function fetchBalance() {
      if (wallet.publicKey) {
        try {
          const userTokenAccount = await getAssociatedTokenAddress(FAKE_USDC_MINT, wallet.publicKey);
          const balance = await connection.getTokenAccountBalance(userTokenAccount);
          setRealBalance(balance.value.uiAmount || 0);
        } catch (e) {
          setRealBalance(0);
        }
      } else {
        setRealBalance(0);
      }
    }
    fetchBalance();
  }, [wallet.publicKey, connection, tab]);

  // A Transação On-Chain Real
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!wallet.publicKey || !wallet.signTransaction) {
      showToast('Connect your wallet first.', 'error');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      showToast('Enter a valid amount.', 'error');
      return;
    }

    setLoading(true);
    try {
      const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
      const program = new Program(idl, provider);
      const vaultName = "CofreBeta"; // O nosso cofre

      const [vaultPda] = PublicKey.findProgramAddressSync([Buffer.from("vault"), Buffer.from(vaultName)], program.programId);
      const [vaultTokenPda] = PublicKey.findProgramAddressSync([Buffer.from("vault_token"), vaultPda.toBuffer()], program.programId);
      const [userPositionPda] = PublicKey.findProgramAddressSync([Buffer.from("position"), wallet.publicKey.toBuffer(), vaultPda.toBuffer()], program.programId);
      const userTokenAccount = await getAssociatedTokenAddress(FAKE_USDC_MINT, wallet.publicKey);

      // Decimais de verdade: multiplica por 1 milhão
      const amountBN = new BN(parseFloat(amount) * 1_000_000);

    let tx;
      if (tab === 'deposit') {
        tx = await program.methods.deposit(vaultName, amountBN)
          .accounts({
            user: wallet.publicKey,
            acceptedMint: FAKE_USDC_MINT,
            vaultConfig: vaultPda,
            vaultUsdcAccount: vaultTokenPda,
            userTokenAccount: userTokenAccount,
            userPosition: userPositionPda,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId, 
          }).rpc();
      } else {
        tx = await program.methods.withdraw(vaultName, amountBN)
          .accounts({
            user: wallet.publicKey,
            acceptedMint: FAKE_USDC_MINT,
            vaultConfig: vaultPda,
            vaultUsdcAccount: vaultTokenPda,
            userTokenAccount: userTokenAccount,
            userPosition: userPositionPda,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId, 
          }).rpc();
      }

      showToast(`Success! TX: ${tx.slice(0, 8)}...`, 'success');
      setAmount('');
      // Força recarga do saldo
      setRealBalance(prev => tab === 'deposit' ? prev - parseFloat(amount) : prev + parseFloat(amount));
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Transaction failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const max = tab === 'deposit' ? realBalance : 1000; // Simplificação para saque
  const pct = max > 0 && parseFloat(amount) > 0 ? Math.min((parseFloat(amount) / max) * 100, 100) : 0;

  return (
    <div className="bg-kamino-card border border-kamino-border rounded-2xl overflow-hidden shadow-card">
      <div className="px-5 py-4 border-b border-kamino-border">
        <h2 className="font-semibold text-kamino-text text-sm flex items-center gap-2">
          <Wallet size={16} className="text-kamino-accent" /> Manage Position
        </h2>
      </div>

      <div className="p-5 space-y-4">
        <div className="flex rounded-xl overflow-hidden border border-kamino-border bg-kamino-bg p-0.5 gap-0.5">
          {[
            { id: 'deposit', label: 'Deposit', icon: ArrowDownToLine },
            { id: 'withdraw', label: 'Withdraw', icon: ArrowUpFromLine },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setTab(id); setAmount(''); setToast(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                tab === id ? (id === 'deposit' ? 'bg-accent-glow text-white shadow-glow-accent' : 'bg-kamino-red/20 text-kamino-red border border-kamino-red/30') : 'text-kamino-muted hover:text-kamino-dim'
              }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        <div className="flex justify-between text-xs text-kamino-muted">
          <span>{tab === 'deposit' ? 'Real Wallet Balance' : 'Max Withdraw'}</span>
          <span className="font-mono text-kamino-dim">
            ${max.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDC
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative border rounded-xl transition-all duration-200 border-kamino-border focus-within:border-kamino-accent/60 bg-kamino-bg">
            <div className="flex items-center">
              <div className="flex items-center gap-2 px-3 py-3 border-r border-kamino-border">
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center"><span className="text-[9px] font-bold text-white">U</span></div>
                <span className="text-xs font-medium text-kamino-dim">USDC</span>
              </div>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="flex-1 bg-transparent px-3 py-3 text-kamino-text font-mono text-base focus:outline-none placeholder-kamino-border"
              />
            </div>
            {pct > 0 && (
              <div className="h-0.5 mx-3 mb-2 bg-kamino-border rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${tab === 'deposit' ? 'bg-kamino-accent' : 'bg-kamino-red'}`} style={{ width: `${pct}%` }} />
              </div>
            )}
          </div>

          {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

          <button
            type="submit"
            disabled={loading || !amount || parseFloat(amount) <= 0}
            className={`w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
              tab === 'deposit' ? 'bg-accent-glow text-white shadow-glow-accent' : 'bg-kamino-red/20 text-kamino-red border border-kamino-red/30'
            }`}
          >
            {loading ? 'Processing on Solana...' : (tab === 'deposit' ? `Deposit Real USDC` : `Withdraw Real USDC`)}
          </button>
        </form>
      </div>
    </div>
  );
}
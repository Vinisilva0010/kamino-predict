import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';
import bs58 from 'bs58';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

dotenv.config();

// 1. INICIALIZAÇÃO DA CONEXÃO
// Aponta para o nosso localhost (depois mudaremos para Mainnet)
const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8899';
const connection = new Connection(RPC_URL, 'confirmed');

// 2. CONFIGURAÇÃO DA CARTEIRA DO ADMIN (BOT)
let crankKeypair: Keypair;
if (process.env.CRANK_SECRET_KEY) {
    // Modo Produção: Pega a chave privada em Base58 do .env
    crankKeypair = Keypair.fromSecretKey(bs58.decode(process.env.CRANK_SECRET_KEY));
} else {
    // Modo Hackathon/Local: Usa a chave padrão da Solana instalada na sua máquina
    const localKeyPath = path.join(os.homedir(), '.config', 'solana', 'id.json');
    const secretKeyArray = JSON.parse(fs.readFileSync(localKeyPath, 'utf-8'));
    crankKeypair = Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));
    console.log(`⚠️ CRANK_SECRET_KEY não encontrada. Usando carteira local: ${localKeyPath}`);
}

const wallet = new Wallet(crankKeypair);
const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });

// 3. CARREGANDO O MAPA DO CONTRATO (IDL)
// O Anchor gerou isso na pasta target quando compilamos o Rust
const idlPath = path.resolve(__dirname, '../target/idl/kamino_predict.json');
const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));

// Substitua pelo Program ID real que está no seu lib.rs
const PROGRAM_ID = new PublicKey("radCWLzDo2E2LnEqdY8H8mitLfzSzAVNGfzHyX2foe5");
const program = new Program(idl, provider);

// 4. O MOTOR DO CRANK (A MANIVELA)
async function runCrank() {
    console.log(`\n🤖 Crank Iniciado | Admin: ${crankKeypair.publicKey.toBase58()}`);
    console.log(`🔌 Conectado na rede: ${RPC_URL}`);

    // Vamos simular o nome do cofre que criaremos mais tarde
    const vaultName = "CofreAlpha";

    try {
        // Encontra o endereço PDA do cofre (A mesma matemática que o Rust usa)
        const [vaultPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("vault"), Buffer.from(vaultName)],
            program.programId
        );

        console.log(`🔍 Procurando Vault: ${vaultPda.toBase58()}...`);

        // Dispara a instrução on-chain!
        const tx = await (program.methods as any)
            .harvestAndPredict(vaultName)
            .accounts({
                admin: crankKeypair.publicKey,
                vaultConfig: vaultPda,
            })
            .rpc();

        console.log(`✅ SUCESSO! Yield Extraído e Alocado! Hash da Transação: \n${tx}`);

    } catch (error: any) {
        // Se o cofre ainda não existir na rede, ele vai dar erro de 'AccountNotInitialized'. Isso é esperado agora!
        console.error(`❌ Aviso do Crank: ${error.message || error}`);
    }
}

// 5. LOOP DE EXECUÇÃO
console.log("🚀 Iniciando sistema de monitoramento de Yield...");
runCrank(); // Roda a primeira vez
setInterval(runCrank, 15 * 1000); // Continua girando a manivela a cada 15 segundos
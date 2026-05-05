import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { createMint, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// 1. Conexão com a sua Matrix (Localnet)
const RPC_URL = 'http://127.0.0.1:8899';
const connection = new Connection(RPC_URL, 'confirmed');

// 2. Puxando a sua chave de Admin
const localKeyPath = path.join(os.homedir(), '.config', 'solana', 'id.json');
const secretKeyArray = JSON.parse(fs.readFileSync(localKeyPath, 'utf-8'));
const adminKeypair = Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));
const wallet = new Wallet(adminKeypair);
const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });

// 3. Lendo o mapa do Contrato (IDL)
const idlPath = path.resolve(__dirname, '../target/idl/kamino_predict.json');
const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));
const PROGRAM_ID = new PublicKey("radCWLzDo2E2LnEqdY8H8mitLfzSzAVNGfzHyX2foe5");
const program = new Program(idl, provider);

async function setup() {
    console.log(`\n🔑 Usando carteira: ${adminKeypair.publicKey.toBase58()}`);

    // PASSO A: Imprimir o "Fake USDC" na rede
    console.log("💵 Criando o token USDC (Fake) na rede local...");
    const fakeUsdcMint = await createMint(
        connection,
        adminKeypair,
        adminKeypair.publicKey, // Autoridade que pode emitir o token
        null, // Autoridade de congelamento
        6 // 6 decimais (Padrão real do USDC)
    );
    console.log(`✅ Fake USDC Mint criado: ${fakeUsdcMint.toBase58()}`);

    // PASSO B: Preparar os parâmetros do Cofre
    const vaultName = "CofreBeta";
    const params = {
        name: vaultName, // CORRIGIDO AQUI!
        kaminoAllocationBps: 8000,
        predictionAllocationBps: 2000
    };

    // PASSO C: Encontrar os Endereços do Cofre (PDAs)
    const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), Buffer.from(vaultName)],
        program.programId
    );

    const [vaultTokenPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault_token"), vaultPda.toBuffer()],
        program.programId
    );

    console.log(`\n🏦 Inicializando o cofre '${vaultName}'...`);
    console.log(`   Endereço do Vault (PDA): ${vaultPda.toBase58()}`);
    console.log(`   Conta de Token do Vault: ${vaultTokenPda.toBase58()}`);

    // PASSO D: Mandar a transação para o Smart Contract
    try {
        const tx = await (program.methods as any)
            .initializeVault(params)
            .accounts({
                admin: adminKeypair.publicKey,
                vaultConfig: vaultPda,
                vaultTokenAccount: vaultTokenPda,
                acceptedMint: fakeUsdcMint,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            })
            .rpc();

        console.log(`\n✅ SUCESSO ABSOLUTO! Cofre inicializado!`);
        console.log(`🔗 TX Hash: ${tx}`);
        console.log(`\n⚠️ ATENÇÃO: Anote o endereço do Fake USDC Mint acima. Ele será nosso ativo principal nos testes!`);
    } catch (error: any) {
        console.error(`\n❌ Erro ao inicializar o cofre:`, error.message || error);
    }
}

setup();
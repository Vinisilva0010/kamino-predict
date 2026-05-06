import { Connection, Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet, BN } from '@coral-xyz/anchor';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// 1. Conexão com a Localnet
const RPC_URL = 'http://127.0.0.1:8899';
const connection = new Connection(RPC_URL, 'confirmed');

// 2. Setup do Usuário (Admin)
const localKeyPath = path.join(os.homedir(), '.config', 'solana', 'id.json');
const secretKeyArray = JSON.parse(fs.readFileSync(localKeyPath, 'utf-8'));
const userKeypair = Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));
const wallet = new Wallet(userKeypair);
const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });

const idlPath = path.resolve(__dirname, '../target/idl/kamino_predict.json');
const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));
const program = new Program(idl, provider);

// ⚠️ MANTENHA O SEU NOVO ENDEREÇO AQUI:
const FAKE_USDC_MINT = new PublicKey("4T2VJZ5pmTESnZUXYTbCAwtQ1PQeFf5FBhX6kEhJ4DR1");
const vaultName = "CofreBeta";

async function simulateDeposit() {
    console.log(`\n🧑‍💻 Usuário: ${userKeypair.publicKey.toBase58()}`);

    // 1. Achar as PDAs do cofre
    const [vaultPda] = PublicKey.findProgramAddressSync([Buffer.from("vault"), Buffer.from(vaultName)], program.programId);
    const [vaultTokenPda] = PublicKey.findProgramAddressSync([Buffer.from("vault_token"), vaultPda.toBuffer()], program.programId);

    // 2. Pegar a conta de token do usuário (que já criamos via CLI)
    const userTokenAccount = await getAssociatedTokenAddress(FAKE_USDC_MINT, userKeypair.publicKey);
    console.log(`✅ Usando a conta USDC existente: ${userTokenAccount.toBase58()}`);

    // 3. Inicializar o Cofre com os parâmetros EXATOS exigidos pelo Rust
    try {
        const vaultInfo = await connection.getAccountInfo(vaultPda);
        if (!vaultInfo) {
            console.log("🛠️ Construindo o CofreBeta na blockchain...");
            
            // O pacote perfeito para o InitializeVaultParams
            const params = {
                name: vaultName,
                kaminoAllocationBps: 8000,     // 80% Kamino
                predictionAllocationBps: 2000, // 20% Prediction Market
            };

            await (program.methods as any)
                .initializeVault(params)
                .accounts({
                    admin: userKeypair.publicKey,
                    acceptedMint: FAKE_USDC_MINT,
                    vaultConfig: vaultPda,
                    vaultTokenAccount: vaultTokenPda, // Nome exato do Rust
                    systemProgram: SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    rent: SYSVAR_RENT_PUBKEY,
                })
                .rpc();
            console.log("🏦 CofreBeta reconstruído com sucesso com 80/20 de split!");
        } else {
            console.log("🏦 CofreBeta já existe. Pulando criação.");
        }
    } catch (e: any) {
        console.error("❌ Erro fatal na inicialização do cofre:", e.message || e);
        return; // Aborta se falhar a criação
    }

    // 4. Fazer o Depósito
    const amountToDeposit = 100 * 10**6; // 100 USDC para teste
    const [userPositionPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("position"), userKeypair.publicKey.toBuffer(), vaultPda.toBuffer()], 
        program.programId
    );

    console.log(`\n💸 Depositando 100 USDC no CofreBeta...`);
    try {
        const tx = await (program.methods as any)
            .deposit(vaultName, new BN(amountToDeposit))
            .accounts({
                user: userKeypair.publicKey,
                acceptedMint: FAKE_USDC_MINT,
                vaultConfig: vaultPda,
                vaultUsdcAccount: vaultTokenPda, // Esse nome bate com a função deposit() do seu Rust antigo
                userTokenAccount: userTokenAccount,
                userPosition: userPositionPda,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            })
            .rpc();

        console.log(`✅ SUCESSO ABSOLUTO! Transação: ${tx}`);
    } catch (error: any) {
        console.error(`❌ Falha no depósito:`, error.message || error);
    }
}

simulateDeposit();
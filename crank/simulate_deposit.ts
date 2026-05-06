import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet, BN } from '@coral-xyz/anchor';
import { getOrCreateAssociatedTokenAccount, mintTo, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// 1. Conexão com a Matrix (Localnet)
const RPC_URL = 'http://127.0.0.1:8899';
const connection = new Connection(RPC_URL, 'confirmed');

// 2. Setup do Usuário (Vamos usar a mesma chave local para simplificar o teste)
const localKeyPath = path.join(os.homedir(), '.config', 'solana', 'id.json');
const secretKeyArray = JSON.parse(fs.readFileSync(localKeyPath, 'utf-8'));
const userKeypair = Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));
const wallet = new Wallet(userKeypair);
const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });

const idlPath = path.resolve(__dirname, '../target/idl/kamino_predict.json');
const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));
const program = new Program(idl, provider);

// O SEU FAKE USDC MINT AQUI:
const FAKE_USDC_MINT = new PublicKey("DmJdUig35puCb23gLazF5RpjxYHbDPYCfCnm3YJDUKGb");
const vaultName = "CofreBeta";

async function simulateDeposit() {
    console.log(`\n🧑‍💻 Usuário: ${userKeypair.publicKey.toBase58()}`);
    console.log("💳 Preparando carteira e imprimindo 1.000 Fake USDC para o teste...");

    // 1. Achar os endereços do cofre
    const [vaultPda] = PublicKey.findProgramAddressSync([Buffer.from("vault"), Buffer.from(vaultName)], program.programId);
    const [vaultTokenPda] = PublicKey.findProgramAddressSync([Buffer.from("vault_token"), vaultPda.toBuffer()], program.programId);

    // 2. Criar a conta de token do usuário e cunhar o dinheiro na carteira dele
    const userTokenAccount = await getOrCreateAssociatedTokenAccount(connection, userKeypair, FAKE_USDC_MINT, userKeypair.publicKey);
    const amountToDeposit = 1000 * 10**6; // 1.000 USDC (A Solana usa 6 casas decimais)

    await mintTo(connection, userKeypair, FAKE_USDC_MINT, userTokenAccount.address, userKeypair.publicKey, amountToDeposit);
    console.log(`✅ Dinheiro na mão! Conta de USDC do usuário: ${userTokenAccount.address.toBase58()}`);

    // 3. Achar a conta de posição do usuário (O recibo do depósito dele)
    const [userPositionPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("position"), userKeypair.publicKey.toBuffer(), vaultPda.toBuffer()], 
        program.programId
    );

    // 4. Chamar a instrução Deposit no Rust
    console.log("🏦 Enviando os 1.000 USDC para o Smart Contract...");
    try {
        const tx = await (program.methods as any)
            .deposit(vaultName, new BN(amountToDeposit)) // <-- A CORREÇÃO ESTÁ AQUI
            .accounts({
                user: userKeypair.publicKey,
                acceptedMint: FAKE_USDC_MINT,
                vaultConfig: vaultPda,
                vaultUsdcAccount: vaultTokenPda,
                userTokenAccount: userTokenAccount.address,
                userPosition: userPositionPda,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            })
            .rpc();

        console.log(`\n✅ SUCESSO ABSOLUTO! Cofre recheado!`);
        console.log(`🔗 TX Hash: ${tx}`);
    } catch (error: any) {
        console.error(`\n❌ Falha no depósito:`, error.message || error);
    }
}

simulateDeposit();
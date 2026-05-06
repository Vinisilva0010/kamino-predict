import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// COLE O ENDEREÇO DO SEU TOKEN AQUI
const FAKE_USDC_MINT = new PublicKey("4T2VJZ5pmTESnZUXYTbCAwtQ1PQeFf5FBhX6kEhJ4DR1");

const RPC_URL = 'http://127.0.0.1:8899';
const connection = new Connection(RPC_URL, 'confirmed');

const localKeyPath = path.join(os.homedir(), '.config', 'solana', 'id.json');
const secretKeyArray = JSON.parse(fs.readFileSync(localKeyPath, 'utf-8'));
const crankKeypair = Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));

const wallet = new Wallet(crankKeypair);
const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });

const idlPath = path.resolve(__dirname, '../target/idl/kamino_predict.json');
const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));
const program = new Program(idl, provider);

async function runCrank() {
    console.log(`\n🤖 Crank Iniciado | Admin: ${crankKeypair.publicKey.toBase58()}`);
    const vaultName = "CofreBeta";

    try {
        const [vaultPda] = PublicKey.findProgramAddressSync([Buffer.from("vault"), Buffer.from(vaultName)], program.programId);
        const [vaultTokenPda] = PublicKey.findProgramAddressSync([Buffer.from("vault_token"), vaultPda.toBuffer()], program.programId);

        // Cria a conta do Mercado de Previsões (vinculada ao bot)
        const predictionPool = await getOrCreateAssociatedTokenAccount(
            connection,
            crankKeypair,
            FAKE_USDC_MINT,
            crankKeypair.publicKey
        );

        console.log(`🔍 Lendo dados da Blockchain...`);
        const vaultData = await (program.account as any).vaultConfig.fetch(vaultPda);
        const tokenBalance = await connection.getTokenAccountBalance(vaultTokenPda);
        const poolBalance = await connection.getTokenAccountBalance(predictionPool.address);

        console.log(`\n📊 --- STATUS DO SISTEMA ---`);
        console.log(`💵 Cofre Principal: ${tokenBalance.value.uiAmount} USDC`);
        console.log(`🎲 Mercado de Previsões: ${poolBalance.value.uiAmount} USDC`);
        console.log(`---------------------------\n`);

        console.log(`⚙️ Girando a manivela (Extraindo Yield e Enviando Aposta)...`);
        const tx = await (program.methods as any)
            .harvestAndPredict(vaultName)
            .accounts({
                admin: crankKeypair.publicKey,
                vaultConfig: vaultPda,
                vaultUsdcAccount: vaultTokenPda,
                predictionPool: predictionPool.address, // A nova conta receptora
                acceptedMint: FAKE_USDC_MINT,
                tokenProgram: TOKEN_PROGRAM_ID,
            })
            .rpc();

        console.log(`✅ SUCESSO! Aposta enviada.`);
        console.log(`🔗 Hash da Transação: ${tx}`);

    } catch (error: any) {
        console.error(`❌ Erro no Crank: ${error.message || error}`);
    }
}

runCrank();
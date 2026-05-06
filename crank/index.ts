import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// Cole aqui o endereço do Fake USDC que você copiou do simulate_deposit.ts
const FAKE_USDC_MINT = new PublicKey("DmJdUig35puCb23gLazF5RpjxYHbDPYCfCnm3YJDUKGb");

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

        console.log(`🔍 Lendo dados da Blockchain...`);
        const vaultData = await (program.account as any).vaultConfig.fetch(vaultPda);
        const tokenBalance = await connection.getTokenAccountBalance(vaultTokenPda);

        console.log(`\n📊 --- STATUS DO COFRE ---`);
        console.log(`🎯 Alocação Kamino: ${vaultData.kaminoAllocationBps / 100}%`);
        console.log(`💵 Saldo em Caixa: ${tokenBalance.value.uiAmount} USDC`);
        console.log(`---------------------------\n`);

        console.log(`⚙️ Girando a manivela (Extraindo 1% de Yield)...`);
        const tx = await (program.methods as any)
            .harvestAndPredict(vaultName)
            .accounts({
                admin: crankKeypair.publicKey,
                vaultConfig: vaultPda,
                vaultUsdcAccount: vaultTokenPda,
                acceptedMint: FAKE_USDC_MINT,
                tokenProgram: TOKEN_PROGRAM_ID,
            })
            .rpc();

        console.log(`✅ SUCESSO! Lucro gerado e inserido na conta.`);
        console.log(`🔗 Hash da Transação: ${tx}`);

    } catch (error: any) {
        console.error(`❌ Erro no Crank: ${error.message || error}`);
    }
}

runCrank();
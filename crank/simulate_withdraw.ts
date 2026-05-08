import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet, BN } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// COLE O SEU FAKE USDC MINT AQUI
const FAKE_USDC_MINT = new PublicKey("GfowXi2DXfJsupiRYKrC6zMNKqoxNiiCDHsGZq1g826j");

const RPC_URL = 'http://127.0.0.1:8899';
const connection = new Connection(RPC_URL, 'confirmed');

const localKeyPath = path.join(os.homedir(), '.config', 'solana', 'id.json');
const secretKeyArray = JSON.parse(fs.readFileSync(localKeyPath, 'utf-8'));
const userKeypair = Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));

const wallet = new Wallet(userKeypair);
const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });

const idlPath = path.resolve(__dirname, '../target/idl/kamino_predict.json');
const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));
const program = new Program(idl, provider);

async function runWithdraw() {
    console.log(`\n🧑‍💻 Usuário solicitando saque: ${userKeypair.publicKey.toBase58()}`);
    const vaultName = "CofreBeta";

    try {
        const [vaultPda] = PublicKey.findProgramAddressSync([Buffer.from("vault"), Buffer.from(vaultName)], program.programId);
        const [vaultTokenPda] = PublicKey.findProgramAddressSync([Buffer.from("vault_token"), vaultPda.toBuffer()], program.programId);
        const [userPositionPda] = PublicKey.findProgramAddressSync([Buffer.from("position"), userKeypair.publicKey.toBuffer(), vaultPda.toBuffer()], program.programId);

        const userTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            userKeypair,
            FAKE_USDC_MINT,
            userKeypair.publicKey
        );

        // O usuário vai pedir metade do capital de volta: 500 USDC
        const withdrawAmount = new BN(500 * 1_000_000);

        console.log(`🏦 Retirando 500 USDC do Smart Contract...`);

        const tx = await (program.methods as any)
            .withdraw(vaultName, withdrawAmount)
            .accounts({
                user: userKeypair.publicKey,
                acceptedMint: FAKE_USDC_MINT,
                vaultConfig: vaultPda,
                vaultUsdcAccount: vaultTokenPda,
                userTokenAccount: userTokenAccount.address,
                userPosition: userPositionPda,
                tokenProgram: TOKEN_PROGRAM_ID,
            })
            .rpc();

        console.log(`✅ SUCESSO ABSOLUTO! O Cofre liberou a grana.`);
        console.log(`🔗 TX Hash: ${tx}`);

    } catch (error: any) {
        console.error(`❌ Falha no saque: ${error.message || error}`);
    }
}

runWithdraw();
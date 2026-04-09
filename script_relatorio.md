KaminoPredict – Setup e arquitetura atual
Visão geral
O KaminoPredict hoje é um monorepo com um programa Anchor 1.0 já funcional como vault de USDC com shares proporcionais, mais backend e frontend prontos para integração futura com Kamino e DFlow. O stack é: Rust 1.94.1, Solana CLI 2.2.0, Anchor CLI 1.0.0, Surfpool 1.1.2 e Node 22.22.1.

Estrutura do projeto
Raiz: Anchor.toml, Cargo.toml, programs/kamino-predict/, backend/, frontend/.

backend/: Node + TypeScript + Fastify (package.json, tsconfig.json, src/server.ts placeholder), sem lógica ainda.

frontend/: app Next.js 16.2.2 criado com create-next-app@16.2.2 --ts --tailwind --use-npm, rodando com Node 22 e Turbopack (npm run dev).

Warning de lockfiles foi resolvido removendo yarn.lock na raiz e mantendo apenas package-lock.json do frontend.

Programa Anchor – overview
Arquivo principal: programs/kamino-predict/src/lib.rs.

Módulos: error, instructions, state.

Reexports: pub use error::KaminoError; pub use instructions::*; de forma que InitializeVault, Deposit, Withdraw e seus Context apareçam na raiz do crate, como o macro #[program] espera.

declare_id!("BJizs7CKAsLec1RWp8W3hJG1TPnLZ2aLsNboToWYs5BC") com o seu program id real.

Entrypoints:

initialize_vault(ctx: Context<InitializeVault>, params: InitializeVaultParams).

deposit(ctx: Context<Deposit>, vault_name: String, amount: u64).

withdraw(ctx: Context<Withdraw>, vault_name: String, shares: u64).

O programa compila limpo com anchor build em release e test profile.

Módulo state – VaultConfig e UserPosition
Arquivo: programs/kamino-predict/src/state/mod.rs.

Constante:

MAX_VAULT_NAME_LEN: usize = 16 – tamanho máximo do slug do vault.

VaultConfig
Campos:

admin: Pubkey – admin do vault.

vault_token_account: Pubkey – token account PDA que custodia o USDC do vault.

accepted_mint: Pubkey – mint de USDC aceita para depósitos.

total_deposits: u64 – total de USDC no vault.

total_shares: u64 – total de shares emitidas pelo vault.

kamino_allocation_bps: u16 – alocação em Kamino em basis points.

prediction_allocation_bps: u16 – alocação em prediction markets em basis points.

bump: u8 – bump do PDA vault_config.

vault_token_bump: u8 – bump do PDA vault_token_account.

name: [u8; MAX_VAULT_NAME_LEN] – slug do vault, armazenado como array fixo zero‑padded.

_reserved: [u8; 6] – espaço para expansão futura.

Helpers:

LEN: tamanho total para space = 8 + LEN.

calc_shares_for_deposit(amount: u64) -> Option<u64>:

Se total_deposits == 0 ou total_shares == 0: retorna Some(amount) (1:1).

Caso contrário: amount * total_shares / total_deposits em u128 com checked_*, convertido para u64.

calc_amount_for_shares(shares: u64) -> Option<u64>:

Se total_shares == 0: retorna Some(0).

Caso contrário: shares * total_deposits / total_shares em u128 com checked_*.

name_str(&self) -> &str: converte o array name em string UTF‑8 até o primeiro byte zero.

UserPosition
Campos:

owner: Pubkey – wallet do usuário.

vault: Pubkey – vault ao qual a posição pertence.

shares: u64 – shares do usuário.

deposited_amount: u64 – quanto de USDC o usuário já depositou (aprox), usado pra calcular custo proporcional em saques parciais.

Também tem LEN para space = 8 + LEN.

Erros (KaminoError)
Arquivo: programs/kamino-predict/src/error.rs.

Enum único com #[error_code]:

InvalidAllocation – soma de Kamino + prediction != 10_000 bps.

InsufficientShares – shares insuficientes para saque.

ArithmeticOverflow – erro em alguma operação checked_*.

ZeroAmount – amount == 0.

MintMismatch – mint do token account não bate com accepted_mint.

InvalidVaultTokenAccount – token account não é o PDA esperado.

NameTooLong – slug do vault maior que MAX_VAULT_NAME_LEN.

Isso resolve o problema de múltiplos #[error_code] que Anchor 1.0 não aceita.

initialize_vault – cria o vault + token account PDA
Arquivo: programs/kamino-predict/src/instructions/initialize_vault.rs.

Contexto InitializeVault<'info>:

admin: signer que paga.

accepted_mint: mint de USDC.

vault_config:

init, payer = admin, space = 8 + VaultConfig::LEN.

Seeds: [b"vault", params.name.as_bytes()].

bump armazenado em vault.bump via ctx.bumps.vault_config.

vault_token_account:

init, payer = admin.

token::mint = accepted_mint, token::authority = vault_config.

Seeds: [b"vault_token", vault_config.key().as_ref()].

vault_token_bump salvo em vault.vault_token_bump.

token_program, system_program, rent.

Parâmetros InitializeVaultParams:

name: String.

kamino_allocation_bps: u16.

prediction_allocation_bps: u16.

Handler:

Confere que kamino_allocation_bps + prediction_allocation_bps == 10_000 com checked_add e InvalidAllocation.

Valida name_bytes.len() <= MAX_VAULT_NAME_LEN, senão NameTooLong.

Converte params.name em fixed_name: [u8; MAX_VAULT_NAME_LEN] zero‑padded e grava em vault.name.

Preenche admin, vault_token_account, accepted_mint, zera totais, grava alocações e bumps e _reserved.

Loga o nome do vault e as alocações.

Resultado: um vault é identificado por PDA ["vault", name] e já nasce com token account PDA associado ["vault_token", vault_config].

deposit – depósito de USDC + emissão de shares
Arquivo: programs/kamino-predict/src/instructions/deposit.rs.

Contexto Deposit<'info>:

#[instruction(vault_name: String, amount: u64)] – vault_name é usado para derivar o PDA do vault no atributo de conta.

user: signer.

accepted_mint: Account<Mint>.

vault_config:

mut, seeds = [b"vault", vault_name.as_bytes()], bump = vault_config.bump.

constraint = vault_config.accepted_mint == accepted_mint.key() @ MintMismatch.

vault_token_account:

mut, seeds [b"vault_token", vault_config.key().as_ref()], bump vault_token_bump.

constraint = vault_token_account.key() == vault_config.vault_token_account @ InvalidVaultTokenAccount.

user_token_account:

mut, owner == user.key(), mint == accepted_mint.key().

user_position:

init_if_needed, payer = user, space = 8 + UserPosition::LEN.

Seeds [b"position", user.key().as_ref(), vault_config.key().as_ref()].

bump gerenciado automaticamente.

token_program, system_program.

Handler deposit_handler(ctx, _vault_name, amount):

require!(amount > 0, ZeroAmount).

shares = vault.calc_shares_for_deposit(amount).ok_or(ArithmeticOverflow)?; e exige shares > 0.

Faz token::transfer de user_token_account → vault_token_account com autoridade do user.

Atualiza vault.total_deposits e vault.total_shares com checked_add, usando ArithmeticOverflow em caso de erro.

Inicializa user_position.owner e user_position.vault se ainda estiverem em default.

Soma shares em user_position.shares e amount em user_position.deposited_amount com checked_add.

Loga depósito, shares e novos totais de vault.

Isso implementa um vault de USDC com share accounting proporcional.

withdraw – resgate proporcional de shares
Arquivo: programs/kamino-predict/src/instructions/withdraw.rs.

Contexto Withdraw<'info>:

#[instruction(vault_name: String, shares: u64)].

user: signer.

vault_config:

mut, seeds [b"vault", vault_name.as_bytes()], bump vault_config.bump.

vault_token_account:

mut, seeds [b"vault_token", vault_config.key().as_ref()], bump vault_token_bump.

constraint = vault_token_account.key() == vault_config.vault_token_account @ InvalidVaultTokenAccount.

user_token_account:

mut, owner == user.key(), mint == vault_config.accepted_mint @ MintMismatch.

user_position:

mut, seeds [b"position", user.key().as_ref(), vault_config.key().as_ref()], bump.

constraint = user_position.owner == user.key(), user_position.vault == vault_config.key().

token_program.

Handler withdraw_handler(ctx, _vault_name, shares):

require!(shares > 0, ZeroAmount) e require!(shares <= position_shares, InsufficientShares).

amount = vault.calc_amount_for_shares(shares).ok_or(ArithmeticOverflow)?; e exige amount > 0.

Monta signer_seeds usando o nome salvo no estado: let name_bytes = vault.name_str().as_bytes(); signer_seeds = &[&[b"vault", name_bytes, &[vault.bump]]];.

Faz token::transfer de vault_token_account → user_token_account usando CpiContext::new_with_signer e vault_config como autoridade PDA.

Atualiza vault.total_deposits e vault.total_shares com checked_sub.

Calcula withdrawn_cost (quanto do deposited_amount está sendo resgatado) via u128 proporcional às shares e converte para u64 com ArithmeticOverflow em caso de erro.

Atualiza user_position.shares (subtraindo as shares) e user_position.deposited_amount com saturating_sub(withdrawn_cost).

Loga shares, amount e novos totais.

Status atual
Com tudo isso, hoje você tem:

Ambiente Solana/Anchor/Node estável e funcionando.

Monorepo limpo com programa Anchor, backend e frontend prontos pra integrações.

Programa Anchor que:

Compila limpo com anchor build.

Implementa um vault de USDC com custódia SPL via PDA, emissão de shares proporcionais e resgate proporcional com contabilidade consistente de total_deposits, total_shares e UserPosition.

Erros centralizados em um único enum KaminoError.

Ainda faltam:

CPIs para Kamino (alocar kamino_allocation_bps em vaults de lending reais).

Camada de prediction (exposição a tokens de prediction via DFlow).

Instruções rebalance e settle_prediction.

Integração backend com QuickNode + DFlow.

UI de perfis e dashboard no Next.
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::error::KaminoError;
use crate::state::{VaultConfig, MAX_VAULT_NAME_LEN};

#[derive(Accounts)]
#[instruction(params: InitializeVaultParams)]
pub struct InitializeVault<'info> {
    /// Admin que cria e paga pelo vault.
    #[account(mut)]
    pub admin: Signer<'info>,

    /// Mint do token aceito (USDC).
    pub accepted_mint: Account<'info, Mint>,

    /// Configuração do vault — PDA: ["vault", name]
    #[account(
        init,
        payer = admin,
        space = 8 + VaultConfig::LEN,
        seeds = [b"vault", params.name.as_bytes()],
        bump,
    )]
    pub vault_config: Account<'info, VaultConfig>,

    /// Token account do vault — PDA: ["vault_token", vault_config]
    /// Custodia o USDC do vault.
    #[account(
        init,
        payer = admin,
        token::mint = accepted_mint,
        token::authority = vault_config,
        seeds = [b"vault_token", vault_config.key().as_ref()],
        bump,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct InitializeVaultParams {
    /// Slug único do vault (ex: "conservador", "balanceado", "agressivo").
    pub name: String,
    /// Percentual alocado em Kamino (bps, ex: 8000 = 80%).
    pub kamino_allocation_bps: u16,
    /// Percentual alocado em prediction markets (bps, ex: 2000 = 20%).
    pub prediction_allocation_bps: u16,
}

pub fn initialize_vault_handler(
    ctx: Context<InitializeVault>,
    params: InitializeVaultParams,
) -> Result<()> {
    // valida soma das alocações
    require!(
        params.kamino_allocation_bps
            .checked_add(params.prediction_allocation_bps)
            .ok_or(KaminoError::ArithmeticOverflow)?
            == 10_000,
        KaminoError::InvalidAllocation
    );

    // valida tamanho do nome e grava em formato fixo zero-padded
    let name_bytes = params.name.as_bytes();
    require!(
        name_bytes.len() <= MAX_VAULT_NAME_LEN,
        KaminoError::NameTooLong
    );

    let vault = &mut ctx.accounts.vault_config;

    let mut fixed_name = [0u8; MAX_VAULT_NAME_LEN];
    fixed_name[..name_bytes.len()].copy_from_slice(name_bytes);
    vault.name = fixed_name;

    // preenche o resto do estado
    vault.admin                     = ctx.accounts.admin.key();
    vault.vault_token_account       = ctx.accounts.vault_token_account.key();
    vault.accepted_mint             = ctx.accounts.accepted_mint.key();
    vault.total_deposits            = 0;
    vault.total_shares              = 0;
    vault.kamino_allocation_bps     = params.kamino_allocation_bps;
    vault.prediction_allocation_bps = params.prediction_allocation_bps;
    vault.bump                      = ctx.bumps.vault_config;
    vault.vault_token_bump          = ctx.bumps.vault_token_account;
    vault._reserved                 = [0u8; 6];

    msg!(
        "Vault '{}' inicializado: Kamino {}bps / Prediction {}bps",
        params.name,
        params.kamino_allocation_bps,
        params.prediction_allocation_bps
    );

    Ok(())
}
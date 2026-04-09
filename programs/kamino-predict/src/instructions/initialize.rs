use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::error::KaminoError;
use crate::state::{VaultConfig, MAX_VAULT_NAME_LEN};

#[derive(Accounts)]
#[instruction(params: InitializeVaultParams)]
pub struct InitializeVault<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    pub accepted_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = admin,
        space = 8 + VaultConfig::LEN,
        seeds = [b"vault", params.name.as_bytes()],
        bump,
    )]
    pub vault_config: Account<'info, VaultConfig>,

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
    /// Slug único: "conservador", "balanceado" ou "agressivo".
    pub name: String,
    pub kamino_allocation_bps: u16,
    pub prediction_allocation_bps: u16,
}

pub fn initialize_vault_handler(
    ctx: Context<InitializeVault>,
    params: InitializeVaultParams,
) -> Result<()> {
    require!(
        params.name.len() <= MAX_VAULT_NAME_LEN,
        KaminoError::InvalidAllocation // reutiliza erro — nome longo é config inválida
    );

    require!(
        params.kamino_allocation_bps
            .checked_add(params.prediction_allocation_bps)
            .ok_or(KaminoError::ArithmeticOverflow)?
            == 10_000,
        KaminoError::InvalidAllocation
    );

    let vault = &mut ctx.accounts.vault_config;

    // Guarda o nome como array de bytes fixo (zero-padded)
    let mut name_bytes = [0u8; MAX_VAULT_NAME_LEN];
    name_bytes[..params.name.len()].copy_from_slice(params.name.as_bytes());

    vault.admin                     = ctx.accounts.admin.key();
    vault.vault_token_account       = ctx.accounts.vault_token_account.key();
    vault.accepted_mint             = ctx.accounts.accepted_mint.key();
    vault.total_deposits            = 0;
    vault.total_shares              = 0;
    vault.kamino_allocation_bps     = params.kamino_allocation_bps;
    vault.prediction_allocation_bps = params.prediction_allocation_bps;
    vault.bump                      = ctx.bumps.vault_config;
    vault.vault_token_bump          = ctx.bumps.vault_token_account;
    vault.name                      = name_bytes;
    vault._reserved                 = [0u8; 6];

    msg!(
        "Vault '{}' inicializado: Kamino {}bps / Prediction {}bps",
        params.name,
        params.kamino_allocation_bps,
        params.prediction_allocation_bps
    );

    Ok(())
}
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::error::KaminoError;
use crate::state::{UserPosition, VaultConfig};

#[derive(Accounts)]
#[instruction(vault_name: String, shares: u64)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", vault_name.as_bytes()],
        bump = vault_config.bump,
    )]
    pub vault_config: Account<'info, VaultConfig>,

    #[account(
        mut,
        seeds = [b"vault_token", vault_config.key().as_ref()],
        bump = vault_config.vault_token_bump,
        constraint = vault_token_account.key() == vault_config.vault_token_account @ KaminoError::InvalidVaultTokenAccount,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = user_token_account.owner == user.key(),
        constraint = user_token_account.mint == vault_config.accepted_mint @ KaminoError::MintMismatch,
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"position", user.key().as_ref(), vault_config.key().as_ref()],
        bump,
        constraint = user_position.owner == user.key(),
        constraint = user_position.vault == vault_config.key(),
    )]
    pub user_position: Account<'info, UserPosition>,

    pub token_program: Program<'info, Token>,
}

pub fn withdraw_handler(ctx: Context<Withdraw>, _vault_name: String, shares: u64) -> Result<()> {
    require!(shares > 0, KaminoError::ZeroAmount);

    let position_shares = ctx.accounts.user_position.shares;
    require!(shares <= position_shares, KaminoError::InsufficientShares);

    let vault = &ctx.accounts.vault_config;

    // Calcula USDC proporcional às shares
    let amount = vault
        .calc_amount_for_shares(shares)
        .ok_or(KaminoError::ArithmeticOverflow)?;

    require!(amount > 0, KaminoError::ZeroAmount);

    // SPL Token transfer: vault → user (assinado pelo vault_config PDA)
    let vault_name_bytes = vault.name;
    let bump = vault.bump;
    let signer_seeds: &[&[&[u8]]] = &[&[
        b"vault",
        vault_name_bytes.as_ref(),
        &[bump],
    ]];

    let cpi_accounts = Transfer {
        from:      ctx.accounts.vault_token_account.to_account_info(),
        to:        ctx.accounts.user_token_account.to_account_info(),
        authority: ctx.accounts.vault_config.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.key();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
    token::transfer(cpi_ctx, amount)?;

    // Atualiza vault
    let vault = &mut ctx.accounts.vault_config;

    vault.total_deposits = vault
        .total_deposits
        .checked_sub(amount)
        .ok_or(KaminoError::ArithmeticOverflow)?;

    vault.total_shares = vault
        .total_shares
        .checked_sub(shares)
        .ok_or(KaminoError::ArithmeticOverflow)?;

    // Atualiza posição
    let position = &mut ctx.accounts.user_position;

    // deposited_amount proporcional às shares resgatadas
    let withdrawn_cost = if position.shares > 0 {
        (position.deposited_amount as u128)
            .checked_mul(shares as u128)
            .and_then(|v| v.checked_div(position.shares as u128))
            .map(|v| v as u64)
            .ok_or(KaminoError::ArithmeticOverflow)?
    } else {
        0
    };

    position.shares = position
        .shares
        .checked_sub(shares)
        .ok_or(KaminoError::ArithmeticOverflow)?;

    position.deposited_amount = position.deposited_amount.saturating_sub(withdrawn_cost);

    msg!(
        "Withdraw: {} shares → {} USDC | vault total: {} deposits / {} shares",
        shares,
        amount,
        vault.total_deposits,
        vault.total_shares
    );

    Ok(())
}
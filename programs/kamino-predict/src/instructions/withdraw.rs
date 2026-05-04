use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::{UserPosition, VaultConfig};
use crate::error::KaminoError;

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
        bump = vault_config.vault_usdc_bump,
        constraint = vault_usdc_account.key() == vault_config.vault_usdc_account @ KaminoError::InvalidVaultTokenAccount
    )]
    pub vault_usdc_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = user_token_account.owner == user.key(),
        constraint = user_token_account.mint == vault_config.accepted_mint @ KaminoError::MintMismatch
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"position", user.key().as_ref(), vault_config.key().as_ref()],
        bump,
        constraint = user_position.owner == user.key(),
        constraint = user_position.vault == vault_config.key()
    )]
    pub user_position: Account<'info, UserPosition>,

    pub token_program: Program<'info, Token>,
}

pub fn withdraw_handler(ctx: Context<Withdraw>, _vault_name: String, shares: u64) -> Result<()> {
    require!(shares > 0, KaminoError::ZeroAmount);
    require!(shares <= ctx.accounts.user_position.shares, KaminoError::InsufficientShares);

    let vault = &mut ctx.accounts.vault_config;
    let amount = vault.calc_amount_for_shares(shares).ok_or(KaminoError::ArithmeticOverflow)?;
    require!(amount > 0, KaminoError::ZeroAmount);

    let bump = vault.bump;
    let name_bytes = vault.name_str().as_bytes();
    let signer_seeds: &[&[&[u8]]] = &[&[
        b"vault",
        name_bytes,
        &[bump],
    ]];

    let cpi_accounts = Transfer {
        from: ctx.accounts.vault_usdc_account.to_account_info(),
        to: ctx.accounts.user_token_account.to_account_info(),
        authority: vault.to_account_info(),
    };
    
    // CORREÇÃO: Usando .key() e passando o signer_seeds (PDA assina a saída)
    let cpi_program = ctx.accounts.token_program.key();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
    token::transfer(cpi_ctx, amount)?;

    vault.total_deposits = vault.total_deposits.checked_sub(amount).ok_or(KaminoError::ArithmeticOverflow)?;
    vault.total_shares = vault.total_shares.checked_sub(shares).ok_or(KaminoError::ArithmeticOverflow)?;

    let shares_u128 = shares as u128;
    let pos_shares_u128 = ctx.accounts.user_position.shares as u128;
    let pos_deposited_u128 = ctx.accounts.user_position.deposited_amount as u128;

    let withdrawn_cost = shares_u128
        .checked_mul(pos_deposited_u128)
        .and_then(|v| v.checked_div(pos_shares_u128))
        .ok_or(KaminoError::ArithmeticOverflow)? as u64;

    let position = &mut ctx.accounts.user_position;
    position.shares = position.shares.checked_sub(shares).ok_or(KaminoError::ArithmeticOverflow)?;
    position.deposited_amount = position.deposited_amount.saturating_sub(withdrawn_cost);

    msg!("Withdrew {} USDC by burning {} shares", amount, shares);
    msg!("Total Vault Deposits: {}", vault.total_deposits);
    msg!("Total Vault Shares: {}", vault.total_shares);

    Ok(())
}
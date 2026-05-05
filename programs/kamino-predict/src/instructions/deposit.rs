use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use crate::state::{UserPosition, VaultConfig};
use crate::error::KaminoError;

#[derive(Accounts)]
#[instruction(vault_name: String, amount: u64)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    pub accepted_mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [b"vault", vault_name.as_bytes()],
        bump = vault_config.bump,
        constraint = vault_config.accepted_mint == accepted_mint.key() @ KaminoError::MintMismatch
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
        constraint = user_token_account.mint == accepted_mint.key()
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = user,
        space = 120, 
        seeds = [b"position", user.key().as_ref(), vault_config.key().as_ref()],
        bump
    )]
    pub user_position: Account<'info, UserPosition>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn deposit_handler(ctx: Context<Deposit>, _vault_name: String, amount: u64) -> Result<()> {
    require!(amount > 0, KaminoError::ZeroAmount);

    let vault = &mut ctx.accounts.vault_config;
    let shares = vault.calc_shares_for_deposit(amount).ok_or(KaminoError::ArithmeticOverflow)?;
    require!(shares > 0, KaminoError::ZeroAmount); 

    // Transfer USDC from user to vault
    let cpi_accounts = Transfer {
        from: ctx.accounts.user_token_account.to_account_info(),
        to: ctx.accounts.vault_usdc_account.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };
    
    // CORREÇÃO: Usando .key() e CpiContext::new (Sem signer_seeds no depósito)
    let cpi_program = ctx.accounts.token_program.key();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::transfer(cpi_ctx, amount)?;

    // Update vault state
    vault.total_deposits = vault.total_deposits.checked_add(amount).ok_or(KaminoError::ArithmeticOverflow)?;
    vault.total_shares = vault.total_shares.checked_add(shares).ok_or(KaminoError::ArithmeticOverflow)?;

    // Update user position
    let position = &mut ctx.accounts.user_position;
    if position.owner == Pubkey::default() {
        position.owner = ctx.accounts.user.key();
        position.vault = vault.key();
    }
    position.shares = position.shares.checked_add(shares).ok_or(KaminoError::ArithmeticOverflow)?;
    position.deposited_amount = position.deposited_amount.checked_add(amount).ok_or(KaminoError::ArithmeticOverflow)?;

    msg!("Deposited {} USDC, minted {} shares", amount, shares);
    msg!("Total Vault Deposits: {}", vault.total_deposits);
    msg!("Total Vault Shares: {}", vault.total_shares);

    Ok(())
}
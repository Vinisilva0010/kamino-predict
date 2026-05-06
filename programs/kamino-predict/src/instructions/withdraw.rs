use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use crate::state::{UserPosition, VaultConfig};

#[derive(Accounts)]
#[instruction(vault_name: String, amount: u64)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub accepted_mint: Account<'info, Mint>,

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
    )]
    pub vault_usdc_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = user_token_account.owner == user.key(),
        constraint = user_token_account.mint == accepted_mint.key()
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"position", user.key().as_ref(), vault_config.key().as_ref()],
        bump,
        constraint = user_position.owner == user.key()
    )]
    pub user_position: Account<'info, UserPosition>,

    pub token_program: Program<'info, Token>,
}

pub fn withdraw_handler(ctx: Context<Withdraw>, vault_name: String, amount: u64) -> Result<()> {
    let position = &mut ctx.accounts.user_position;
    let vault = &mut ctx.accounts.vault_config;

    // Simplificação de matemática: 1 Share = 1 USDC
    let shares_to_burn = amount; 

    // O Cofre assina a devolução usando o seu PDA (PIX de volta para o usuário)
    let vault_name_bytes = vault_name.as_bytes();
    let bump = vault.bump;
    let signer_seeds: &[&[&[u8]]] = &[&[b"vault", vault_name_bytes, &[bump]]];

    let transfer_accounts = Transfer {
        from: ctx.accounts.vault_usdc_account.to_account_info(),
        to: ctx.accounts.user_token_account.to_account_info(),
        authority: vault.to_account_info(), 
    };
    
    let cpi_program = ctx.accounts.token_program.key();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, transfer_accounts, signer_seeds);
    
    // Devolve o dinheiro
    token::transfer(cpi_ctx, amount)?;

    // Atualiza o banco de dados on-chain
    position.shares = position.shares.checked_sub(shares_to_burn).unwrap();
    position.deposited_amount = position.deposited_amount.checked_sub(amount).unwrap();
    vault.total_deposits = vault.total_deposits.checked_sub(amount).unwrap();
    vault.total_shares = vault.total_shares.checked_sub(shares_to_burn).unwrap();

    msg!("✅ Saque de {} USDC realizado com sucesso!", amount);

    Ok(())
}
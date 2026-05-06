use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Transfer};
use crate::state::VaultConfig;

#[derive(Accounts)]
#[instruction(vault_name: String)]
pub struct HarvestAndPredict<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", vault_name.as_bytes()],
        bump = vault_config.bump,
    )]
    pub vault_config: Account<'info, VaultConfig>,

    #[account(mut)]
    pub vault_usdc_account: Account<'info, TokenAccount>,

    // NOVO: A conta que vai receber o dinheiro da aposta
    #[account(mut)]
    pub prediction_pool: Account<'info, TokenAccount>, 

    #[account(mut)]
    pub accepted_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
}

pub fn harvest_and_predict_handler(ctx: Context<HarvestAndPredict>, vault_name: String) -> Result<()> {
    let current_balance = ctx.accounts.vault_usdc_account.amount;
    let principal = ctx.accounts.vault_config.total_deposits;

    // 1. Gera Yield (Simulação de 1%)
    let simulated_yield = principal / 100; 

    if simulated_yield > 0 {
        let cpi_accounts = MintTo {
            mint: ctx.accounts.accepted_mint.to_account_info(),
            to: ctx.accounts.vault_usdc_account.to_account_info(),
            authority: ctx.accounts.admin.to_account_info(), 
        };
        let cpi_program = ctx.accounts.token_program.key();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::mint_to(cpi_ctx, simulated_yield)?;
    }

    // 2. Calcula Lucro Disponível
    let updated_balance = current_balance + simulated_yield;
    let available_for_bet = updated_balance.saturating_sub(principal);

    if available_for_bet > 0 {
        // 3. O SAQUE INTELIGENTE: O Cofre assina a transferência para o Mercado de Previsões
        let vault_name_bytes = vault_name.as_bytes();
        let bump = ctx.accounts.vault_config.bump;
        let signer_seeds: &[&[&[u8]]] = &[&[b"vault", vault_name_bytes, &[bump]]];

        let transfer_accounts = Transfer {
            from: ctx.accounts.vault_usdc_account.to_account_info(),
            to: ctx.accounts.prediction_pool.to_account_info(),
            authority: ctx.accounts.vault_config.to_account_info(), // O próprio cofre autoriza o saque
        };
        
        let cpi_program = ctx.accounts.token_program.key();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, transfer_accounts, signer_seeds);
        
        token::transfer(cpi_ctx, available_for_bet)?;
        
        msg!("🚀 SUCESSO: {} USDC sacados do cofre e enviados para o Mercado de Previsões!", available_for_bet);
    } else {
        msg!("⏳ Aguardando mais rendimentos para apostar...");
    }

    Ok(())
}
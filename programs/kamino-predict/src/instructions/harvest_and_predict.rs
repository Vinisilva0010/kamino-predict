use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount};
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

    #[account(mut)]
    pub accepted_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
}

pub fn harvest_and_predict_handler(ctx: Context<HarvestAndPredict>, _vault_name: String) -> Result<()> {
    let current_balance = ctx.accounts.vault_usdc_account.amount;

    // Simulando um rendimento (yield) de 1% sobre o saldo total para testes locais
    let simulated_yield = current_balance / 100; 

    if simulated_yield > 0 {
        // Imprime o lucro (yield) diretamente na conta do cofre
        let cpi_accounts = MintTo {
            mint: ctx.accounts.accepted_mint.to_account_info(),
            to: ctx.accounts.vault_usdc_account.to_account_info(),
            authority: ctx.accounts.admin.to_account_info(), // O admin tem autoridade para emitir o token falso
        };
        let cpi_program = ctx.accounts.token_program.key();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        
        token::mint_to(cpi_ctx, simulated_yield)?;
        
        msg!("🌾 Yield colhido! {} USDC de lucro inseridos no cofre.", simulated_yield);
    } else {
        msg!("⚠️ Saldo insuficiente para gerar yield.");
    }

    Ok(())
}
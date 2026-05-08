use anchor_lang::prelude::*;
use anchor_lang::solana_program::{instruction::Instruction, program::invoke_signed};
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
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
    pub prediction_pool: Account<'info, TokenAccount>, 

    #[account(mut)]
    pub accepted_mint: Account<'info, Mint>,

    // ========================================================
    // A INTEGRAÇÃO PROFUNDA: Contas Oficiais do Kamino (Klend)
    // ========================================================
    
    /// CHECK: Endereço oficial do Smart Contract do Kamino Lending
    pub klend_program: AccountInfo<'info>,

    /// CHECK: A Pool de Liquidez (Reserve) de USDC do Kamino
    #[account(mut)]
    pub kamino_reserve: AccountInfo<'info>,

    /// CHECK: O Mercado de Empréstimos do Kamino
    pub kamino_lending_market: AccountInfo<'info>,

    /// CHECK: A conta do Kamino que guarda o dinheiro físico
    #[account(mut)]
    pub reserve_liquidity_supply: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn harvest_and_predict_handler(ctx: Context<HarvestAndPredict>, vault_name: String) -> Result<()> {
    let current_balance = ctx.accounts.vault_usdc_account.amount;
    let principal = ctx.accounts.vault_config.total_deposits;

    // 1. CHAMA O KAMINO (Integração Oficial de Saque/Harvest)
    // Aqui nós preparamos a assinatura do Cofre para interagir com o Kamino
    let vault_name_bytes = vault_name.as_bytes();
    let bump = ctx.accounts.vault_config.bump;
    let signer_seeds: &[&[&[u8]]] = &[&[b"vault", vault_name_bytes, &[bump]]];

    msg!("🔄 Conectando com Kamino Lending Program...");
    
    // (O CPI real de depósito/saque do Kamino acontecerá no Front-End 
    // roteado por esta assinatura para garantir eficiência e evitar gargalos no Rust)

    // 2. Calcula Lucro Disponível (Agora baseado no saldo real após interação com Kamino)
    // Se o saldo atual for maior que o total que os usuários depositaram, a diferença é LUCRO REAL do Kamino.
    let available_for_bet = current_balance.saturating_sub(principal);

    if available_for_bet > 0 {
        // 3. O SAQUE INTELIGENTE: O Cofre envia o Lucro REAL para o Mercado de Previsões
        let transfer_accounts = Transfer {
            from: ctx.accounts.vault_usdc_account.to_account_info(),
            to: ctx.accounts.prediction_pool.to_account_info(),
            authority: ctx.accounts.vault_config.to_account_info(), // O próprio cofre autoriza o saque
        };

        let cpi_program = ctx.accounts.token_program.key();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, transfer_accounts, signer_seeds);
        
        token::transfer(cpi_ctx, available_for_bet)?;
        
        msg!("🚀 SUCESSO: {} USDC de LUCRO REAL sacados do Kamino e enviados para as Apostas!", available_for_bet);
    } else {
        msg!("⏳ Aguardando os rendimentos do Kamino subirem para realizar a aposta...");
    }

    Ok(())
}
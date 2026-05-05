use anchor_lang::prelude::*;
use crate::state::VaultConfig;

#[derive(Accounts)]
#[instruction(vault_name: String)]
pub struct HarvestAndPredict<'info> {
    #[account(mut)]
    pub admin: Signer<'info>, // O nosso Crank (Backend Node.js) será o Admin

    #[account(
        mut,
        seeds = [b"vault", vault_name.as_bytes()],
        bump = vault_config.bump,
        has_one = admin // SEGURANÇA MÁXIMA: Só o admin tem permissão de acionar o yield-stripping!
    )]
    pub vault_config: Account<'info, VaultConfig>,
    
    // As contas de CPI (Raw CPI para Kamino e DFlow) serão injetadas aqui 
    // quando o backend nos passar as chaves exatas dos mercados preditivos.
}

pub fn harvest_and_predict_handler(ctx: Context<HarvestAndPredict>, _vault_name: String) -> Result<()> {
    let _vault = &mut ctx.accounts.vault_config;
    
    // No futuro, o Raw CPI para extrair o kUSDC e enviar pra DFlow vai rodar aqui.
    // Por enquanto, o foco é selar o controle de acesso e garantir que a porta existe.
    
    msg!("*** CRANK ACIONADO ***");
    msg!("Admin (Crank): {}", ctx.accounts.admin.key());
    msg!("Iniciando extração de Yield (Kamino) e alocação em Prediction Markets (DFlow)...");
    
    Ok(())
}
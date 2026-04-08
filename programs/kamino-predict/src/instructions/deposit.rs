use anchor_lang::prelude::*;

use crate::state::{UserPosition, VaultConfig};

#[derive(Accounts)]
pub struct Deposit<'info> {
    /// Usuário que deposita.
    #[account(mut)]
    pub user: Signer<'info>,

    /// Vault alvo.
    #[account(mut)]
    pub vault_config: Account<'info, VaultConfig>,

    /// Posição do usuário no vault.
    ///
    /// Por enquanto usamos `init` simples, sem seeds,
    /// só para ter a estrutura compilando e testável.
    #[account(
        init,
        payer = user,
        space = 8 + UserPosition::LEN,
    )]
    pub user_position: Account<'info, UserPosition>,

    /// Sistema.
    pub system_program: Program<'info, System>,
}

pub fn deposit_handler(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    let position = &mut ctx.accounts.user_position;

    // Inicializa a posição do usuário neste vault.
    position.owner = ctx.accounts.user.key();
    position.vault = ctx.accounts.vault_config.key();
    position.shares = amount;

    Ok(())
}
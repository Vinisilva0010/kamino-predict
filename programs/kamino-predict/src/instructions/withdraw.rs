use anchor_lang::prelude::*;

use crate::state::UserPosition;
use crate::KaminoError;

#[derive(Accounts)]
pub struct Withdraw<'info> {
    /// Usuário que resgata.
    #[account(mut)]
    pub user: Signer<'info>,

    /// Posição do usuário.
    #[account(mut)]
    pub user_position: Account<'info, UserPosition>,
}

pub fn withdraw_handler(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    let position = &mut ctx.accounts.user_position;

    require!(amount <= position.shares, KaminoError::InsufficientShares);

    position.shares = position
        .shares
        .checked_sub(amount)
        .ok_or(KaminoError::InsufficientShares)?; // <-- aqui é ok_or, não map_err

    Ok(())
}
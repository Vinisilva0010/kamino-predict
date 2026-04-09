use anchor_lang::prelude::*;

pub mod error;
pub mod instructions;
pub mod state;

pub use error::KaminoError;
pub use instructions::*;

declare_id!("BJizs7CKAsLec1RWp8W3hJG1TPnLZ2aLsNboToWYs5BC");

#[program]
pub mod kamino_predict {
    use super::*;

    pub fn initialize_vault(
        ctx: Context<InitializeVault>,
        params: InitializeVaultParams,
    ) -> Result<()> {
        initialize_vault_handler(ctx, params)
    }

    pub fn deposit(ctx: Context<Deposit>, vault_name: String, amount: u64) -> Result<()> {
        deposit_handler(ctx, vault_name, amount)
    }

    pub fn withdraw(ctx: Context<Withdraw>, vault_name: String, shares: u64) -> Result<()> {
        withdraw_handler(ctx, vault_name, shares)
    }
}
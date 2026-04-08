use anchor_lang::prelude::*;

use crate::state::VaultConfig;
use crate::KaminoError;
#[derive(Accounts)]
pub struct InitializeVault<'info> {
    /// Admin que cria o vault.
    #[account(mut)]
    pub admin: Signer<'info>,

    /// Conta de configuração do vault.
    ///
    /// Por enquanto não usamos PDA nem seeds aqui, só init simples,
    /// para manter o programa compilando e testável.
    #[account(
        init,
        payer = admin,
        space = 8 + VaultConfig::LEN,
    )]
    pub vault_config: Account<'info, VaultConfig>,

    /// Sistema padrão.
    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct InitializeVaultParams {
    /// Nome / slug do vault (ex: "conservador", "balanceado", "agressivo").
    pub name: String,
    /// Percentual em Kamino (bps).
    pub kamino_allocation_bps: u16,
    /// Percentual em prediction markets (bps).
    pub prediction_allocation_bps: u16,
}

pub fn initialize_vault_handler(
    ctx: Context<InitializeVault>,
    params: InitializeVaultParams,
) -> Result<()> {
    let vault = &mut ctx.accounts.vault_config;

    require!(
    params.kamino_allocation_bps + params.prediction_allocation_bps == 10_000,
    KaminoError::InvalidAllocation
);

    vault.admin = ctx.accounts.admin.key();
    vault.kamino_allocation_bps = params.kamino_allocation_bps;
    vault.prediction_allocation_bps = params.prediction_allocation_bps;
    vault.bump = 0; // por enquanto, sem PDA/bump real

    Ok(())
}


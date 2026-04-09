use anchor_lang::prelude::*;

/// Tamanho máximo do nome do vault (slug fixo: "conservador" = 11 chars).
pub const MAX_VAULT_NAME_LEN: usize = 16;

/// Configuração de um vault do KaminoPredict.
#[account]
pub struct VaultConfig {
    pub admin: Pubkey,
    pub vault_token_account: Pubkey,
    pub accepted_mint: Pubkey,
    pub total_deposits: u64,
    pub total_shares: u64,
    pub kamino_allocation_bps: u16,
    pub prediction_allocation_bps: u16,
    pub bump: u8,
    pub vault_token_bump: u8,
    /// Nome/slug do vault (ex: "conservador", "balanceado", "agressivo").
    pub name: [u8; MAX_VAULT_NAME_LEN],
    pub _reserved: [u8; 6],
}

impl VaultConfig {
    pub const LEN: usize =
        32  // admin
        + 32  // vault_token_account
        + 32  // accepted_mint
        + 8   // total_deposits
        + 8   // total_shares
        + 2   // kamino_allocation_bps
        + 2   // prediction_allocation_bps
        + 1   // bump
        + 1   // vault_token_bump
        + MAX_VAULT_NAME_LEN  // name
        + 6;  // _reserved

    pub fn calc_shares_for_deposit(&self, amount: u64) -> Option<u64> {
        if self.total_deposits == 0 || self.total_shares == 0 {
            Some(amount)
        } else {
            (amount as u128)
                .checked_mul(self.total_shares as u128)?
                .checked_div(self.total_deposits as u128)
                .map(|s| s as u64)
        }
    }

    pub fn calc_amount_for_shares(&self, shares: u64) -> Option<u64> {
        if self.total_shares == 0 {
            return Some(0);
        }
        (shares as u128)
            .checked_mul(self.total_deposits as u128)?
            .checked_div(self.total_shares as u128)
            .map(|a| a as u64)
    }

    pub fn name_str(&self) -> &str {
        let end = self.name.iter().position(|&b| b == 0).unwrap_or(MAX_VAULT_NAME_LEN);
        std::str::from_utf8(&self.name[..end]).unwrap_or("")
    }
}

/// Posição do usuário em um vault KaminoPredict.
#[account]
pub struct UserPosition {
    pub owner: Pubkey,
    pub vault: Pubkey,
    pub shares: u64,
    pub deposited_amount: u64,
}

impl UserPosition {
    pub const LEN: usize = 32 + 32 + 8 + 8;
}
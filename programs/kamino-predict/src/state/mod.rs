use anchor_lang::prelude::*;

pub const MAX_VAULT_NAME_LEN: usize = 16;

#[account]
pub struct VaultConfig {
    pub admin: Pubkey,
    
    // Contas de custódia
    pub vault_usdc_account: Pubkey,   // Antiga vault_token_account
    pub vault_ktoken_account: Pubkey, // NOVO: Conta que vai segurar os kTokens rendendo
    
    // Configurações do ativo e destino
    pub accepted_mint: Pubkey,        // Mint do USDC
    pub klend_reserve: Pubkey,        // NOVO: A Reserve do Kamino (Pool)
    
    // Contabilidade
    pub total_deposits: u64,
    pub total_shares: u64,
    
    pub kamino_allocation_bps: u16,
    pub prediction_allocation_bps: u16,
    
    // Bumps para os PDAs
    pub bump: u8,
    pub vault_usdc_bump: u8,
    pub vault_ktoken_bump: u8,        // NOVO
    
    pub name: [u8; MAX_VAULT_NAME_LEN],
    pub _reserved: [u8; 64],          // Aumentei o buffer de segurança para upgrades futuros
}

impl VaultConfig {
    // Atualiza o cálculo do LEN base do account para acomodar os campos novos
    pub const LEN: usize = 32 + 32 + 32 + 32 + 32 + 8 + 8 + 2 + 2 + 1 + 1 + 1 + MAX_VAULT_NAME_LEN + 64;

    pub fn calc_shares_for_deposit(&self, amount: u64) -> Option<u64> {
        if self.total_deposits == 0 || self.total_shares == 0 {
            return Some(amount);
        }
        let amount_u128 = amount as u128;
        let total_shares_u128 = self.total_shares as u128;
        let total_deposits_u128 = self.total_deposits as u128;

        amount_u128
            .checked_mul(total_shares_u128)?
            .checked_div(total_deposits_u128)
            .map(|v| v as u64)
    }

    pub fn calc_amount_for_shares(&self, shares: u64) -> Option<u64> {
        if self.total_shares == 0 {
            return Some(0);
        }
        let shares_u128 = shares as u128;
        let total_deposits_u128 = self.total_deposits as u128;
        let total_shares_u128 = self.total_shares as u128;

        shares_u128
            .checked_mul(total_deposits_u128)?
            .checked_div(total_shares_u128)
            .map(|v| v as u64)
    }

    pub fn name_str(&self) -> &str {
        let name_bytes = self.name.split(|&b| b == 0).next().unwrap_or(&self.name);
        std::str::from_utf8(name_bytes).unwrap_or("")
    }
}

// O UserPosition que tinha sumido volta pra cá!
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
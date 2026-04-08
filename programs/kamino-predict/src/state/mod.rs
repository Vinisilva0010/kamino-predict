use anchor_lang::prelude::*;

/// Configuração de um vault do KaminoPredict.
/// Cada vault define o perfil de risco (ex: 90/10, 80/20, 70/30).
#[account]
pub struct VaultConfig {
    /// Admin do vault (você no começo).
    pub admin: Pubkey,

    /// Percentual alocado em Kamino (em basis points, ex: 8000 = 80%).
    pub kamino_allocation_bps: u16,

    /// Percentual alocado em prediction markets (ex: 2000 = 20%).
    pub prediction_allocation_bps: u16,

    /// Bump do PDA do vault.
    pub bump: u8,

    /// Reservado para expansão futura (evitar migração logo de cara).
    pub _reserved: [u8; 5],
}

impl VaultConfig {
    pub const LEN: usize = 32 + 2 + 2 + 1 + 5;
}

/// Posição do usuário em um vault KaminoPredict.
/// Representa shares proporcionais ao total de capital no vault.
#[account]
pub struct UserPosition {
    /// Dono da posição (wallet do usuário).
    pub owner: Pubkey,

    /// Vault ao qual essa posição pertence.
    pub vault: Pubkey,

    /// Quantidade de shares do usuário.
    pub shares: u64,
}

impl UserPosition {
    pub const LEN: usize = 32 + 32 + 8;
}
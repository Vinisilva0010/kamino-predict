use anchor_lang::prelude::*;

#[error_code]
pub enum KaminoError {
    #[msg("Allocations must sum to 100% (10000 bps).")]
    InvalidAllocation,

    #[msg("Insufficient shares to withdraw.")]
    InsufficientShares,

    #[msg("Arithmetic overflow in amount calculation.")]
    ArithmeticOverflow,

    #[msg("Deposit amount must be greater than zero.")]
    ZeroAmount,

    #[msg("Vault token account mint mismatch.")]
    MintMismatch,

    #[msg("Invalid vault token account — expected PDA owned by program.")]
    InvalidVaultTokenAccount,

    #[msg("Vault name is too long.")]
    NameTooLong,
}
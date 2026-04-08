use anchor_lang::prelude::*;

#[error_code]
pub enum KaminoError {
    #[msg("Allocations must sum to 100% (10000 bps).")]
    InvalidAllocation,

    #[msg("Insufficient shares")]
    InsufficientShares,
}

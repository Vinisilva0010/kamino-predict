pub mod initialize_vault;
pub mod deposit;
pub mod withdraw;
pub mod harvest_and_predict; // <-- ADICIONE ESTA LINHA

pub use initialize_vault::*;
pub use deposit::*;
pub use withdraw::*;
pub use harvest_and_predict::*; // <-- ADICIONE ESTA LINHA
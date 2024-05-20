use borsh::{ BorshDeserialize, BorshSerialize };

use solana_program::{
    account_info::{ next_account_info, AccountInfo },
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
};

#[derive(BorshDeserialize, BorshSerialize, Debug)]
pub struct MessageAccount {
    pub message: String,
}

entrypoint!(process_instruction);
pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8]
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let account = next_account_info(accounts_iter);
    let copied_account = next_account_info(accounts_iter);

    let unwrapped_account = account.clone();

    if unwrapped_account.unwrap().owner != program_id {
        msg!("Account does not have the correct program id");
        return Err(ProgramError::IncorrectProgramId);
    }

    let message = String::from_utf8(instruction_data.to_vec()).map_err(
        |_| ProgramError::InvalidInstructionData
    )?;

    let mut message_account = MessageAccount::try_from_slice(&account.unwrap().data.borrow())?;
    message_account.message = message;
    let mut data = copied_account.unwrap().data.borrow_mut();
    message_account.serialize(&mut &mut data[..])?;
    msg!("Stored message: {}", message_account.message);
    Ok(())
}

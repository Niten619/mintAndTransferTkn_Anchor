use anchor_lang::prelude::*;
use anchor_spl::token::{Token, MintTo, mint_to, Transfer, transfer};

declare_id!("oG6xiYLzzpLgg61wrB8mG1nqnbyttyfiotmBHgSuvcb");

#[program]
pub mod token_mintandsend {
    use super::*;

    pub fn mint_token(ctx: Context<MintToken>) -> Result<()> {
        // define cpi context program for mint_to function
        let cpictx_program = ctx.accounts.token_program.to_account_info();
        // define MintTo struct for mint_to function
        let mint_to_struct = MintTo{
            mint: ctx.accounts.mint_account.to_account_info(),
            to: ctx.accounts.token_account.to_account_info(),
            authority: ctx.accounts.mint_authority.to_account_info(),
        };
        // create a new cpi context for mint_to function
        let cpictx = CpiContext::new(cpictx_program, mint_to_struct); 
        // Finally, use the function mint_to that mints specified tokens
        mint_to(cpictx, 100)?;
        Ok(())
    }


    pub fn transfer_token(ctx: Context<TransferToken>) -> Result<()> {
        // define cpi context program for transfer function
        let cpictx_program = ctx.accounts.token_program.to_account_info();
        // define Transfer struct for transfer function
        let transfer_struct = Transfer{
            from: ctx.accounts.sender_token_account.to_account_info(),
            to: ctx.accounts.receiver_token_account.to_account_info(),
            authority: ctx.accounts.sender_wallet.to_account_info(),
        };
        // create a new cpi context for transfer function
        let cpictx = CpiContext::new(cpictx_program, transfer_struct); 
        // Finally, use the function transfer that transfers specified tokens
        transfer(cpictx, 10)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct MintToken<'info> {
    pub token_program: Program<'info, Token>,
    /// CHECK: This token account is created using Anchor
    #[account(mut)]
    pub token_account: UncheckedAccount<'info>,
    /// CHECK: This mint account is created using Anchor
    #[account(mut)]
    pub mint_account: UncheckedAccount<'info>,
    #[account(mut)]
    pub mint_authority: Signer<'info>,

}

#[derive(Accounts)]
pub struct TransferToken<'info> {
    pub token_program: Program<'info, Token>,
    /// CHECK: This sender's ATA is created using Anchor
    #[account(mut)]
    pub sender_token_account: UncheckedAccount<'info>,
    /// CHECK: This receiver's ATA is created using Anchor
    #[account(mut)]
    pub receiver_token_account: UncheckedAccount<'info>,
    #[account(mut)]
    pub sender_wallet: Signer<'info>,

}

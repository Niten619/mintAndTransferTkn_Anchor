import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { TokenMintandsend } from "../target/types/token_mintandsend";
import {
  TOKEN_PROGRAM_ID, 
  getAssociatedTokenAddress,
  MINT_SIZE,
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction} from "@solana/spl-token";
import { SystemProgram } from "@solana/web3.js";

describe("token_mintandsend", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const wallet = anchor.AnchorProvider.env().wallet;
  const program = anchor.workspace.TokenMintandsend as Program<TokenMintandsend>;

  let token_address = undefined;

  // generate a new mint keypair that will represent the mint account
  const mint_keypair = anchor.web3.Keypair.generate();
  console.log("New Token:", mint_keypair.publicKey)


  it("Token Mint Test!", async () => {
    // get the address of the ATA which points to the pubkey of the mint_keypair
    // and whose owner is anchor wallet
    let token_address = await getAssociatedTokenAddress(
      mint_keypair.publicKey,
      wallet.publicKey
    );
    console.log("Associated Token Account Address:", token_address)
    // Instruction to create account (in this case, Mint account)
    const mint_account_inx = anchor.web3.SystemProgram.createAccount({
      fromPubkey: wallet.publicKey, //The account that will transfer lamports to the created account
      newAccountPubkey: mint_keypair.publicKey, //Public key of the created account
      lamports: 1000000000,  //Amount of lamports to transfer to the created account
      space: MINT_SIZE,  //Amount of space in bytes to allocate to the created account
      programId: TOKEN_PROGRAM_ID,  //Public key of the program to assign as the owner of the created account
    });
    // Instruction to initialize the newly created Mint account with req parameters
    const mint_account_init_inx = createInitializeMintInstruction(
      mint_keypair.publicKey,
      9,
      wallet.publicKey,
      wallet.publicKey
    );
    // Instruction to create Associated Token Account
    const token_acc_inx = createAssociatedTokenAccountInstruction(
      wallet.publicKey,
      token_address,
      wallet.publicKey,
      mint_keypair.publicKey
    );

    // Adding all 3 instructions at once to create a transaction
    const token_transaction = new anchor.web3.Transaction().add(
      mint_account_inx, 
      mint_account_init_inx,
      token_acc_inx
      );
    // Send the transaction to the network and confirm it
    const signature = await anchor.AnchorProvider.env().sendAndConfirm(
      token_transaction,
      [mint_keypair]
      );
    console.log("signature:", signature)

    // Finally since all the req accounts are now ready to go,
    // hit the on-chain program using RPC
    const tx = await program.methods.mintToken().accounts({
      tokenProgram: TOKEN_PROGRAM_ID,
      tokenAccount: token_address,
      mintAccount: mint_keypair.publicKey,
      mintAuthority: wallet.publicKey,
    }).rpc();
    console.log("Your transaction signature", tx);
  });


  it("Token Transfer Test!", async () => {
    // get the address of the ATA which points to the pubkey of the mint_keypair
    // and whose owner is anchor wallet
    let token_address = await getAssociatedTokenAddress(
      mint_keypair.publicKey,
      wallet.publicKey
    );
    console.log("Associated Token Account Address:", token_address)
    
    // generate receiver's keypair
    const receiver_keypair = anchor.web3.Keypair.generate();
    console.log("receiver keypair pubkey:", receiver_keypair.publicKey)
    // Instruction to create account (in this case, receiver account)
    const receiver_account_inx = anchor.web3.SystemProgram.createAccount({
      fromPubkey: wallet.publicKey, //The account that will transfer lamports to the created account
      newAccountPubkey: receiver_keypair.publicKey, //Public key of the created account
      lamports: 1000000000,  //Amount of lamports to transfer to the created account
      space: 82,  //Amount of space in bytes to allocate to the created account
      programId: SystemProgram.programId,  //Public key of the program to assign as the owner of the created account
    });

    // create associated token account for the receiver's wallet
    const receiver_token_address = await getAssociatedTokenAddress(
      mint_keypair.publicKey,
      receiver_keypair.publicKey
    );
    console.log("receiver_token_address:", receiver_token_address)
    // Instruction to create Associated Token Account
    const receiver_token_acc_inx = createAssociatedTokenAccountInstruction(
      wallet.publicKey,
      receiver_token_address,
      receiver_keypair.publicKey,
      mint_keypair.publicKey
    );

    // Adding these 2 instructions at once to create a transaction
    const receiver_acc_transaction = new anchor.web3.Transaction().add(
      receiver_account_inx,
      receiver_token_acc_inx
      );

    // Send the transaction to the network and confirm it
    const signature = await anchor.AnchorProvider.env().sendAndConfirm(
      receiver_acc_transaction,
      [receiver_keypair]
      );
    console.log("signature:", signature)

    // Finally since all the req accounts are now ready to go,
    // hit the on-chain program using RPC
    const tx = await program.methods.transferToken().accounts({
      tokenProgram: TOKEN_PROGRAM_ID,
      senderTokenAccount: token_address,
      receiverTokenAccount: receiver_token_address,
      senderWallet: wallet.publicKey,
    }).rpc();
    console.log("Your transaction signature", tx);

  });
});

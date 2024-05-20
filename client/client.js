const {
    Connection,
    PublicKey,
    clusterApiUrl,
    Keypair,
    SystemProgram,
    Transaction,
    TransactionInstruction,
    sendAndConfirmTransaction,
    LAMPORTS_PER_SOL,
} = require('@solana/web3.js');
const { serialize, deserialize } = require('borsh');

const PROGRAM_ID = new PublicKey('5AKBhzDzMNFTKa2ibG18tLffYweiiR11kZuX29CeKGK'); 
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

class MessageAccount {
    constructor(properties) {
        Object.keys(properties).forEach(key => {
            this[key] = properties[key];
        });
    }
}

const MessageAccountSchema = new Map([
    [MessageAccount, { kind: 'struct', fields: [['message', 'string']] }],
]);

const initializeAccount = async () => {
    const payer = Keypair.generate();
    const messageAccount = Keypair.generate();

    const airdropSignature = await connection.requestAirdrop(
        payer.publicKey,
        2 * LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(airdropSignature);

    const instruction = SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: messageAccount.publicKey,
        lamports: await connection.getMinimumBalanceForRentExemption(1000),
        space: 1000,
        programId: PROGRAM_ID,
    });

    const transaction = new Transaction().add(instruction);
    await sendAndConfirmTransaction(connection, transaction, [payer, messageAccount]);

    return { payer, messageAccount };
};

const updateMessage = async (payer, messageAccount, message) => {
    const serializedMessage = serialize(
        MessageAccountSchema,
        new MessageAccount({ message: message })
    );

    const instruction = new TransactionInstruction({
        keys: [{ pubkey: messageAccount.publicKey, isSigner: false, isWritable: true }],
        programId: PROGRAM_ID,
        data: Buffer.from(serializedMessage),
    });

    const transaction = new Transaction().add(instruction);
    await sendAndConfirmTransaction(connection, transaction, [payer]);

    const accountInfo = await connection.getAccountInfo(messageAccount.publicKey);
    const updatedMessageAccount = deserialize(
        MessageAccountSchema,
        MessageAccount,
        accountInfo.data
    );

    console.log('Updated Message:', updatedMessageAccount.message);
};

const main = async () => {
    const { payer, messageAccount } = await initializeAccount();
    await updateMessage(payer, messageAccount, 'Hello, Solana!');
};

main();

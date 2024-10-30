const solanaWeb3 = require('@solana/web3.js');

const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('mainnet-beta'), 'confirmed');


function createWallet() {
    const myWallet = solanaWeb3.Keypair.generate();
    return {
        wallet: myWallet,
        address: myWallet.publicKey.toString(),
        privateKey: Array.from(myWallet.secretKey)
    };
}

async function recoverWallet(pkOrMnemonic) {
    // Verifica se é um Uint8Array ou uma string
    let secretKeyArray;
    if (pkOrMnemonic instanceof Uint8Array) {
        secretKeyArray = pkOrMnemonic;
    } else if (typeof pkOrMnemonic === 'string' && pkOrMnemonic.indexOf(" ") === -1) {
        secretKeyArray = Uint8Array.from(pkOrMnemonic.split(',').map(Number));
    } else {
        throw new Error("Solana não suporta nativamente a recuperação por mnemônico");
    }

    const myWallet = solanaWeb3.Keypair.fromSecretKey(secretKeyArray);
    return {
        wallet: myWallet,
        address: myWallet.publicKey.toString(),
        privateKey: Array.from(myWallet.secretKey)
    };
}



async function getBalance(address) {
    const publicKey = new solanaWeb3.PublicKey(address);
    const balance = await connection.getBalance(publicKey);
    return {
        balanceInLamports: balance,
        balanceInSOL: balance / solanaWeb3.LAMPORTS_PER_SOL
    };
}


function addressIsValid(address) {
    try {
        new solanaWeb3.PublicKey(address);
        return true;
    } catch (e) {
        return false;
    }
}

async function buildTransaction(myWallet, toWallet, amountInSOL) {
    const transaction = new solanaWeb3.Transaction().add(
        solanaWeb3.SystemProgram.transfer({
            fromPubkey: myWallet.publicKey,
            toPubkey: new solanaWeb3.PublicKey(toWallet),
            lamports: amountInSOL * solanaWeb3.LAMPORTS_PER_SOL,
        }),
    );
    const { blockhash } = await connection.getRecentBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = myWallet.publicKey;

    // Calcular a taxa de transação (aproximada)
    const txFee = 5000; // Estimativa de taxas de transações recentes

    const balance = await connection.getBalance(myWallet.publicKey);
    if (balance < amountInSOL * solanaWeb3.LAMPORTS_PER_SOL + txFee) {
        return false;
    }
    return transaction;
}

async function sendTransaction(transaction, myWallet) {
    const signature = await solanaWeb3.sendAndConfirmTransaction(connection, transaction, [myWallet]);
    return signature;
}

module.exports = {
    createWallet,
    recoverWallet,
    getBalance,
    addressIsValid,
    buildTransaction,
    sendTransaction
};

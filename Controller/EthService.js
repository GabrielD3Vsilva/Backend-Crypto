const { ethers } = require('ethers');

// Conexão à rede Ethereum
const provider = new ethers.providers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/aIBlgH6Ux2NDOmtuz-vQ4nGg-ELApfVf');

let myWallet = null;

function createWallet() {
    const wallet = ethers.Wallet.createRandom();
    return {
        wallet: wallet,
        address: wallet.address,
        privateKey: wallet.privateKey
    };
}

function recoverWallet(pkOrMnemonic) {
    myWallet = pkOrMnemonic.indexOf(" ") !== -1
        ? ethers.Wallet.fromMnemonic(pkOrMnemonic)
        : new ethers.Wallet(pkOrMnemonic, provider);

    return myWallet;
}

async function getBalance(address) {
    const balance = await provider.getBalance(address);
    return {
        balanceInWei: balance,
        balanceInEth: ethers.utils.formatEther(balance) // Uso correto de ethers.utils.formatEther
    };
}

function addressIsValid(address) {
    return ethers.utils.isAddress(address); // Uso correto de ethers.utils.isAddress
}

async function buildTransaction(toWallet, amountInEth) {
    if (!addressIsValid(toWallet)) {
        throw new Error("Endereço inválido.");
    }

    if (isNaN(parseFloat(amountInEth))) {
        throw new Error("Valor inválido para amountInEth. Deve ser uma string numérica.");
    }
    
    const amount = ethers.utils.parseEther(amountInEth); // Uso correto de ethers.utils.parseEther
    const amountBigInt = BigInt(amount.toString()); // Convertendo para BigInt

    const tx = {
        to: toWallet,
        value: amountBigInt
    };

    const feeData = await provider.getFeeData();
    const txFee = 21000n * BigInt(feeData.gasPrice.toString()); // Convertendo para BigInt

    const balance = await provider.getBalance(myWallet.address);
    const balanceBigInt = BigInt(balance.toString()); // Convertendo para BigInt

    if (balanceBigInt < (amountBigInt + txFee)) {
        throw new Error("Saldo insuficiente.");
    }
    return tx;
}

async function sendTransaction(tx) {
    const response = await myWallet.sendTransaction(tx);
    return response.hash;
}

module.exports = {
    createWallet,
    recoverWallet,
    getBalance,
    addressIsValid,
    buildTransaction,
    sendTransaction
};

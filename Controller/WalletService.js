const { ethers } = require('ethers');

// Conexão à rede Ethereum
const provider = new ethers.providers.JsonRpcProvider('https://polygon-rpc.com');

let myWallet = null;

function createWallet() {
    myWallet = ethers.Wallet.createRandom(provider);
    return myWallet.privateKey;
}

function recoverWallet(pkOrMnemonic) {
    myWallet = pkOrMnemonic.indexOf(" ") !== -1
        ? ethers.Wallet.fromMnemonic(pkOrMnemonic, provider) // Mudando de fromPhrase para fromMnemonic
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
    const amount = ethers.utils.parseEther(amountInEth); // Uso correto de ethers.utils.parseEther

    const tx = {
        to: toWallet,
        value: amount
    };

    const feeData = await provider.getFeeData();
    const txFee = 21000n * BigInt(feeData.gasPrice.toString()); // Garantindo BigInt

    const balance = await provider.getBalance(myWallet.address);
    const balanceBigInt = BigInt(balance.toString()); // Convertendo para BigInt

    if (balanceBigInt < (amount + txFee)) {
        return false;
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

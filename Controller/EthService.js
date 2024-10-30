const { ethers } = require("ethers");
const provider = new ethers.JsonRpcProvider('https://eth-mainnet.alchemyapi.io/v2/aIBlgH6Ux2NDOmtuz-vQ4nGg-ELApfVf');

let myWallet = null;

function createWallet() {
    myWallet = ethers.Wallet.createRandom().connect(provider);
    return {
        wallet: myWallet.address,
        privateKey: myWallet.privateKey
    };
}

function recoverWallet(pkOrMnemonic) {
    myWallet = pkOrMnemonic.indexOf(" ") !== -1 ?
        ethers.Wallet.fromMnemonic(pkOrMnemonic).connect(provider) :
        new ethers.Wallet(pkOrMnemonic).connect(provider);
    return myWallet;
}

async function getBalance(address) {
    const balance = await provider.getBalance(address);
    return {
        balanceInWei: balance,
        balanceInEth: ethers.utils.formatEther(balance)
    };
}

function addressIsValid(address) {
    return ethers.utils.isAddress(address);
}

async function buildTransaction(toWallet, amountInEth) {
    const amount = ethers.utils.parseEther(amountInEth);
    const tx = {
        to: toWallet,
        value: amount
    };

    const feeData = await provider.getFeeData();
    const txFee = ethers.BigNumber.from(21000).mul(feeData.gasPrice);

    const balance = await provider.getBalance(myWallet.address);
    if (balance.lt(amount.add(txFee))) {
        return false;
    }

    return tx;
}

function sendTransaction(tx) {
    return myWallet.sendTransaction(tx);
}

// Adiciona função para obter a chave privada
function getPrivateKey() {
    return myWallet.privateKey;
}

module.exports = {
    createWallet,
    recoverWallet,
    getBalance,
    addressIsValid,
    buildTransaction,
    sendTransaction,
    getPrivateKey // Exporta a função
};

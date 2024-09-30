const {ethers} = require("ethers");

const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_NODE);

let myWallet = null;

function createWallet() {
    myWallet = ethers.Wallet.createRandom(provider);
    return myWallet;
}

function recoverWallet(pkOrMnemonic){
    myWallet = pkOrMnemonic.indexOf(" ") !== -1
        ? ethers.Wallet.fromPhrase(pkOrMnemonic, provider)
        : new ethers.Wallet(pkOrMnemonic, provider);

    return myWallet;
}

async function getBalance(address){
    const balance = await provider.getBalance(address);
    return {
        balaceInWei: balance,
        balanceInEth: ethers.formatEther(balance)
    }

}

function addressIsValid(address){
    return ethers.isAddress(address);
}

async function buildTransaction(toWallet, amountInEth){
    const amount = ethers.parseEther(amountInEth);

    const tx = {
        to: toWallet,
        value: amount
    };

    const feeData = await provider.getFeeData();
    const txFee = 21000n * feeData.gasPrice;


    const balance = await provider.getBalance(myWallet.address);

    if(balance < (amount + txFee)) {
        return false;
    }
    return tx;
}

function sendTransaction(tx) {
    return myWallet.sendTransaction(tx);
}

module.exports = {
    createWallet,
    recoverWallet,
    getBalance,
    addressIsValid,
    buildTransaction,
    sendTransaction
}
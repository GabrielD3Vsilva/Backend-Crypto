const WalletService = require('./WalletService');
const {ethers} = require("ethers");
const SolanaService = require("./SolanaService");

async function sendCrypto(req, res) {
    const { coin, amountInEth, toWallet, pK } = req.body;

    if (!toWallet || !amountInEth || !pK) {
        return res.status(400).send('Missing required fields');
    }

    let myWallet = WalletService.recoverWallet(pK); // Atualizando para 'let'

    const myAddress = myWallet.address;

    console.log('Your recovered wallet: ');
    console.log(myAddress);

    if (!myAddress) {
        console.log('You don\'t have a wallet yet! ');
        return res.status(400).send('No wallet found');
    }
    
    if (!WalletService.addressIsValid(toWallet)) {
        console.log('Invalid Wallet');
        return res.status(400).send('invalid wallet');
    }

    const bal = await WalletService.getBalance(myAddress);
    
    if (!amountInEth) {
        console.log('Invalid amount');
        return res.status(400).send('invalid amount');
    }

    const tx = await WalletService.buildTransaction(toWallet, amountInEth);

    if (!tx) {
        console.log('Insufficient balance');
        return res.status(400).send('insufficient balance');
    }

    try {
        const txReceipt = await WalletService.sendTransaction(tx);
        console.log('Transaction successful!');
        console.log(txReceipt);
        return res.send(txReceipt);
    } catch (err) {
        console.log(err);
        return res.status(500).send('Transaction failed');
    }
}



async function getBalance(req, res) {
    const { pK, currency, pKSolana } = req.body;

    const provider = validatePK(currency);

    if (currency === 'SOL') {
        const pKUint = new Uint8Array(pKSolana);
        const pKString = Array.from(pKUint).join(','); // Converte o array em string sem espaços
        let myWallet = SolanaService.recoverWallet(pKString);

        const myAddress = myWallet.address;

        if (!myAddress) {
            console.log('You don\'t have a wallet yet!');
            return res.status(200).send('You don\'t have a wallet yet!');
        }
        const { balanceInSOL } = await WalletService.getBalance(myAddress);
        return res.status(200).send(balanceInSOL);
    }

    let myWallet = WalletService.recoverWallet(pK);
    const myAddress = myWallet.address;

    if (!myAddress) {
        console.log('You don\'t have a wallet yet!');
        return res.status(200).send('You don\'t have a wallet yet!');
    }

    const balance = await provider.getBalance(myAddress);
    
    const balanceInEth = {
        balanceInWei: balance.toString(),
        balanceInEth: ethers.formatEther(balance)
    }

    console.log(`${currency} ${balanceInEth.balanceInEth}`);

    return res.status(200).send(balanceInEth);
}


function validatePK (currency) {
    switch (currency) {
        case 'POL':
            return new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_NODE);
        
        case 'SOL':
            return 'SOL';
        default:
            throw new Error('Unsupported currency');
    }
}


module.exports = {sendCrypto, getBalance};

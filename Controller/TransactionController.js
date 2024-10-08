const WalletService = require('./WalletService');

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
    const { pK, currency } = req.body;

    const provider = validatePK(currency);

    let myWallet = WalletService.recoverWallet(pK);
    const myAddress = myWallet.address;

    if (!myAddress) {
        console.log('You don\'t have a wallet yet!');
        return res.status(200).send('You don\'t have a wallet yet!');
    }

    const balance = await provider.getBalance(myAddress);
    
    const balanceInEth = {
        balaceInWei: balance,
        balanceInEth: ethers.formatEther(balance)
    }


    console.log(`${currency} ${balanceInEth}`);

    return res.status(200).send(balanceInEth);
}


function validatePK (pK) {
    if ( pK == 'POL') {
        return new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_NODE);
    }

    if ( pK == 'ETH' ) {
        return new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_ETH);
    }

    if ( pK == 'SOL' ) {
        return new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_SOL);
    }

    if ( pK == 'DOGE' ) {
        return new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_DOGE);
    }

    if ( pK == 'BTC' ) {
        return new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_BTC);
    }

    if ( pK == 'ADA' ) {
        return new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_ADA);
    }
}


module.exports = {sendCrypto, getBalance};

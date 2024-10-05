const WalletService = require('./WalletService');


const  myWallet = null;

async function sendCrypto ( req, res ) {    
    const {amountInEth, toWallet, pK } = req.body;

    const myWallet = WalletService.recoverWallet(pK);

    const myAddress = myWallet.address;

    console.log('Your recovered wallet: ');
    console.log(myAddress);

    if (!myAddress) {
        console.log('You don\'t have a wallet yet! ');
    }
    
    if (!WalletService.addressIsValid(toWallet)) {
        console.log('Invalid Wallet');
        return res.status(400).send('invalid wallet');
    }

    if (!amountInEth) {
        console.log('Invalid amount');
        return res.status(400).send('invalid amount');
    }

    const tx = WalletService.buildTransaction(toWallet, amountInEth);

    if (!tx) {
        console.log('Insufficient balance');
        return res.status(400).send('invalid amount');
    }

    try {
        const txReceipt = await WalletService.sendTransaction(tx);

        console.log('Transaction successful!');
        console.log(txReceipt);

        return res.send(txReceipt);
    } catch (err) {
        console.log(err);
    }
}

module.exports = {sendCrypto};
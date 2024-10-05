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


module.exports = {sendCrypto};

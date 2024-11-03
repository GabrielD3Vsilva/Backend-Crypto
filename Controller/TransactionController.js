const WalletService = require('./WalletService');
const {ethers} = require("ethers");
const SolanaService = require("./SolanaService");
const solanaWeb3 = require('@solana/web3.js');
const BitcoinService = require('./BitcoinService');
const DogeService = require('./DogeService');
const EthService = require('./EthService');

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
    const { pK, currency, pKSolana, pKEth, pKBitcoin, pKDoge } = req.body;

    const provider = validatePK(currency);

    if (provider == 'SOL') {
        const pKUint = new Uint8Array(pKSolana);
        const pKArray = Object.values(pKSolana).join(',');

        if (pKUint.length !== 64) {
            return res.status(400).send('Invalid secret key length for Solana');
        }

        try {
            const walletDetails = await SolanaService.recoverWallet(pKArray);
            
            if (!walletDetails.address) {
                console.log('You don\'t have a wallet yet!');
                return res.status(400).send('You don\'t have a wallet yet!');
            }
        
            const balance = await SolanaService.getBalance(walletDetails.address);
            
            const balanceInSOL = {
                balanceInLamports: balance,
                balanceInSOL: balance / solanaWeb3.LAMPORTS_PER_SOL
            }
        
            return res.status(200).send(balanceInSOL);

        } catch (err) {
            console.error('Failed to recover wallet:', err.message);
        }
    } else if (provider == 'BTC') {
        const walletDetails = BitcoinService.recoverWallet(pKBitcoin);
        const myAddress = walletDetails.address;
        const balance = await BitcoinService.getBalance(myAddress);
        return res.send(balance);
    } else if (provider == 'DOGE') {
        const walletDetails = DogeService.recoverWallet(pKDoge);
        const myAddress = walletDetails.privateKey;
        const balance = await DogeService.getBalance(myAddress);
        return res.send(balance);
    } else {
        let myWallet = WalletService.recoverWallet(pK);

        const myAddress = myWallet.address;

        if (!myAddress) {
            console.log('You don\'t have a wallet yet!');
            return res.status(200).send('You don\'t have a wallet yet!');
        }

        const balance = await provider.getBalance(myAddress);

        const balanceInEth = {
            balanceInWei: balance.toString(),
            balanceInEth: ethers.utils.formatEther(balance) // Corrigido aqui!
        }

        console.log(`${currency} ${balanceInEth}`);

        return res.status(200).send(balanceInEth);
    }
}




function validatePK (currency) {
    switch (currency) {
        case 'POL':
            return new ethers.providers.JsonRpcProvider('https://polygon-rpc.com');
        case 'SOL':
            return 'SOL';
        case 'ETH':
            return 'ETH';
        case 'DOGE':
            return 'DOGE';
        case 'BTC':
            return 'BTC';
        default:
            throw new Error('Unsupported currency');
    }
}


module.exports = {sendCrypto, getBalance};

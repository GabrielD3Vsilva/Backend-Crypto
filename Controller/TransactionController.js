const WalletService = require('./WalletService');
const { ethers } = require("ethers");
const SolanaService = require("./SolanaService");
const solanaWeb3 = require('@solana/web3.js');
const BitcoinService = require('./BitcoinService');
const DogeService = require('./DogeService');
const EthService = require('./EthService');


//Realização de transação em diferentes carteiras
async function sendCrypto(req, res) {
    const { currency, amountInEth, toWallet, pK } = req.body;
    let provider = validatePK(currency);

    if ( provider == 'ETH' ) {
        provider = new ethers.providers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/aIBlgH6Ux2NDOmtuz-vQ4nGg-ELApfVf');

        const walletDetails = await EthService.recoverWallet(pK);
        const myAddress = walletDetails.address;

        if (!myAddress) {
            console.log('You don\'t have a wallet yet!');
            return res.status(400);
        }

        if (!EthService.addressIsValid(toWallet)) {
            console.log('Invalid Wallet');
            return res.status(400);
        }

        try {
            const tx = await EthService.buildTransaction(toWallet, amountInEth);

            if (!tx) {
                console.log('Insufficient balance');
                return res.send('Insufficient balance');
            }
            
            const txReceipt = await EthService.sendTransaction(tx);

            return res.send('Transaction successful!', txReceipt);
        } catch (err) {
            console.log(err);
        }
    }



    if ( currency == 'BTC' ) {
        const walletDetails = await BitcoinService.recoverWallet(pK);
        const myAddress = walletDetails.address;

        if (!myAddress) {
            console.log('You don\'t have a wallet yet!');
            return res.status(400);
        }

        if (!BitcoinService.addressIsValid(toWallet)) {
            console.log('Invalid Wallet');
            return res.status(400);
        }

        try {
            const tx = await BitcoinService.buildTransaction(toWallet, amountInEth);

            if (!tx) {
                console.log('Insufficient balance');
                return res.send('Insufficient balance');
            }
            
            const txReceipt = await BitcoinService.sendTransaction(tx);

            return res.send('Transaction successful!', txReceipt);
        } catch (err) {
            console.log(err);
        }

    }


    if ( currency == 'POL' ) {
        const walletDetails = await WalletService.recoverWallet(pK);
        const myAddress = walletDetails.address;

        if (!myAddress) {
            console.log('You don\'t have a wallet yet!');
            return res.status(400);
        }
        
        if (!WalletService.addressIsValid(toWallet)) {
            console.log('Invalid Wallet');
            return res.send('Invalid wallet');
        }

        const tx = await WalletService.buildTransaction(toWallet, parseFloat(amountInEth));

        
        if (!tx) {
            console.log('Insufficient balance');
            return res.send('Insufficient balance');
        }

        const txReceipt = await WalletService.sendTransaction(tx);

        return res.send(txReceipt);

    }


    if ( currency == 'DOGE' ) {
        const walletDetails = await DogeService.recoverWallet(pK);
        const myAddress = walletDetails.address;

        if (!myAddress) {
            console.log('You don\'t have a wallet yet!');
            return res.status(400);
        }
        
        if (!DogeService.addressIsValid(toWallet)) {
            console.log('Invalid Wallet');
            return res.send('Invalid wallet');
        }

        const tx = await DogeService.buildTransaction(toWallet, parseFloat(amountInEth));

        
        if (!tx) {
            console.log('Insufficient balance');
            return res.send('Insufficient balance');
        }

        const txReceipt = await DogeService.sendTransaction(tx);

        return res.send(txReceipt);
    }


    if ( currency == 'SOL' ) {
        const walletDetails = await SolanaService.recoverWallet(pK);
        const myAddress = walletDetails.address;

        if (!myAddress) {
            console.log('You don\'t have a wallet yet!');
            return res.status(400);
        }
        
        if (!SolanaService.addressIsValid(toWallet)) {
            console.log('Invalid Wallet');
            return res.send('Invalid wallet');
        }

        const tx = await SolanaService.buildTransaction(toWallet, parseFloat(amountInEth));

        
        if (!tx) {
            console.log('Insufficient balance');
            return res.send('Insufficient balance');
        }

        const txReceipt = await SolanaService.sendTransaction(tx);

        return res.send(txReceipt);
    }


   

 
    

}








//Verificação e retorno de saldo em diferentes carteiras 
async function getBalance(req, res) {
    const { pK, currency, pKSolana, pKEth, pKBitcoin, pKDoge } = req.body;

    let provider = validatePK(currency);

    if (provider == 'ETH') {
        provider = new ethers.providers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/aIBlgH6Ux2NDOmtuz-vQ4nGg-ELApfVf');
        const walletDetails = await EthService.recoverWallet(pKEth);
        const myAddress = walletDetails.address;
    
        const balanceWei = await provider.getBalance(myAddress);
        const balanceEth = ethers.utils.formatEther(balanceWei); // Converte Wei para ETH
    
        return res.send({ balanceInEth: balanceEth }); // Retorna o saldo em ETH
    }
    

    if (provider == 'SOL') {
        const pKUint = new Uint8Array(pKSolana);
        const pKArray = Object.values(pKSolana).join(',');

        if (pKUint.length !== 64) {
            return res.status(400).send('Invalid secret key length for Solana');
        }

        try {
            const walletDetails = await SolanaService.recoverWallet(pKArray);
            
            if (!walletDetails.address) {
                console.log('You don\'t have a wallet yet! ');
                return res.status(400).send('You don\'t have a wallet yet! ');
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
    }


    if(provider == 'BTC') {
        const walletDetails = BitcoinService.recoverWallet(pKBitcoin);
        const myAddress = walletDetails.address;
        const balance = await BitcoinService.getBalance(myAddress);
        return res.send(balance);
    }


    if(provider == 'DOGE') {
        const walletDetails = DogeService.recoverWallet(pKDoge);
        const myAddress = walletDetails.privateKey;
        const balance = await DogeService.getBalance(myAddress);
        return res.send(balance);
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
        balanceInEth: ethers.utils.formatEther(balance)
    }

    console.log(`${currency} ${balanceInEth}`);

    return res.status(200).send(balanceInEth);
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

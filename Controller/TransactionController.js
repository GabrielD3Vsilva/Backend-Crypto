const WalletService = require('./WalletService');
const { ethers } = require("ethers");
const SolanaService = require("./SolanaService");
const solanaWeb3 = require('@solana/web3.js');
const BitcoinService = require('./BitcoinService');
const DogeService = require('./DogeService');
const EthService = require('./EthService');
const Db = require('../db/Db');



async function returnAllTransactions ( req, res ) {
    const { id } = req.body;
    const user = await Db.User.findOne({_id: id});

    return res.send(user);
}

async function returnAllBalances ( req, res ) {
    const { pK, pKSolana, pKEth, pKBitcoin, pKDoge } = req.body;

    const balanceInPOL = await findBalancePOL( pK );
    const balanceInETH = await findBalanceETH( pKEth );
    const balanceInBTC = await findBalanceBTC( pKBitcoin );
    const balanceInDOGE = await findBalanceDOGE( pKDoge );
    const balanceInSOL = await findBalanceSOL( pKSolana );

    const obj = {
        balanceInPOL: balanceInPOL,
        balanceInETH: balanceInETH,
        balanceInBTC: balanceInBTC,
        balanceInDOGE: balanceInDOGE,
        balanceInSOL: balanceInSOL
    }


    return res.send(obj);
}

async function findBalanceDOGE ( pKDoge ) {
    const walletDetails = DogeService.recoverWallet(pKDoge);
    const myAddress = walletDetails.privateKey;
    const balance = await DogeService.getBalance(myAddress);

    return balance;
}

async function findBalanceSOL (pKSolana) {
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
        
            return balanceInSOL.balanceInSOL;

        } catch (err) {
            console.error('Failed to recover wallet:', err.message);
        }
}

async function findBalanceBTC ( pKBitcoin ) {
    const walletDetails = BitcoinService.recoverWallet(pKBitcoin);
    const myAddress = walletDetails.address;
    const balance = await BitcoinService.getBalance(myAddress);
    return balance;
}

async function findBalancePOL( pK ) {
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

    return balanceInEth.balanceInEth;
}

async function findBalanceETH ( pKEth ) {
    provider = new ethers.providers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/aIBlgH6Ux2NDOmtuz-vQ4nGg-ELApfVf');
    const walletDetails = await EthService.recoverWallet(pKEth);
    const myAddress = walletDetails.address;

    const balanceWei = await provider.getBalance(myAddress);
    return ethers.utils.formatEther(balanceWei);
}


//Realização de transação em diferentes carteiras
async function sendCrypto(req, res) {
    const { wallet, currency, amountInEth, toWallet, pK, id } = req.body;
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
            const user = await Db.User.findOne({_id: id});

            if (!user) {
                console.log('Usuário não encontrado')
                return res.status(404).send('Usuário não encontrado');
            }

            const tx = await EthService.buildTransaction(toWallet, amountInEth);

            if (!tx) {
                console.log('Insufficient balance');
                return res.send('Insufficient balance');
            }
            
            const txReceipt = await EthService.sendTransaction(tx);

            user.PaymentsArray.push(
                {
                    wallet: wallet,
                    amount: amountInEth,
                    toWallet: toWallet,
                    currency: currency
                }
            );

            await user.save();

            return res.send('Transaction successful!', txReceipt);
        } catch (err) {
            console.log(err);
        }
    }



    if ( currency == 'BTC' ) {
        const user = await Db.User.findOne({_id: id});
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

            user.PaymentsArray.push(
                {
                    wallet: wallet,
                    amount: amountInEth,
                    toWallet: toWallet,
                    currency: currency
                }
            );
            await user.save();
            return res.send('Transaction successful!', txReceipt);
        } catch (err) {
            console.log(err);
        }

    }



    if ( currency == 'POL' ) {
        const user = await Db.User.findOne({_id: id});
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

        user.PaymentsArray.push(
            {
                wallet: wallet,
                amount: amountInEth,
                toWallet: toWallet,
                currency: currency
            }
        );
        await user.save();
        return res.send(txReceipt);

    }


    if ( currency == 'DOGE' ) {
        const user = await Db.User.findOne({_id: id});

        const walletDetails = await DogeService.recoverWallet(pK);
        const myAddress = walletDetails.address;

        const myWallet = { address: walletDetails.address, privateKey: walletDetails.privateKey };

        if (!myAddress) {
            console.log('You don\'t have a wallet yet!');
            return res.status(400);
        }
        
        if (!DogeService.addressIsValid(toWallet)) {
            console.log('Invalid Wallet');
            return res.send('Invalid wallet');
        }

        const tx = await DogeService.buildTransaction(myWallet , toWallet, parseFloat(amountInEth));

        
        if (!tx) {
            console.log('Insufficient balance');
            return res.send('Insufficient balance');
        }

        const txReceipt = await DogeService.sendTransaction(tx);
        user.PaymentsArray.push(
            {
                wallet: wallet,
                amount: amountInEth,
                toWallet: toWallet,
                currency: currency
            }
        );
        await user.save();
        return res.send(txReceipt);
    }


    if ( currency == 'SOL' ) {
        const user = await Db.User.findOne({_id: id});
        const pKUint = new Uint8Array(pK);
        const pKArray = Object.values(pK).join(',');
        const walletDetails = await SolanaService.recoverWallet(pKArray);
        const myWallet = { address: walletDetails.address, privateKey: walletDetails.privateKey }; 

        const tx = await SolanaService.buildTransaction(toWallet, parseFloat(amountInEth));

        if (!tx) {
            console.log('Insufficient balance');
            return res.send('Insufficient balance');
        }

        user.PaymentsArray.push(
            {
                wallet: wallet,
                amount: amountInEth,
                toWallet: toWallet,
                currency: currency
            }
        );
        await user.save();

        const txReceipt = await SolanaService.sendTransaction(tx);
        console.log('Transaction successful!');
        console.log(txReceipt);

        return res.send(myWallet);
    }


}

/*
    
*/

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


module.exports = {sendCrypto, getBalance, returnAllTransactions, returnAllBalances};

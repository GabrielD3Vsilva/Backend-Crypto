const Db = require('../db/Db');
const WalletService = require('./WalletService');
const SolanaService = require('./SolanaService');
const DogeService = require('./DogeService');
const EthService = require('./EthService');
const BitcoinService = require('./BitcoinService');

const DoRegisterInDb = async ( req, res ) => {
    const { name, email, password, cpf, selectedLanguage } = req.body;

    const user = await Db.User.findOne({
        email: email
    });

    if (user) {
        return res.status(400).send('User already exists');
    }

    const wallet = WalletService.createWallet();
    const walletSolana = SolanaService.createWallet();
    const walletDogeService = DogeService.createWallet();
    const walletEthService = EthService.createWallet();
    const walletBitcoinService = BitcoinService.createWallet();

    try {
        await Db.User.create({
            name: name,
            email: email,
            password: password,
            isValidateDocuments: false,
            wallet: wallet.address,
            pK: wallet.privateKey,
            pKSolana: walletSolana.privateKey,
            walletSolana: walletSolana.address,
            walletDoge: walletDogeService.address,
            pKDoge: walletDogeService.privateKey,
            walletEth: walletEthService.address,
            pKEth: walletEthService.privateKey,
            walletBitcoin: walletBitcoinService.privateKey,
            pKBitcoin: walletBitcoinService.privateKey,
            language: selectedLanguage,
            cpf: cpf
        });

        return res.send(wallet);
    } catch (err) {
        console.error(err);
        return res.status(500).send('Internal Server Error');
    }
}

module.exports = {DoRegisterInDb};
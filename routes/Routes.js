const routes = require('express').Router();
const axios = require('axios');
const ethers = require('ethers');
const RegisterController = require('../Controller/RegisterController');
const LoginController = require('../Controller/LoginController');
const DocumentsController = require('../Controller/DocumentsController');
const TransactionController = require('../Controller/TransactionController');
const { findCryptoShops } = require('../Controller/FindLocations');
const CryptoService = require('../Controller/CryptosService');

routes.post('/register', RegisterController.DoRegisterInDb);
routes.post('/login', LoginController.DoLoginInDb);
routes.post('/validateDocuments', DocumentsController.GetDocumentsToValidate);
routes.post('/sendCoin', TransactionController.sendCrypto);
routes.post('/getBalance', TransactionController.getBalance);
routes.post('/findCryptoShops', findCryptoShops)
routes.post('/returnTransactions', TransactionController.returnAllTransactions);
routes.post('/returnAllBalances', TransactionController.returnAllBalances);
routes.get('/getCryptoData', CryptoService.getCryptoData);


const provider = new ethers.providers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/aIBlgH6Ux2NDOmtuz-vQ4nGg-ELApfVf');

let myWallet = null;

routes.post('/create-wallet', (req, res) => {
    const wallet = ethers.Wallet.createRandom();
    res.json({ address: wallet.address, privateKey: wallet.privateKey });
});

routes.post('/recover-wallet', (req, res) => {
    const { pkOrMnemonic } = req.body;
    myWallet = pkOrMnemonic.indexOf(" ") !== -1 ? ethers.Wallet.fromMnemonic(pkOrMnemonic) : new ethers.Wallet(pkOrMnemonic, provider);
    res.json({ address: myWallet.address });
});

routes.post('/get-balance', async (req, res) => {
    const { address } = req.body;
    const balance = await provider.getBalance(address);
    res.json({ balanceInWei: balance.toString(), balanceInEth: ethers.utils.formatEther(balance) });
});

routes.post('/validate-address', (req, res) => {
    const { address } = req.body;
    res.json({ isValid: ethers.utils.isAddress(address) });
});

routes.post('/build-transaction', async (req, res) => {
    const { toWallet, amountInEth } = req.body;
    if (!ethers.utils.isAddress(toWallet)) {
        return res.status(400).send("Endereço inválido.");
    }
    if (isNaN(parseFloat(amountInEth))) {
        return res.status(400).send("Valor inválido para amountInEth. Deve ser uma string numérica.");
    }
    const amount = ethers.utils.parseEther(amountInEth);
    const amountBigInt = BigInt(amount.toString());
    const tx = { to: toWallet, value: amountBigInt };
    const feeData = await provider.getFeeData();
    const txFee = 21000n * BigInt(feeData.gasPrice.toString());
    const balance = await provider.getBalance(myWallet.address);
    const balanceBigInt = BigInt(balance.toString());
    if (balanceBigInt < (amountBigInt + txFee)) {
        return res.status(400).send("Saldo insuficiente.");
    }
    res.json(tx);
});

routes.post('/send-transaction', async (req, res) => {
    const { tx } = req.body;
    const response = await myWallet.sendTransaction(tx);
    res.json({ hash: response.hash });
});

routes.post('/process-pix', async (req, res) => {
    const { amountInEth, pixInfo } = req.body;
    try {
        const paymentResponse = await axios.post('https://api.pix.com/process-payment', { amount: pixInfo.amount, key: pixInfo.key });
        if (paymentResponse.data.success) {
            const transaction = await buildTransaction(myWallet.address, amountInEth);
            const txHash = await sendTransaction(transaction);
            res.json({ success: true, txHash });
        } else {
            res.json({ success: false, message: 'Falha no processamento do PIX' });
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
});


module.exports = routes;

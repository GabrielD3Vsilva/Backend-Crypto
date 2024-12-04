const routes = require('express').Router();
const RegisterController = require('../Controller/RegisterController');
const LoginController = require('../Controller/LoginController');
const DocumentsController = require('../Controller/DocumentsController');
const TransactionController = require('../Controller/TransactionController');
const { findCryptoShops } = require('../Controller/FindLocations');
const CryptoService = require('../Controller/CryptosService');
const axios = require('axios'); 
const ethers = require('ethers');

routes.post('/register', RegisterController.DoRegisterInDb);
routes.post('/login', LoginController.DoLoginInDb);
routes.post('/validateDocuments', DocumentsController.GetDocumentsToValidate);
routes.post('/sendCoin', TransactionController.sendCrypto);
routes.post('/getBalance', TransactionController.getBalance);
routes.post('/findCryptoShops', findCryptoShops)
routes.post('/returnTransactions', TransactionController.returnAllTransactions);
routes.post('/returnAllBalances', TransactionController.returnAllBalances);
routes.get('/getCryptoData', CryptoService.getCryptoData);


const ETHEREUM_API_URL = 'https://eth-mainnet.g.alchemy.com/v2/aIBlgH6Ux2NDOmtuz-vQ4nGg-ELApfVf'; // URL da API Alchemy

routes.post('/create-payment', async (req, res) => {
    const { amount, walletAddress } = req.body;
    const paymentData = await createPixPayment(amount);
    res.json(paymentData);
});

routes.post('/confirm-payment', async (req, res) => {
    const { paymentId, walletAddress, amount } = req.body;
    const isPaid = await checkPixPaymentStatus(paymentId);

    if (isPaid) {
        const etherAmount = convertToEther(amount);
        await sendEther(walletAddress, etherAmount);
        res.json({ status: 'success' });
    } else {
        res.json({ status: 'pending' });
    }
});

const createPixPayment = async (amount) => {
    // Implementação para criar uma cobrança Pix e retornar os dados do QR Code
    const response = await axios.post(`${ETHEREUM_API_URL}/create-pix-payment`, { amount });
    return response.data;
};

const checkPixPaymentStatus = async (paymentId) => {
    // Implementação para verificar o status do pagamento Pix
    const response = await axios.get(`${ETHEREUM_API_URL}/check-payment-status/${paymentId}`);
    return response.data.isPaid;
};

const convertToEther = (amount) => {
    // Converter o valor para Ethereum
    return ethers.utils.parseEther(amount.toString());
};

const sendEther = async (walletAddress, amount) => {
    // Atualizar para usar o Alchemy como provedor
    const provider = new ethers.providers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/aIBlgH6Ux2NDOmtuz-vQ4nGg-ELApfVf');
    const wallet = new ethers.Wallet('YOUR_PRIVATE_KEY', provider);

    const tx = {
        to: walletAddress,
        value: amount
    };

    const transaction = await wallet.sendTransaction(tx);
    await transaction.wait();
};



module.exports = routes;

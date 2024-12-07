const routes = require('express').Router();
const RegisterController = require('../Controller/RegisterController');
const LoginController = require('../Controller/LoginController');
const DocumentsController = require('../Controller/DocumentsController');
const TransactionController = require('../Controller/TransactionController');
const { findCryptoShops } = require('../Controller/FindLocations');
const CryptoService = require('../Controller/CryptosService');
const axios = require('axios'); 
const ethers = require('ethers');
const shortid = require('shortid');
const CurrencyConverter = require('currency-converter-lt');
const crypto = require('crypto');

routes.post('/register', RegisterController.DoRegisterInDb);
routes.post('/login', LoginController.DoLoginInDb);
routes.post('/validateDocuments', DocumentsController.GetDocumentsToValidate);
routes.post('/sendCoin', TransactionController.sendCrypto);
routes.post('/getBalance', TransactionController.getBalance);
routes.post('/findCryptoShops', findCryptoShops)
routes.post('/returnTransactions', TransactionController.returnAllTransactions);
routes.post('/returnAllBalances', TransactionController.returnAllBalances);
routes.get('/getCryptoData', CryptoService.getCryptoData);


const apiKey = '67538d5e36a5cd00013787e0';
const secret = 'c127d6d7-f48c-411a-9605-f741a0e9f09b';
const passphrase = 'GabrielOliveira'; // Se necessário
const url = 'https://api.kucoin.com/api/v1/orders';

routes.get('/payment-methods', async (req, res) => {
    try {
        const paymentMethods = await axios.get('https://api.kucoin.com/api/v1/fiat/accounts', {
            headers: {
                'KC-API-KEY': apiKey,
                'KC-API-TIMESTAMP': Date.now(),
                'KC-API-PASSPHRASE': passphrase,
                'KC-API-SIGN': crypto.createHmac('sha256', secret).update(Date.now() + 'GET' + '/api/v1/fiat/accounts').digest('base64'),
                'Content-Type': 'application/json'
            }
        });

        res.json({ success: true, paymentMethods: paymentMethods.data });
    } catch (error) {
        console.error('Erro ao obter métodos de pagamento:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

routes.post('/buy-ethereum', async (req, res) => {
    const { walletAddress, amount } = req.body;

    try {
        const ethPriceData = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
            params: { ids: 'ethereum', vs_currencies: 'usd' }
        });

        const ethPrice = ethPriceData.data.ethereum.usd;
        const totalPriceUSD = amount * ethPrice;

        // Converter USD para BRL
        const currencyConverter = new CurrencyConverter();
        const totalPriceBRL = await currencyConverter.from('USD').to('BRL').amount(totalPriceUSD).convert();

        const clientOrderId = shortid.generate();
        const body = {
            clientOid: clientOrderId,
            side: 'buy',
            type: 'market',
            symbol: 'ETH-USDT',
            size: amount,
        };

        const timestamp = Date.now();
        const strForSign = timestamp + 'POST' + '/api/v1/orders' + JSON.stringify(body);
        const signature = crypto.createHmac('sha256', secret).update(strForSign).digest('base64');

        const response = await axios.post(url, body, {
            headers: {
                'KC-API-KEY': apiKey,
                'KC-API-SIGN': signature,
                'KC-API-TIMESTAMP': timestamp,
                'KC-API-PASSPHRASE': passphrase,
                'Content-Type': 'application/json'
            },
        });

        console.log('Compra de Ethereum iniciada:', response.data);
        res.json({ success: true, data: response.data, totalPriceBRL });
    } catch (error) {
        console.error('Erro ao comprar Ethereum:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});



module.exports = routes;

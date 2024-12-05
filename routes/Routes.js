const routes = require('express').Router();
const RegisterController = require('../Controller/RegisterController');
const LoginController = require('../Controller/LoginController');
const DocumentsController = require('../Controller/DocumentsController');
const TransactionController = require('../Controller/TransactionController');
const { findCryptoShops } = require('../Controller/FindLocations');
const CryptoService = require('../Controller/CryptosService');
const axios = require('axios'); 
const ethers = require('ethers');
const QRCode = require('qrcode'); 
const shortid = require('shortid');
const CurrencyConverter = require('currency-converter-lt');
const { GeradorDePix } = require('node-pix');

routes.post('/register', RegisterController.DoRegisterInDb);
routes.post('/login', LoginController.DoLoginInDb);
routes.post('/validateDocuments', DocumentsController.GetDocumentsToValidate);
routes.post('/sendCoin', TransactionController.sendCrypto);
routes.post('/getBalance', TransactionController.getBalance);
routes.post('/findCryptoShops', findCryptoShops)
routes.post('/returnTransactions', TransactionController.returnAllTransactions);
routes.post('/returnAllBalances', TransactionController.returnAllBalances);
routes.get('/getCryptoData', CryptoService.getCryptoData);

let dataStore = {};

routes.post('/buy-ethereum', async (req, res) => {
    const { amount, walletAddress } = req.body;

    try {
        const ethPriceData = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
            params: {
                ids: 'ethereum',
                vs_currencies: 'usd'
            }
        });

        const ethPrice = ethPriceData.data.ethereum.usd;
        const totalPriceUSD = amount * ethPrice;

        // Converter USD para BRL
        const currencyConverter = new CurrencyConverter();
        const totalPriceBRL = await currencyConverter.from('USD').to('BRL').amount(totalPriceUSD).convert();

        const payloadId = shortid.generate();
        dataStore[payloadId] = { amount, walletAddress, totalPriceBRL };

        // Gerar o QR Code PIX
        const geradorDePix = new GeradorDePix({
            chave: '57212480843',
            valor: totalPriceBRL.toFixed(2),
            nome: 'Gabriel Oliveira',
            cidade: 'Taubaté',
            identificador: payloadId
        });

        const qrCode = await geradorDePix.base64();

        res.json({ qrCode, totalPrice: totalPriceBRL });
    } catch (error) {
        console.log('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

routes.get('/payload/:id', (req, res) => {
    const payloadId = req.params.id;
    const data = dataStore[payloadId];
    if (data) {
        res.json(data);
    } else {
        res.status(404).send('Not Found');
    }
});


module.exports = routes;

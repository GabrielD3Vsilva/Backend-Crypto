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
const Binance = require('binance-api-node').default;

routes.post('/register', RegisterController.DoRegisterInDb);
routes.post('/login', LoginController.DoLoginInDb);
routes.post('/validateDocuments', DocumentsController.GetDocumentsToValidate);
routes.post('/sendCoin', TransactionController.sendCrypto);
routes.post('/getBalance', TransactionController.getBalance);
routes.post('/findCryptoShops', findCryptoShops)
routes.post('/returnTransactions', TransactionController.returnAllTransactions);
routes.post('/returnAllBalances', TransactionController.returnAllBalances);
routes.get('/getCryptoData', CryptoService.getCryptoData);


const axios = require('axios');
const QRCode = require('qrcode');

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
        const totalPrice = amount * ethPrice;

        const pixPayload = `00020126580014BR.GOV.BCB.PIX0136${walletAddress}5204000053039865802BR5913Nome do Beneficiário6008Cidade62290525`;

        const qrCode = await QRCode.toDataURL(pixPayload);

        res.json({ qrCode, totalPrice });
    } catch (error) {
        console.log('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});



module.exports = routes;

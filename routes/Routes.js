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


const client = Binance({ 
    apiKey: 'HPMFQ0KqJHsUNMqMjaMCAERfPfX2MuED1CSAwcrAba8hSZBop4pBWWOmQqUsUni6', 
    apiSecret: 'vI6yYJIlLSg8lpoyvhR91QEJvYqIPZedQ4drOuaj2lCX4kpqdxtc7RJKsFrIu3y8', 
}); 
    
routes.post('/buy-ethereum', async (req, res) => { 
    const { amount, walletAddress } = req.body; 

    try { 
        const ethPriceData = await client.prices({ symbol: 'ETHUSDT' }); 
        const ethPrice = ethPriceData.ETHUSDT; 
        const totalPrice = amount * ethPrice;const pixPayload = `00020126580014BR.GOV.BCB.PIX0136${walletAddress}5204000053039865802BR5913Nome do Beneficiário6008Cidade62290525`; 
        
        const qrCode = await QRCode.toDataURL(pixPayload); 
        
        res.json({ qrCode, totalPrice }); 
} catch (error) { 
    res.status(500).json({ error: 'Erro ao processar a solicitação' }); 
} });

module.exports = routes;

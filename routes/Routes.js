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
const { Pix } = require('qrcode-pix');
 const qrcode = require('qrcode');

routes.post('/register', RegisterController.DoRegisterInDb);
routes.post('/login', LoginController.DoLoginInDb);
routes.post('/validateDocuments', DocumentsController.GetDocumentsToValidate);
routes.post('/sendCoin', TransactionController.sendCrypto);
routes.post('/getBalance', TransactionController.getBalance);
routes.post('/findCryptoShops', findCryptoShops)
routes.post('/returnTransactions', TransactionController.returnAllTransactions);
routes.post('/returnAllBalances', TransactionController.returnAllBalances);
routes.get('/getCryptoData', CryptoService.getCryptoData);

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

        // Gerar a cobrança usando a API do Coinbase
        const response = await axios.post('https://api.coinbase.com/api/v3/charges', {
            customer: {
                name: 'Nome do Recebedor',
                email: 'email@example.com',
                address: {
                    address1: 'Rua do Recebedor',
                    address2: '',
                    city: 'Cidade',
                    state: 'Estado',
                    postal_code: 'CEP',
                    country: 'BR',
                },
                phone: 'telefone',
            },
            amount: totalPriceBRL,
            currency: 'BRL',
            description: 'Compra de Ethereum',
            metadata: {
                walletAddress: walletAddress,
                amount: amount,
            },
        });

        const chargeId = response.data.charge_id;
        res.json({ chargeId, totalPrice: totalPriceBRL });
    } catch (error) {
        console.log('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});







module.exports = routes;

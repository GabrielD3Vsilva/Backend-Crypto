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

routes.post('/api/calcular-preco', async (req, res) => {
    const { walletAddress, ethAmount } = req.body;
  
    // Verificar se os parâmetros foram fornecidos
    if (!walletAddress || !ethAmount) {
      return res.status(400).send('Endereço da carteira e quantidade de Ethereum são necessários');
    }
  
    try {
      // Obter preço atual do Ethereum
      const priceResponse = await axios.get('https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT');
      const ethPrice = parseFloat(priceResponse.data.price);
  
      // Calcular o valor total
      const totalValue = ethPrice * parseFloat(ethAmount);
  
      // Obter métodos de pagamento disponíveis
      const paymentMethodsResponse = await axios.get('https://api.binance.com/api/v3/paymentMethods');
      const paymentMethods = paymentMethodsResponse.data;
  
      // Enviar resposta
      res.json({ totalValue, paymentMethods });
    } catch (error) {
      console.error('Erro ao calcular o preço:', error);
      res.status(500).send('Erro ao calcular o preço');
    }
});
  


module.exports = routes;

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
const AddBalanceToKuCoin = require('../Controller/AddBalanceToKuCoin')
const MercadoPagoService = require('../Controller/MercadoPagoService');

routes.post('/register', RegisterController.DoRegisterInDb);
routes.post('/login', LoginController.DoLoginInDb);
routes.post('/validateDocuments', DocumentsController.GetDocumentsToValidate);
routes.post('/sendCoin', TransactionController.sendCrypto);
routes.post('/getBalance', TransactionController.getBalance);
routes.post('/findCryptoShops', findCryptoShops)
routes.post('/returnTransactions', TransactionController.returnAllTransactions);
routes.post('/returnAllBalances', TransactionController.returnAllBalances);
routes.get('/getCryptoData', CryptoService.getCryptoData);
routes.post('/createACheckout', MercadoPagoService.createACheckoutToKucoinApi);


routes.post("/buy", async (req, res) => {
    const { amountInEth, ethAddress } = req.body;
  
    try {
      // Verificar saldo da conta em BRL
      const timestampBalance = Date.now().toString();
      const endpointBalance = "/api/v1/accounts";
      const methodBalance = "GET";
      const signatureBalance = createSignature(timestampBalance, methodBalance, endpointBalance, "");
  
      const headersBalance = {
        "KC-API-KEY": apiKey,
        "KC-API-SIGN": signatureBalance,
        "KC-API-TIMESTAMP": timestampBalance,
        "KC-API-PASSPHRASE": apiPassphrase,
        "Content-Type": "application/json"
      };
  
      const responseBalance = await axios.get(baseURL + endpointBalance, { headers: headersBalance });
      console.log("Saldo da Conta:", responseBalance.data);
  
      const brlBalance = responseBalance.data.data.find(account => account.currency === 'BRL');
      if (!brlBalance || parseFloat(brlBalance.available) < amountInEth * 1000) { // Assumindo 1 ETH ≈ 1000 BRL
        throw new Error("Saldo insuficiente em BRL para realizar a compra.");
      }
  
      // Converter BRL para USDT (considerando que BRL está listado como base ou fazemos um ajuste para a cotação correta)
      const timestampConvert = Date.now().toString();
      const endpointConvert = "/api/v1/orders";
      const methodConvert = "POST";
      const bodyConvert = JSON.stringify({
        clientOid: crypto.randomUUID(),
        side: "sell",
        type: "market",
        symbol: "BRL-USDT",
        funds: amountInEth * 1000  // Assumindo 1 ETH ≈ 1000 BRL
      });
  
      const signatureConvert = createSignature(timestampConvert, methodConvert, endpointConvert, bodyConvert);
      const headersConvert = {
        "KC-API-KEY": apiKey,
        "KC-API-SIGN": signatureConvert,
        "KC-API-TIMESTAMP": timestampConvert,
        "KC-API-PASSPHRASE": apiPassphrase,
        "Content-Type": "application/json"
      };
  
      const responseConvert = await axios.post(baseURL + endpointConvert, bodyConvert, { headers: headersConvert });
      console.log("Conversão de BRL para USDT:", responseConvert.data);
  
      const usdtAmount = responseConvert.data.data.filledSize || responseConvert.data.data.dealSize;
  
      if (!usdtAmount) {
        throw new Error("A resposta da API não contém o campo 'filledSize' ou 'dealSize' para a conversão de BRL para USDT.");
      }
  
      // Comprar Ethereum com USDT
      const timestampBuy = Date.now().toString();
      const endpointBuy = "/api/v1/orders";
      const methodBuy = "POST";
      const bodyBuy = JSON.stringify({
        clientOid: crypto.randomUUID(),
        side: "buy",
        type: "market",
        symbol: "ETH-USDT",
        size: amountInEth  // quantidade em ETH que queremos comprar
      });
  
      const signatureBuy = createSignature(timestampBuy, methodBuy, endpointBuy, bodyBuy);
      const headersBuy = {
        "KC-API-KEY": apiKey,
        "KC-API-SIGN": signatureBuy,
        "KC-API-TIMESTAMP": timestampBuy,
        "KC-API-PASSPHRASE": apiPassphrase,
        "Content-Type": "application/json"
      };
  
      const responseBuy = await axios.post(baseURL + endpointBuy, bodyBuy, { headers: headersBuy });
      console.log("Resposta da Compra:", responseBuy.data);
  
      if (responseBuy.data && responseBuy.data.data) {
        const ethAmount = responseBuy.data.data.size || responseBuy.data.data.filledSize || responseBuy.data.data.dealSize;
  
        if (!ethAmount) {
          throw new Error("A resposta da API não contém o campo 'size', 'filledSize' ou 'dealSize'.");
        }
  
        // Retirar Ethereum para o endereço especificado
        const timestampWithdraw = Date.now().toString();
        const endpointWithdraw = "/api/v1/withdrawals";
        const methodWithdraw = "POST";
        const bodyWithdraw = JSON.stringify({
          currency: "ETH",
          address: ethAddress,
          amount: ethAmount,
          memo: "",  // Se necessário
          isInner: false  // Definir como true se for uma transferência interna na KuCoin
        });
  
        const signatureWithdraw = createSignature(timestampWithdraw, methodWithdraw, endpointWithdraw, bodyWithdraw);
        const headersWithdraw = {
          "KC-API-KEY": apiKey,
          "KC-API-SIGN": signatureWithdraw,
          "KC-API-TIMESTAMP": timestampWithdraw,
          "KC-API-PASSPHRASE": apiPassphrase,
          "Content-Type": "application/json"
        };
  
        const responseWithdraw = await axios.post(baseURL + endpointWithdraw, bodyWithdraw, { headers: headersWithdraw });
        console.log("Resposta da Retirada:", responseWithdraw.data);
  
        res.status(200).send(`Ethereum comprado e enviado com sucesso: ${responseWithdraw.data.data.withdrawalId}`);
      } else {
        throw new Error("A resposta da API não contém dados esperados.");
      }
    } catch (error) {
      console.error("Erro:", error);
      res.status(500).send(`Erro ao comprar ou enviar Ethereum: ${error.message}`);
    }
});


routes.post('/notifications', async (req, res) => {
    const payment = req.body;
  
    if (payment.type === 'payment' && payment.data.status === 'approved') {
      // Processar pagamento aprovado
      const payment_id = payment.data.id;
      const metadata = payment.data.metadata;
  
      // Chamar função para adicionar saldo na KuCoin
      await AddBalanceToKuCoin.addBalanceToKuCoin(payment_id, payment.data.transaction_amount, metadata);

    }
  
    res.sendStatus(200);
});




module.exports = routes;

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
const Db = require('../db/Db');
const LZString = require('lz-string');

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


routes.post('/changeAuth', async (req, res) => {
    const { name, email, password, cpf, _id } = req.body;

    const user = await Db.User.findOneAndUpdate(
        { _id: _id },
        { 
            name: name,
            email: email,
            cpf: cpf,
            password: password
        },
        { 
            new: true, // Retorna o documento atualizado// 
        }
    );
    

    res.send(user);

})

routes.post('/addImage', async ( req, res ) => {
    const { image, _id } = req.body;
    try {

        const decompressedBase64 = LZString.decompressFromBase64(image);
        
        const user = await Db.User.findOneAndUpdate(
            { _id: _id },
            { image: decompressedBase64 },
            { new: true}
        );


        console.log(user);

        res.send('ok');
        
    } catch (err) {
        console.log(err);
    }
    
})


routes.post('/changeLanguage', async (req, res) => {
    const { _id , language} = req.body;
    
    const user = await Db.User.findOneAndUpdate(
        { _id: _id },
        { language: language },
        { new: true }
    )


    return res.send(user);

})

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

routes.post("/buy-pol", async (req, res) => {
  const { amountInMatic, maticAddress } = req.body;

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
      if (!brlBalance || parseFloat(brlBalance.available) < amountInMatic * 10) { // Assumindo 1 MATIC ≈ 10 BRL
          throw new Error("Saldo insuficiente em BRL para realizar a compra.");
      }

      // Converter BRL para USDT
      const timestampConvert = Date.now().toString();
      const endpointConvert = "/api/v1/orders";
      const methodConvert = "POST";
      const bodyConvert = JSON.stringify({
          clientOid: crypto.randomUUID(),
          side: "sell",
          type: "market",
          symbol: "BRL-USDT",
          funds: amountInMatic * 10  // Assumindo 1 MATIC ≈ 10 BRL
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

      // Comprar Polygon (MATIC) com USDT
      const timestampBuy = Date.now().toString();
      const endpointBuy = "/api/v1/orders";
      const methodBuy = "POST";
      const bodyBuy = JSON.stringify({
          clientOid: crypto.randomUUID(),
          side: "buy",
          type: "market",
          symbol: "MATIC-USDT",
          size: amountInMatic  // quantidade em MATIC que queremos comprar
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
          const maticAmount = responseBuy.data.data.size || responseBuy.data.data.filledSize || responseBuy.data.data.dealSize;

          if (!maticAmount) {
              throw new Error("A resposta da API não contém o campo 'size', 'filledSize' ou 'dealSize'.");
          }

          // Retirar Polygon para o endereço especificado
          const timestampWithdraw = Date.now().toString();
          const endpointWithdraw = "/api/v1/withdrawals";
          const methodWithdraw = "POST";
          const bodyWithdraw = JSON.stringify({
              currency: "MATIC",
              address: maticAddress,
              amount: maticAmount,
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

          res.status(200).send(`Polygon comprado e enviado com sucesso: ${responseWithdraw.data.data.withdrawalId}`);
      } else {
          throw new Error("A resposta da API não contém dados esperados.");
      }
  } catch (error) {
      console.error("Erro:", error);
      res.status(500).send(`Erro ao comprar ou enviar Polygon: ${error.message}`);
  }
});


routes.post("/buy-btc", async (req, res) => {
  const { amountInBtc, btcAddress } = req.body;

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
      if (!brlBalance || parseFloat(brlBalance.available) < amountInBtc * 200000) { // Assumindo 1 BTC ≈ 200,000 BRL
          throw new Error("Saldo insuficiente em BRL para realizar a compra.");
      }

      // Converter BRL para USDT
      const timestampConvert = Date.now().toString();
      const endpointConvert = "/api/v1/orders";
      const methodConvert = "POST";
      const bodyConvert = JSON.stringify({
          clientOid: crypto.randomUUID(),
          side: "sell",
          type: "market",
          symbol: "BRL-USDT",
          funds: amountInBtc * 200000  // Assumindo 1 BTC ≈ 200,000 BRL
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

      // Comprar Bitcoin (BTC) com USDT
      const timestampBuy = Date.now().toString();
      const endpointBuy = "/api/v1/orders";
      const methodBuy = "POST";
      const bodyBuy = JSON.stringify({
          clientOid: crypto.randomUUID(),
          side: "buy",
          type: "market",
          symbol: "BTC-USDT",
          size: amountInBtc  // quantidade em BTC que queremos comprar
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
          const btcAmount = responseBuy.data.data.size || responseBuy.data.data.filledSize || responseBuy.data.data.dealSize;

          if (!btcAmount) {
              throw new Error("A resposta da API não contém o campo 'size', 'filledSize' ou 'dealSize'.");
          }

          // Retirar Bitcoin para o endereço especificado
          const timestampWithdraw = Date.now().toString();
          const endpointWithdraw = "/api/v1/withdrawals";
          const methodWithdraw = "POST";
          const bodyWithdraw = JSON.stringify({
              currency: "BTC",
              address: btcAddress,
              amount: btcAmount,
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

          res.status(200).send(`Bitcoin comprado e enviado com sucesso: ${responseWithdraw.data.data.withdrawalId}`);
      } else {
          throw new Error("A resposta da API não contém dados esperados.");
      }
  } catch (error) {
      console.error("Erro:", error);
      res.status(500).send(`Erro ao comprar ou enviar Bitcoin: ${error.message}`);
  }
});


routes.post("/buy-solana", async (req, res) => {
  const { amountInSol, solAddress } = req.body;

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
      if (!brlBalance || parseFloat(brlBalance.available) < amountInSol * 100) { // Assumindo 1 SOL ≈ 100 BRL
          throw new Error("Saldo insuficiente em BRL para realizar a compra.");
      }

      // Converter BRL para USDT
      const timestampConvert = Date.now().toString();
      const endpointConvert = "/api/v1/orders";
      const methodConvert = "POST";
      const bodyConvert = JSON.stringify({
          clientOid: crypto.randomUUID(),
          side: "sell",
          type: "market",
          symbol: "BRL-USDT",
          funds: amountInSol * 100  // Assumindo 1 SOL ≈ 100 BRL
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

      // Comprar Solana com USDT
      const timestampBuy = Date.now().toString();
      const endpointBuy = "/api/v1/orders";
      const methodBuy = "POST";
      const bodyBuy = JSON.stringify({
          clientOid: crypto.randomUUID(),
          side: "buy",
          type: "market",
          symbol: "SOL-USDT",
          size: amountInSol  // quantidade em SOL que queremos comprar
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
          const solAmount = responseBuy.data.data.size || responseBuy.data.data.filledSize || responseBuy.data.data.dealSize;

          if (!solAmount) {
              throw new Error("A resposta da API não contém o campo 'size', 'filledSize' ou 'dealSize'.");
          }

          // Retirar Solana para o endereço especificado
          const timestampWithdraw = Date.now().toString();
          const endpointWithdraw = "/api/v1/withdrawals";
          const methodWithdraw = "POST";
          const bodyWithdraw = JSON.stringify({
              currency: "SOL",
              address: solAddress,
              amount: solAmount,
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

          res.status(200).send(`Solana comprada e enviada com sucesso: ${responseWithdraw.data.data.withdrawalId}`);
      } else {
          throw new Error("A resposta da API não contém dados esperados.");
      }
  } catch (error) {
      console.error("Erro:", error);
      res.status(500).send(`Erro ao comprar ou enviar Solana: ${error.message}`);
  }
});


routes.post("/buy-doge", async (req, res) => {
  const { amountInDoge, dogeAddress } = req.body;

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
      if (!brlBalance || parseFloat(brlBalance.available) < amountInDoge * 0.25) { // Assumindo 1 DOGE ≈ 0.25 BRL
          throw new Error("Saldo insuficiente em BRL para realizar a compra.");
      }

      // Converter BRL para USDT
      const timestampConvert = Date.now().toString();
      const endpointConvert = "/api/v1/orders";
      const methodConvert = "POST";
      const bodyConvert = JSON.stringify({
          clientOid: crypto.randomUUID(),
          side: "sell",
          type: "market",
          symbol: "BRL-USDT",
          funds: amountInDoge * 0.25  // Assumindo 1 DOGE ≈ 0.25 BRL
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

      // Comprar Dogecoin (DOGE) com USDT
      const timestampBuy = Date.now().toString();
      const endpointBuy = "/api/v1/orders";
      const methodBuy = "POST";
      const bodyBuy = JSON.stringify({
          clientOid: crypto.randomUUID(),
          side: "buy",
          type: "market",
          symbol: "DOGE-USDT",
          size: amountInDoge  // quantidade em DOGE que queremos comprar
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
          const dogeAmount = responseBuy.data.data.size || responseBuy.data.data.filledSize || responseBuy.data.data.dealSize;

          if (!dogeAmount) {
              throw new Error("A resposta da API não contém o campo 'size', 'filledSize' ou 'dealSize'.");
          }

          // Retirar Dogecoin para o endereço especificado
          const timestampWithdraw = Date.now().toString();
          const endpointWithdraw = "/api/v1/withdrawals";
          const methodWithdraw = "POST";
          const bodyWithdraw = JSON.stringify({
              currency: "DOGE",
              address: dogeAddress,
              amount: dogeAmount,
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

          res.status(200).send(`Dogecoin comprado e enviado com sucesso: ${responseWithdraw.data.data.withdrawalId}`);
      } else {
          throw new Error("A resposta da API não contém dados esperados.");
      }
  } catch (error) {
      console.error("Erro:", error);
      res.status(500).send(`Erro ao comprar ou enviar Dogecoin: ${error.message}`);
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

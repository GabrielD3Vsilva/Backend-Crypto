const crypto = require("crypto");
const axios = require("axios");

// Configurações da API da KuCoin
const apiKey = "6753a8c936a5cd0001378826";
const apiSecret = "437ce85d-3a5a-42b0-92ab-9438e1d219e1";
const apiPassphrase = "1981abcd.";
const baseURL = "https://api.kucoin.com";

// Função para criar assinatura da API
function createSignature(timestamp, method, endpoint, body) {
  const strToSign = timestamp + method + endpoint + body;
  return crypto.createHmac('sha256', apiSecret).update(strToSign).digest('base64');
}

async function addBalanceToKuCoin(payment_id, amount, metadata) {
  try {
    const timestamp = Date.now().toString();
    const endpoint = "/api/v1/deposits";
    const method = "POST";
    const body = JSON.stringify({
      currency: "BRL",
      amount: amount,
      paymentId: payment_id // Adicionando referência ao pagamento recebido
    });

    const signature = createSignature(timestamp, method, endpoint, body);
    const headers = {
      "KC-API-KEY": apiKey,
      "KC-API-SIGN": signature,
      "KC-API-TIMESTAMP": timestamp,
      "KC-API-PASSPHRASE": apiPassphrase,
      "Content-Type": "application/json"
    };

    const response = await axios.post(baseURL + endpoint, body, { headers });
    console.log("Saldo adicionado na KuCoin:", response.data);


    if(metadata.currency == 'eth') {
      await axios.post('https://backend-crypto-1znq.onrender.com/buy', JSON.stringify({amountInEth: metadata.amountInEth, ethAddress: metadata.ethAddress}) ,
      {
        headers: {"Content-Type": "application/json"}
      })
    }

    if (metadata.currency == 'btc') {
      await axios.post('https://backend-crypto-1znq.onrender.com/buy-btc', JSON.stringify({amountInBtc: metadata.amountInEth, btcAddress: metadata.ethAddress}) ,
      {
        headers: {"Content-Type": "application/json"}
      })
    }

    if (metadata.currency == 'sol') {
      await axios.post('https://backend-crypto-1znq.onrender.com/buy-solana', JSON.stringify({amountInSol: metadata.amountInEth, solAddress: metadata.ethAddress}) ,
      {
        headers: {"Content-Type": "application/json"}
      })
    }

    if (metadata.currency == 'pol') {
      await axios.post('https://backend-crypto-1znq.onrender.com/buy-pol', JSON.stringify({amountInMatic: metadata.amountInEth, maticAddress: metadata.ethAddress}) ,
      {
        headers: {"Content-Type": "application/json"}
      })
    }

    if (metadata.currency == 'doge') {
      await axios.post('https://backend-crypto-1znq.onrender.com/buy-pol', JSON.stringify({amountInDoge: metadata.amountInEth, dogeAddress: metadata.ethAddress}),
      {
        headers: {"Content-Type": "application/json"}
      })
    }


    
  } catch (error) {
    console.error("Erro ao adicionar saldo na KuCoin:", error.message);

    res.send(error);
  }
}

module.exports = {addBalanceToKuCoin}


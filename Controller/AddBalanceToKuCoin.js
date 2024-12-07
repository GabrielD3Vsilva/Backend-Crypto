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

async function addBalanceToKuCoin(payment_id, amount) {
  try {
    const timestamp = Date.now().toString();
    const endpoint = "/api/v1/deposits";
    const method = "POST";
    const body = JSON.stringify({
      currency: "USDT",
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
  } catch (error) {
    console.error("Erro ao adicionar saldo na KuCoin:", error.message);
  }
}

module.exports = {addBalanceToKuCoin}


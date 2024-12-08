const { MercadoPagoConfig, Preference } = require('mercadopago');
const addBalanceToKuCoin = require('./AddBalanceToKuCoin');

const axios = require('axios');

async function getEthPrice() {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=BRL');
    return response.data.ethereum.brl;
}

async function createACheckoutToKucoinApi(req, res) {
    const client = new MercadoPagoConfig({ accessToken: 'TEST-8001012963880387-060323-cdb26a9b2c52877f4a0ae4bc256d8912-1840600103' });

    const { amountInEth, ethAddress, currency } = req.body; // Receber dados do frontend

    const ethPrice = await getEthPrice(); // Consultar o valor atual do ETH
    const finalPrice = ethPrice * amountInEth; // Multiplicar pelo amountInEth

    const preference = new Preference(client);

    const body = {
        items: [
            {
                id: '1234',
                title: 'Compra de ethereum',
                quantity: 1,
                currency_id: 'BRL',
                unit_price: finalPrice, // Usar o preço final calculado
            },
        ],
        notification_url: 'https://seu-backend.com/notifications', // URL do seu webhook
        metadata: { // Adicionar informações adicionais
            amountInEth: amountInEth,
            ethAddress: ethAddress,
            currency: currency
        }
    };

    await preference.create({ body }).then((response) => {
        return res.send(response);
    });
}



  
module.exports = {createACheckoutToKucoinApi}
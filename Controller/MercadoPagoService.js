const { MercadoPagoConfig, Preference } = require('mercadopago');
const addBalanceToKuCoin = require('./AddBalanceToKuCoin');

async function createACheckoutToKucoinApi (req, res) {
    const client = new MercadoPagoConfig({ accessToken: 'TEST-8001012963880387-060323-cdb26a9b2c52877f4a0ae4bc256d8912-1840600103'});
    
    const preference = new Preference(client);
    
    const body = {
        items: [
            {
            id: '1234',
            title: 'Compra de ethereum',
            quantity: 1,
            currency_id: 'BRL',
            unit_price: 90,
            },
        ]
    };


    await preference.create({body}).then((response)=> {
        return res.send(response.init_point);
    });

    
}

  
module.exports = {createACheckoutToKucoinApi}
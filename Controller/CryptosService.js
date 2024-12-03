const axios = require('axios');

const getCryptoData = async (req, res) => {
    const url = 'https://api.coingecko.com/api/v3/coins/markets'; // URL da API CoinGecko
    const params = {
        vs_currency: 'brl', // Moeda desejada
        ids: 'polygon, solana, bitcoin, dogecoin, ethereum', // IDs das criptomoedas
    };

    try {
        const response = await axios.get(url, { params });
        const data = response.data;
        return res.send(data);
    } catch (error) {
        console.error('Erro ao buscar dados das criptomoedas:', error);
    }
};

module.exports = {getCryptoData}

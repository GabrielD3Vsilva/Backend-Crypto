const axios = require('axios');

async function findCryptoShops ( req, res ) {
    const { lat, lon } = req.body;
    const radius = 100;

    try {
        const response = await axios.get('https://coinmap.org/api/v1/venues/');
        const stores = response.data.venues;
        const nearbyStores = stores.filter(store => {
            const distance = getDistance(lat, lon, store.lat, store.lon);
            return distance <= radius;
        });
        console.log(`Stores that accept cryptocurrencies within ${radius} km:`, nearbyStores);

        res.send(nearbyStores);
    } catch (error) {
        console.error('Error fetching stores:', error);
    }
}


function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distância em km
    return distance;
}

module.exports = {findCryptoShops}
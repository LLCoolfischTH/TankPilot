const axios = require('axios');

const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCacheKey(lat, lng, radius, type) {
  return `${lat.toFixed(2)}_${lng.toFixed(2)}_${radius}_${type}`;
}

async function getStations({ lat, lng, radius, type }) {
  const key = getCacheKey(lat, lng, radius, type);
  const cached = cache.get(key);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log(`[Cache] Treffer für ${key}`);
    return cached.data;
  }

  const url = 'https://creativecommons.tankerkoenig.de/json/list.php';
  const params = {
    lat,
    lng,
    rad:    radius,
    sort:   'price',
    type,
    apikey: process.env.TANKERKOENING_API_KEY || '00000000-0000-0000-0000-000000000002',
  };

  const response = await axios.get(url, { params, timeout: 12000 });

  if (!response.data.ok) {
    throw new Error(`Tankerkönig API Fehler: ${response.data.message}`);
  }

  const stations = (response.data.stations || [])
    .filter(s => s.price !== null && s.price > 0)  // ← FIX: Stationen ohne Preis entfernen
    .map((s) => ({
      id:     s.id,
      name:   s.name,
      brand:  s.brand,
      street: s.street,
      place:  s.place,
      lat:    s.lat,
      lng:    s.lng,
      dist:   s.dist,
      price:  s.price,
      isOpen: s.isOpen,
    }));

  cache.set(key, { data: stations, timestamp: Date.now() });
  return stations;
}

module.exports = { getStations };

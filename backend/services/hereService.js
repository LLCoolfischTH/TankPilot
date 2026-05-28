const axios = require('axios');
const currencyService = require('./currencyService');

/**
 * TankPilot – HERE Fuel Prices API (v2)
 *
 * Korrekter Endpunkt: https://fuel-v2.cc.api.here.com/fuel/stations.json
 * Doku:              https://developer.here.com/documentation/fuel-prices/
 * Key registrieren:  https://developer.here.com → Projekt → API Key
 * Freemium:          250.000 Anfragen/Monat kostenlos
 *
 * WICHTIG: Den Key unter developer.here.com (nicht platform.here.com) anlegen.
 * Bei platform.here.com muss Fuel Prices extra freigeschaltet werden.
 *
 * Kraftstoff-Typ-IDs:
 *   1 = Diesel   2 = Super/Unleaded (95)   3 = Super Plus (98)   4 = LPG
 *
 * Antwort-Struktur (JSON):
 * {
 *   "results": {
 *     "items": [{
 *       "id": "...", "name": "Shell", "brand": "Shell",
 *       "position": { "lat": 52.3, "lng": 14.5 },
 *       "address": { "city": "...", "street": "...", "postalCode": "..." },
 *       "fuelPrices": [{ "fuelType": "1", "price": 1.55, "currency": "PLN" }],
 *       "distance": 1200,
 *       "open24x7": true
 *     }]
 *   }
 * }
 */

const CACHE    = new Map();
const TTL_MS   = 5 * 60 * 1000;
const BASE_URL = 'https://fuel-v2.cc.api.here.com/fuel/stations.json';

const FUEL_TYPE_MAP = {
  e5:     '2',
  e10:    '2',
  diesel: '1',
  lpg:    '4',
};

const NON_EURO = new Set(['PL', 'CZ', 'DK', 'CH', 'HU', 'SE', 'NO']);

const COUNTRY_CURRENCY = {
  PL: 'PLN', CZ: 'CZK', DK: 'DKK', CH: 'CHF', HU: 'HUF', SE: 'SEK', NO: 'NOK',
};

function cacheKey(lat, lng, radius, type, country) {
  return `here_${lat.toFixed(2)}_${lng.toFixed(2)}_${radius}_${type}_${country}`;
}

async function getStations({ lat, lng, radius = 15, type = 'e5', country = '' }) {
  const apiKey = process.env.HERE_API_KEY;
  if (!apiKey || apiKey === 'dein_here_api_key_hier') {
    throw new Error(
      'HERE_API_KEY fehlt. Key kostenlos unter https://developer.here.com registrieren.'
    );
  }

  const key    = cacheKey(lat, lng, radius, type, country);
  const cached = CACHE.get(key);
  if (cached && Date.now() - cached.timestamp < TTL_MS) {
    console.log(`[HERE Cache] ${key}`);
    return cached.data;
  }

  const fuelTypeId   = FUEL_TYPE_MAP[type] || '2';
  const radiusMeters = radius * 1000;

  const response = await axios.get(BASE_URL, {
    params: { prox: `${lat},${lng},${radiusMeters}`, fueltype: fuelTypeId, apiKey },
    headers: { Accept: 'application/json' },
    timeout: 8000,
  });

  // Währungsrate für Nicht-Euro-Länder
  let eurRate = 1;
  const currency = COUNTRY_CURRENCY[country];
  if (NON_EURO.has(country) && currency) {
    eurRate = await currencyService.getEurRate(currency);
  }

  // Response-Struktur: response.data.results.items[]
  const items = response.data?.results?.items || [];

  const stations = items
    .filter(s => Array.isArray(s.fuelPrices) && s.fuelPrices.length > 0)
    .map(s => {
      const priceObj  = s.fuelPrices.find(p => String(p.fuelType) === fuelTypeId)
                     || s.fuelPrices[0];
      const rawPrice  = priceObj?.price ?? null;
      const priceCurr = priceObj?.currency || (NON_EURO.has(country) ? currency : 'EUR');
      const priceEur  = rawPrice !== null
        ? Math.round((rawPrice / eurRate) * 1000) / 1000
        : null;

      return {
        id:          `here-${s.id}`,
        name:        s.name    || s.brand || 'Unbekannt',
        brand:       s.brand   || '',
        street:      s.address?.street     ? `${s.address.street} ${s.address.houseNumber || ''}`.trim() : '',
        place:       s.address?.city       || '',
        lat:         s.position?.lat,
        lng:         s.position?.lng,
        dist:        s.distance ? s.distance / 1000 : null,
        price:       priceEur,
        currency:    priceCurr,
        priceLocal:  rawPrice,
        isOpen:      s.open24x7 ?? true,
        country,
      };
    })
    .filter(s => s.price !== null && s.lat && s.lng);

  CACHE.set(key, { data: stations, timestamp: Date.now() });
  return stations;
}

module.exports = { getStations, COUNTRY_CURRENCY };

const axios = require('axios');

/**
 * TankPilot – France Service
 * Offizielle API des französischen Wirtschaftsministeriums
 *
 * Kein API-Key nötig! Open Data, Ministerialerlass Dez. 2006.
 * Aktualisierung: alle 10 Minuten (Echtzeit wie Tankerkönig)
 * Docs: https://data.economie.gouv.fr/explore/dataset/
 *       prix-des-carburants-en-france-flux-instantane-v2/
 *
 * Kraftstoff-Mapping:
 *   e5     → sp95_prix  (Super Sans Plomb 95)
 *   e10    → e10_prix   (SP95-E10)
 *   diesel → gazole_prix
 */

const CACHE   = new Map();
const TTL_MS  = 5 * 60 * 1000;

const BASE_URL = 'https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/' +
                 'prix-des-carburants-en-france-flux-instantane-v2/records/';

const FUEL_FIELD = {
  e5:     'sp95_prix',
  e10:    'e10_prix',
  diesel: 'gazole_prix',
};

function cacheKey(lat, lng, radius, type) {
  return `fr_${lat.toFixed(2)}_${lng.toFixed(2)}_${radius}_${type}`;
}

async function getStations({ lat, lng, radius = 15, type = 'e5' }) {
  const key    = cacheKey(lat, lng, radius, type);
  const cached = CACHE.get(key);
  if (cached && Date.now() - cached.timestamp < TTL_MS) {
    console.log(`[France Cache] ${key}`);
    return cached.data;
  }

  const priceField = FUEL_FIELD[type] || 'sp95_prix';

  // Geo-Filter: Stationen im Umkreis mit vorhandenem Preis
  const where = [
    `distance(geom, geom'POINT(${lng} ${lat})', ${radius}km)`,
    `${priceField} is not null`,
  ].join(' AND ');

  const response = await axios.get(BASE_URL, {
    params: {
      where,
      limit:    50,
      order_by: priceField,  // günstigste zuerst
    },
    timeout: 8000,
  });

  const records = response.data?.results || [];

  const stations = records
    .filter(r => r[priceField] && r.geom?.lon && r.geom?.lat)
    .map(r => ({
      id:      `fr-${r.id}`,
      name:    r.nom || r.enseignes || 'Tankstelle',
      brand:   r.enseignes || '',
      street:  r.adresse || '',
      place:   `${r.cp || ''} ${r.ville || ''}`.trim(),
      lat:     r.geom.lat,
      lng:     r.geom.lon,
      dist:    null,
      price:   parseFloat(r[priceField]),
      isOpen:  r.horaires_automate_24_24 === '1' ? true : true, // Öffnungszeiten komplex – default open
      country: 'FR',
    }))
    .filter(s => !isNaN(s.price));

  CACHE.set(key, { data: stations, timestamp: Date.now() });
  return stations;
}

module.exports = { getStations };

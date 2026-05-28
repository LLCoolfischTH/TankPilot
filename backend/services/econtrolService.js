const axios = require('axios');

/**
 * TankPilot – E-Control Service (Österreich)
 * Offizielle API des österreichischen Energieregulators
 *
 * Kein API-Key nötig!
 * Docs: https://api.e-control.at/sprit/1.0/doc
 *
 * Einschränkung: Preise nur für die 5 nächsten Tankstellen
 * (bewusste Maßnahme der E-Control gegen Preisausspähung)
 */

const CACHE = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

// Kraftstoff-Mapping TankPilot → E-Control
const FUEL_TYPE_MAP = {
  e5:     'SUP',
  e10:    'SUP',   // E-Control unterscheidet kein E10
  diesel: 'DIE',
  gas:    'GAS',
};

function getCacheKey(lat, lng, type) {
  return `econtrol_${lat.toFixed(2)}_${lng.toFixed(2)}_${type}`;
}

/**
 * Gibt Tankstellen im Umkreis zurück (AT).
 * Gibt nur Tankstellen MIT Preis zurück (max. 5 laut E-Control Policy).
 */
async function getStations({ lat, lng, type = 'e5', includeClosed = false }) {
  const key = getCacheKey(lat, lng, type);
  const cached = CACHE.get(key);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log(`[E-Control Cache] Treffer für ${key}`);
    return cached.data;
  }

  const fuelType = FUEL_TYPE_MAP[type] || 'SUP';

  const response = await axios.get(
    'https://api.e-control.at/sprit/1.0/search/gas-stations/by-address',
    {
      params: { latitude: lat, longitude: lng, fuelType, includeClosed },
      headers: { 'Accept': 'application/json' },
      timeout: 8000,
    }
  );

  // Normalisieren auf TankPilot-Format (wie Tankerkönig-Output)
  const stations = (response.data || [])
    .filter(s => s.prices && s.prices.length > 0)
    .map(s => {
      const priceObj = s.prices.find(p => p.fuelType === fuelType) || s.prices[0];
      return {
        id:     `at-${s.id}`,
        name:   s.name,
        brand:  s.name,
        street: s.location?.address || '',
        place:  `${s.location?.postalCode || ''} ${s.location?.city || ''}`.trim(),
        lat:    s.location?.latitude,
        lng:    s.location?.longitude,
        dist:   null, // E-Control liefert keine Distanz
        price:  priceObj?.amount ?? null,
        isOpen: s.open ?? true,
        country: 'AT',
      };
    })
    .filter(s => s.price !== null && s.lat && s.lng);

  CACHE.set(key, { data: stations, timestamp: Date.now() });
  return stations;
}

module.exports = { getStations };

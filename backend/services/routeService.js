const axios = require('axios');

const CACHE   = new Map();
const TTL_MS  = 60 * 60 * 1000;

// Parallel-Limiter: max. gleichzeitige ORS-Anfragen
const MAX_CONCURRENT = 3;
let   activeRequests = 0;
const queue          = [];

function roundCoord(c) { return Math.round(c * 1000) / 1000; }
function cacheKey(from, to) {
  return `${roundCoord(from.lat)},${roundCoord(from.lng)}->${roundCoord(to.lat)},${roundCoord(to.lng)}`;
}

// Gibt einen Slot frei und startet den nächsten wartenden Call
function releaseSlot() {
  activeRequests--;
  if (queue.length > 0) {
    const next = queue.shift();
    next();
  }
}

// Wartet auf einen freien Slot, dann führt fn() aus
function withSlot(fn) {
  return new Promise((resolve, reject) => {
    const run = () => {
      activeRequests++;
      fn().then(resolve).catch(reject).finally(releaseSlot);
    };
    if (activeRequests < MAX_CONCURRENT) {
      run();
    } else {
      queue.push(run);
    }
  });
}

async function getDistance(from, to) {
  const key    = cacheKey(from, to);
  const cached = CACHE.get(key);
  if (cached && Date.now() - cached.timestamp < TTL_MS) {
    return { km: cached.km, method: cached.method };
  }

  const apiKey = process.env.ORS_API_KEY;
  if (apiKey && apiKey !== 'dein_ors_api_key_hier') {
    try {
      const resp = await withSlot(() =>
        axios.get('https://api.openrouteservice.org/v2/directions/driving-car', {
          params: {
            api_key: apiKey,
            start:   `${from.lng},${from.lat}`,
            end:     `${to.lng},${to.lat}`,
          },
          timeout: 8000,
        })
      );

      const meters = resp.data.features[0].properties.segments[0].distance;
      const km     = Math.round((meters / 1000) * 10) / 10;
      CACHE.set(key, { km, method: 'navigation', timestamp: Date.now() });
      return { km, method: 'navigation' };

    } catch (err) {
      console.warn('[ORS]', err.response?.status === 429
        ? '429 Rate Limit – Haversine-Fallback'
        : err.message);
    }
  }

  const km = Math.round(haversineDistance(from, to) * 1.3 * 10) / 10;
  CACHE.set(key, { km, method: 'estimate', timestamp: Date.now() });
  return { km, method: 'estimate' };
}

function haversineDistance(from, to) {
  const R    = 6371;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a    = Math.sin(dLat / 2) ** 2
             + Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) { return (deg * Math.PI) / 180; }

module.exports = { getDistance, haversineDistance };

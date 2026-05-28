const axios = require('axios');

/**
 * TankPilot – RouteService
 *
 * Strategie gegen ORS 429 (Rate Limit: 40 Req/min Free Tier):
 *   1. Aggressives Caching (koordinatenbasiert, 1h TTL)
 *   2. Eingebauter Throttler: max. 1 ORS-Request alle 1.6s (≈37/min)
 *   3. Automatischer Retry mit Backoff bei 429
 *   4. Fallback: Haversine × 1.3 wenn ORS fehlschlägt
 */

// ── Cache ──────────────────────────────────────────────────────────────────────
const CACHE   = new Map();
const TTL_MS  = 60 * 60 * 1000; // 1 Stunde – Straßendistanzen ändern sich kaum

// Koordinaten auf ~100m runden für Cache-Treffer
function roundCoord(c) { return Math.round(c * 1000) / 1000; }
function cacheKey(from, to) {
  return `${roundCoord(from.lat)},${roundCoord(from.lng)}->${roundCoord(to.lat)},${roundCoord(to.lng)}`;
}

// ── Throttler ─────────────────────────────────────────────────────────────────
let lastOrsCall = 0;
const ORS_MIN_INTERVAL_MS = 1600; // 1 Request alle 1.6s = ~37/min (unter Limit von 40)

async function waitForOrsSlot() {
  const now  = Date.now();
  const wait = Math.max(0, lastOrsCall + ORS_MIN_INTERVAL_MS - now);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastOrsCall = Date.now();
}

// ── Hauptfunktion ─────────────────────────────────────────────────────────────
async function getDistance(from, to) {
  const key    = cacheKey(from, to);
  const cached = CACHE.get(key);
  if (cached && Date.now() - cached.timestamp < TTL_MS) {
    return { km: cached.km, method: cached.method };
  }

  const apiKey = process.env.ORS_API_KEY;
  if (apiKey && apiKey !== 'dein_ors_api_key_hier') {
    try {
      await waitForOrsSlot();

      const resp = await axios.get(
        'https://api.openrouteservice.org/v2/directions/driving-car', {
          params: {
            api_key: apiKey,
            start:   `${from.lng},${from.lat}`,
            end:     `${to.lng},${to.lat}`,
          },
          timeout: 6000,
        }
      );

      const meters = resp.data.features[0].properties.segments[0].distance;
      const km     = Math.round((meters / 1000) * 10) / 10;
      CACHE.set(key, { km, method: 'navigation', timestamp: Date.now() });
      return { km, method: 'navigation' };

    } catch (err) {
      if (err.response?.status === 429) {
        console.warn('[ORS] 429 Rate Limit – nutze Haversine-Fallback für diese Station');
      } else {
        console.warn('[ORS] Fehler:', err.message);
      }
      // Fallthrough → Haversine
    }
  }

  const km = Math.round(haversineDistance(from, to) * 1.3 * 10) / 10;
  CACHE.set(key, { km, method: 'estimate', timestamp: Date.now() });
  return { km, method: 'estimate' };
}

// ── Haversine ─────────────────────────────────────────────────────────────────
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

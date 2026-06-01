const express  = require('express');
const router   = express.Router();
const { buildBreakdown, calculateSavings } = require('../services/costCalculator');
const { getDistance, haversineDistance }   = require('../services/routeService');
const tankerkoenigService = require('../services/tankerkoenigService');
const econtrolService     = require('../services/econtrolService');
const franceService = require('../services/franceService');
const hereService         = require('../services/hereService');
const { detectCountries, summarize } = require('../services/countryDetector');

const SERVICE = {
  tankerkoening: (p) => tankerkoenigService.getStations(p),
  econtrol:      (p) => econtrolService.getStations(p),
  france:        (p) => franceService.getStations(p), 
  here:          (p) => hereService.getStations(p),
};

const ORS_TOP_N    = 5;
const MAX_STATIONS = 100;

router.post('/', async (req, res, next) => {
  try {
    const { userLat, userLng, fillAmount, consumption, fuelType = 'e5', radius = 15 } = req.body;

    if (!userLat || !userLng || !fillAmount || !consumption) {
      return res.status(400).json({
        error: 'userLat, userLng, fillAmount und consumption sind Pflichtfelder.',
      });
    }

    const fill    = parseFloat(fillAmount);
    const consume = parseFloat(consumption);
    const user    = { lat: parseFloat(userLat), lng: parseFloat(userLng) };

    const detected = detectCountries(user.lat, user.lng);
    const { codes, isBorder } = summarize(detected);

    // ── 1. Stationen laden ───────────────────────────────────────────────────
    const serviceErrors = [];
    const allStations   = [];

    for (const { code, service } of detected) {
      try {
        const stations = await SERVICE[service]({
          lat: user.lat, lng: user.lng, radius, type: fuelType, country: code,
        });
        stations.forEach(s => allStations.push({ ...s, country: code, dataSource: service }));
      } catch (err) {
        const httpStatus = err.response?.status;
        const hint =
          err.message.includes('HERE_API_KEY') ? 'HERE_API_KEY fehlt' :
          httpStatus === 401 ? 'API Key ungültig' :
          httpStatus === 403 ? 'Keine Berechtigung' :
          httpStatus === 429 ? 'Rate Limit' : err.message;
        serviceErrors.push({ country: code, service, httpStatus, hint });
      }
    }

    if (allStations.length === 0) {
      return res.json({
        results: [], countries: codes, serviceErrors,
        message: serviceErrors.length > 0
          ? `Fehler: ${serviceErrors.map(e => `${e.country}: ${e.hint}`).join(' | ')}`
          : 'Keine Tankstellen gefunden.',
      });
    }

    const referencePrice = Math.min(...allStations.map(s => s.price));

    // ── 2. Haversine-Vorsortierung → Top MAX_STATIONS ────────────────────────
    const withEst = allStations.map(s => {
      const estKm   = Math.round(haversineDistance(user, { lat: s.lat, lng: s.lng }) * 1.3 * 10) / 10;
      const estCost = buildBreakdown({
        pricePerLiter: s.price, fillAmount: fill,
        detourKm: estKm, consumption: consume, referencePrice,
      }).totalCost;
      return { ...s, estKm, estCost };
    }).sort((a, b) => a.estCost - b.estCost).slice(0, MAX_STATIONS);

    // ── 3. ORS für Top-N parallel ────────────────────────────────────────────
    const results = await Promise.all(
      withEst.map(async (s, i) => {
        let distanceKm, distanceMethod;

        if (i < ORS_TOP_N) {
          const d = await getDistance(user, { lat: s.lat, lng: s.lng });
          distanceKm = d.km; distanceMethod = d.method;
        } else {
          distanceKm = s.estKm; distanceMethod = 'estimate';
        }

        const breakdown = buildBreakdown({
          pricePerLiter: s.price, fillAmount: fill,
          detourKm: distanceKm, consumption: consume, referencePrice,
        });
        const refCost = buildBreakdown({
          pricePerLiter: referencePrice, fillAmount: fill,
          detourKm: 0, consumption: consume, referencePrice,
        }).totalCost;
        const savings = calculateSavings(breakdown.totalCost, refCost);

        return {
          stationId: s.id, name: s.name || s.brand, brand: s.brand,
          address: `${s.street}, ${s.place}`.replace(/^,\s*/, ''),
          lat: s.lat, lng: s.lng, isOpen: s.isOpen,
          country: s.country, dataSource: s.dataSource,
          pricePerLiter: s.price, currency: s.currency || 'EUR',
          priceLocal: s.priceLocal || null,
          distanceKm, distanceMethod, breakdown,
          savings:  Math.round(savings * 100) / 100,
          worthIt:  savings > 0,
        };
      })
    );

    results.sort((a, b) => a.breakdown.totalCost - b.breakdown.totalCost);

    res.json({
      results, count: results.length,
      countries: codes, borderRegion: isBorder, referencePrice,
      serviceErrors: serviceErrors.length > 0 ? serviceErrors : undefined,
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;

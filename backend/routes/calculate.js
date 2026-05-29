const express  = require('express');
const router   = express.Router();
const { buildBreakdown, calculateSavings } = require('../services/costCalculator');
const { getDistance, haversineDistance } = require('../services/routeService');
const tankerkoenigService = require('../services/tankerkoenigService');
const econtrolService     = require('../services/econtrolService');
const franceService       = require('../services/franceService');
const hereService         = require('../services/hereService');
const { detectCountries, summarize } = require('../services/countryDetector');

const SERVICE = {
  tankerkoening: (p) => tankerkoenigService.getStations(p),
  econtrol:      (p) => econtrolService.getStations(p),
  france:        (p) => franceService.getStations(p),
  here:          (p) => hereService.getStations(p),
};

const ORS_TOP_N = 5;

router.post('/', async (req, res, next) => {
  try {
    const { userLat, userLng, fillAmount, consumption, fuelType = 'e5', radius = 15 } = req.body;

    if (!userLat || !userLng || !fillAmount || !consumption) {
      return res.status(400).json({ error: 'userLat, userLng, fillAmount und consumption sind Pflichtfelder.' });
    }

    const fill    = parseFloat(fillAmount);
    const consume = parseFloat(consumption);
    const user    = { lat: parseFloat(userLat), lng: parseFloat(userLng) };

    const detected = detectCountries(user.lat, user.lng);
    const { codes, isBorder } = summarize(detected);
    console.log(`[Calculate] Länder: ${codes.join(', ')}${isBorder ? ' (Grenzregion)' : ''}`);

    // ── 1. Stationen laden ────────────────────────────────────────────────────
    const serviceErrors = [];
    const allStations   = [];

    for (const { code, service } of detected) {
      try {
        const fn = SERVICE[service];
        if (!fn) continue;
        const stations = await fn({ lat: user.lat, lng: user.lng, radius, type: fuelType, country: code });
        stations.forEach(s => allStations.push({ ...s, country: code, dataSource: service }));
        console.log(`[Calculate] ${code} (${service}): ${stations.length} Stationen`);
      } catch (err) {
        const httpStatus = err.response?.status;
        let hint = err.message.includes('HERE_API_KEY')
          ? 'HERE_API_KEY fehlt in backend/.env'
          : httpStatus === 401 ? 'HERE API Key ungültig'
          : httpStatus === 403 ? 'HERE API Key ohne Fuel-Prices-Berechtigung'
          : httpStatus === 429 ? 'Rate Limit – kurz warten'
          : err.message;

        console.warn(`[Calculate] ${code} FEHLER: ${hint}`);
        serviceErrors.push({ country: code, service, httpStatus, hint });
      }
    }

    if (allStations.length === 0) {
      return res.json({
        results: [], countries: codes, serviceErrors,
        message: serviceErrors.length > 0
          ? `Keine Ergebnisse. ${serviceErrors.map(e => `${e.country}: ${e.hint}`).join(' | ')}`
          : 'Keine Tankstellen im Umkreis gefunden.',
      });
    }

    const referencePrice = Math.min(...allStations.map(s => s.price));

    // ── 2. Haversine-Vorsortierung ────────────────────────────────────────────
    const withEst = allStations.map(s => {
      const estKm   = Math.round(haversineDistance(user, { lat: s.lat, lng: s.lng }) * 1.3 * 10) / 10;
      const estCost = buildBreakdown({ pricePerLiter: s.price, fillAmount: fill, detourKm: estKm, consumption: consume, referencePrice }).totalCost;
      return { ...s, estKm, estCost };
    }).sort((a, b) => a.estCost - b.estCost);

    // ── 3. ORS nur für Top-N ──────────────────────────────────────────────────
    const results = [];
    for (let i = 0; i < withEst.length; i++) {
      const s = withEst[i];
      let distanceKm, distanceMethod;

      if (i < ORS_TOP_N) {
        const d = await getDistance(user, { lat: s.lat, lng: s.lng });
        distanceKm = d.km; distanceMethod = d.method;
      } else {
        distanceKm = s.estKm; distanceMethod = 'estimate';
      }

      const breakdown = buildBreakdown({ pricePerLiter: s.price, fillAmount: fill, detourKm: distanceKm, consumption: consume, referencePrice });
      const refCost   = buildBreakdown({ pricePerLiter: referencePrice, fillAmount: fill, detourKm: 0, consumption: consume, referencePrice }).totalCost;
      const savings   = calculateSavings(breakdown.totalCost, refCost);

      results.push({
        stationId:     s.id,
        name:          s.name || s.brand,
        brand:         s.brand,
        address:       `${s.street}, ${s.place}`.replace(/^,\s*/, ''),
        lat:           s.lat,
        lng:           s.lng,
        isOpen:        s.isOpen,
        country:       s.country,
        dataSource:    s.dataSource,
        pricePerLiter: s.price,
        currency:      s.currency  || 'EUR',
        priceLocal:    s.priceLocal || null,
        distanceKm,
        distanceMethod,
        breakdown,
        savings:       Math.round(savings * 100) / 100,
        worthIt:       savings > 0,
      });
    }

    results.sort((a, b) => a.breakdown.totalCost - b.breakdown.totalCost);

    res.json({ results, count: results.length, countries: codes, borderRegion: isBorder, referencePrice,
               serviceErrors: serviceErrors.length > 0 ? serviceErrors : undefined });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

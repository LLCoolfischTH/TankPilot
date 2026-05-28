const express = require('express');
const router = express.Router();
const tankerkoenigService = require('../services/tankerkoenigService');

/**
 * GET /api/stations
 * Query-Parameter:
 *   lat     – Breitengrad des Nutzerstandorts
 *   lng     – Längengrad des Nutzerstandorts
 *   radius  – Suchradius in km (Standard: 10)
 *   type    – Kraftstoffart: e5 | e10 | diesel (Standard: e5)
 */
router.get('/', async (req, res, next) => {
  try {
    const { lat, lng, radius = 10, type = 'e5' } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat und lng sind Pflichtfelder.' });
    }

    const stations = await tankerkoenigService.getStations({
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      radius: parseInt(radius),
      type,
    });

    res.json({ stations, count: stations.length });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

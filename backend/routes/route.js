const express = require('express');
const router = express.Router();
const routeService = require('../services/routeService');

/**
 * GET /api/route
 * Query-Parameter:
 *   fromLat, fromLng – Startkoordinaten
 *   toLat, toLng     – Zielkoordinaten
 */
router.get('/', async (req, res, next) => {
  try {
    const { fromLat, fromLng, toLat, toLng } = req.query;

    if (!fromLat || !fromLng || !toLat || !toLng) {
      return res.status(400).json({ error: 'fromLat, fromLng, toLat, toLng sind Pflichtfelder.' });
    }

    const distanceKm = await routeService.getDistance(
      { lat: parseFloat(fromLat), lng: parseFloat(fromLng) },
      { lat: parseFloat(toLat),   lng: parseFloat(toLng) }
    );

    res.json({ distanceKm: Math.round(distanceKm * 10) / 10 });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

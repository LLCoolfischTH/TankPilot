const express = require('express');
const axios   = require('axios');
const router  = express.Router();

/**
 * GET /api/geocode?q=Adresse
 *
 * Nutzt Photon (photon.komoot.io) statt Nominatim.
 * Photon ist speziell für Search-as-you-type gebaut,
 * kein API-Key, keine strengen Rate Limits.
 */
router.get('/', async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 3) {
      return res.status(400).json({ error: 'Bitte mindestens 3 Zeichen eingeben.' });
    }

    const response = await axios.get('https://photon.komoot.io/api/', {
      params: {
        q,
        limit: 5,
        lang:  'de',
        lat:   51.0,   // Ortsbias: Mitte Deutschland
        lon:   10.0,
      },
      timeout: 6000,
    });

    const results = (response.data.features || []).map((f) => {
      const p = f.properties;
      // Lesbare Anzeige aus verfügbaren Feldern zusammensetzen
      const parts = [p.name, p.street, p.city, p.state, p.country].filter(Boolean);
      const displayName = [...new Set(parts)].join(', ');
      return {
        displayName,
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
        type: p.type || '',
      };
    });

    res.json({ results });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

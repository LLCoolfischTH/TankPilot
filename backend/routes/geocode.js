const express = require('express');
const axios   = require('axios');
const router  = express.Router();

/**
 * GET /api/geocode?q=Adresse
 * Wandelt eine Adresse in Koordinaten um (Nominatim / OpenStreetMap, kostenlos).
 */
router.get('/', async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 3) {
      return res.status(400).json({ error: 'Bitte mindestens 3 Zeichen eingeben.' });
    }

    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q,
        format:          'json',
        limit:           5,
        addressdetails:  1,
        countrycodes:    'de,pl,cz,at,nl,fr,be,lu,dk,ch', // Grenzregion-fokussiert
      },
      headers: { 'User-Agent': 'TankPilot-MVP/0.1 (Hochschulprojekt THB)' },
      timeout: 5000,
    });

    const results = response.data.map((r) => ({
      displayName: r.display_name,
      lat:         parseFloat(r.lat),
      lng:         parseFloat(r.lon),
      type:        r.type,
    }));

    res.json({ results });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

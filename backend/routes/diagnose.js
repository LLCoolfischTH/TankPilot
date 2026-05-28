const express = require('express');
const router  = express.Router();
const axios   = require('axios');

/**
 * GET /api/diagnose
 * Testet alle externen APIs und gibt Statusbericht zurück.
 * Aufruf im Browser: http://localhost:3001/api/diagnose
 */
router.get('/', async (req, res) => {
  const checks = [];

  // Tankerkönig
  try {
    const r = await axios.get('https://creativecommons.tankerkoenig.de/json/list.php', {
      params: { lat:52.34, lng:14.55, rad:5, sort:'price', type:'e5',
                apikey: process.env.TANKERKOENING_API_KEY || '00000000-0000-0000-0000-000000000002' },
      timeout: 6000,
    });
    checks.push({ service:'Tankerkönig (DE)', ok: r.data.ok === true,
      detail: r.data.ok ? `${r.data.stations?.length} Stationen` : r.data.message });
  } catch (e) {
    checks.push({ service:'Tankerkönig (DE)', ok:false, detail: e.message });
  }

  // E-Control
  try {
    const r = await axios.get('https://api.e-control.at/sprit/1.0/search/gas-stations/by-address',
      { params:{ latitude:47.8, longitude:13.04, fuelType:'SUP', includeClosed:false },
        headers:{ Accept:'application/json' }, timeout:6000 });
    const n = (r.data||[]).filter(s=>s.prices?.length>0).length;
    checks.push({ service:'E-Control (AT)', ok: n > 0, detail:`${n} Stationen mit Preis` });
  } catch (e) {
    checks.push({ service:'E-Control (AT)', ok:false, detail: e.message });
  }

  // HERE
  const hereKey = process.env.HERE_API_KEY;
  if (!hereKey || hereKey === 'dein_here_api_key_hier') {
    checks.push({ service:'HERE (PL/CZ/NL/...)', ok:false,
      detail:'HERE_API_KEY fehlt – kostenlos unter developer.here.com registrieren' });
  } else {
    try {
      const r = await axios.get('https://fuel-v2.cc.api.here.com/fuel/stations.json',
        { params:{ prox:'52.3496,14.5614,10000', fueltype:'2', apiKey:hereKey },
          timeout:8000 });
      const items = r.data?.results?.items || [];
      const n = items.filter(s=>s.fuelPrices?.length>0).length;
      checks.push({ service:'HERE (PL/CZ/NL/...)', ok: items.length > 0,
        detail: items.length > 0
          ? `${items.length} Stationen gesamt, ${n} mit Preis`
          : 'Keine Stationen – evtl. falscher Endpoint oder Key ohne Fuel-Prices-Berechtigung' });
    } catch (e) {
      const status = e.response?.status;
      const hint =
        status === 401 ? 'Key ungültig' :
        status === 403 ? 'Key hat keine Fuel-Prices-Berechtigung → Key unter developer.here.com (nicht platform.here.com) anlegen' :
        status === 429 ? 'Rate Limit' : e.message;
      checks.push({ service:'HERE (PL/CZ/NL/...)', ok:false, detail: hint });
    }
  }

  // ORS
  const orsKey = process.env.ORS_API_KEY;
  if (!orsKey || orsKey === 'dein_ors_api_key_hier') {
    checks.push({ service:'ORS Routing', ok:false, detail:'ORS_API_KEY fehlt – Haversine-Fallback aktiv' });
  } else {
    try {
      const r = await axios.get('https://api.openrouteservice.org/v2/directions/driving-car',
        { params:{ api_key:orsKey, start:'14.5562,52.3418', end:'14.5614,52.3496' },
          timeout:6000 });
      const km = (r.data.features[0].properties.segments[0].distance/1000).toFixed(1);
      checks.push({ service:'ORS Routing', ok:true, detail:`${km} km Teststrecke` });
    } catch (e) {
      const status = e.response?.status;
      const hint = status === 429 ? 'Rate Limit (40/min) – Throttler aktiv' :
                   status === 403 ? 'Key ungültig' : e.message;
      checks.push({ service:'ORS Routing', ok: status===429, detail: hint });
    }
  }

  const allOk = checks.every(c => c.ok);
  res.json({ allOk, checks,
    tip: allOk ? '✅ Alle APIs erreichbar' :
      '❌ Prüfe backend/.env – führe auch aus: node backend/tests/api/debug-here.js' });
});

module.exports = router;

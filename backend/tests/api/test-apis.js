/**
 * TankPilot – API-Verbindungstest
 * Führe aus mit: node backend/tests/api/test-apis.js
 *
 * Testet alle drei externen APIs und gibt eine klare Diagnose aus.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const axios = require('axios');

// ── Hilfsfunktionen ────────────────────────────────────────────────────────────

const OK  = '✅';
const ERR = '❌';
const WARN = '⚠️ ';

function header(title) {
  console.log('\n' + '─'.repeat(50));
  console.log(`  ${title}`);
  console.log('─'.repeat(50));
}

function result(label, ok, detail) {
  console.log(`  ${ok ? OK : ERR}  ${label}`);
  if (detail) console.log(`      ${detail}`);
}

// ── TEST 1: Tankerkönig ────────────────────────────────────────────────────────

async function testTankerkoening() {
  header('TEST 1 – Tankerkönig API (Bundeskartellamt MTS-K)');

  const apiKey = process.env.TANKERKOENING_API_KEY || '00000000-0000-0000-0000-000000000002';
  const isDemo = apiKey === '00000000-0000-0000-0000-000000000002';

  console.log(`  API-Key: ${isDemo ? 'Demo-Key (eingeschränkt)' : 'Eigener Key ✓'}`);
  console.log(`  Tipp: Registrierung unter https://creativecommons.tankerkoenig.de/\n`);

  // Test 1a: Listenabfrage (Frankfurt Oder – Grenzregion)
  try {
    const resp = await axios.get('https://creativecommons.tankerkoenig.de/json/list.php', {
      params: {
        lat:    52.3418,
        lng:    14.5562,
        rad:    10,
        sort:   'price',
        type:   'e5',
        apikey: apiKey,
      },
      timeout: 8000,
    });

    if (resp.data.ok) {
      const stations = resp.data.stations || [];
      result('Listenabfrage Frankfurt (Oder)', true,
        `${stations.length} Tankstellen gefunden`);

      if (stations.length > 0) {
        const s = stations[0];
        result('Datenparsing', true,
          `Günstigste: ${s.brand} · ${s.price} €/L · ${s.dist} km`);
        console.log('\n  Erste 3 Tankstellen:');
        stations.slice(0, 3).forEach((s, i) => {
          console.log(`    ${i + 1}. ${s.name.padEnd(30)} ${String(s.price).padStart(5)} €/L   ${s.dist} km`);
        });
      }
    } else {
      result('Listenabfrage', false, `API-Fehler: ${resp.data.message}`);
    }
  } catch (err) {
    result('Listenabfrage', false, err.message);
    if (err.response?.status === 503) {
      console.log(`      → API überlastet, kurz warten und nochmal versuchen`);
    }
  }

  // Test 1b: Detailabfrage einer einzelnen Station
  try {
    const resp = await axios.get('https://creativecommons.tankerkoenig.de/json/list.php', {
      params: { lat: 52.52, lng: 13.4, rad: 2, sort: 'price', type: 'diesel', apikey: apiKey },
      timeout: 8000,
    });
    if (resp.data.ok && resp.data.stations?.length > 0) {
      result('Diesel-Abfrage Berlin', true,
        `${resp.data.stations[0].price} €/L`);
    }
  } catch (err) {
    result('Diesel-Abfrage', false, err.message);
  }
}

// ── TEST 2: OpenRouteService ───────────────────────────────────────────────────

async function testORS() {
  header('TEST 2 – OpenRouteService (Straßendistanz)');

  const apiKey = process.env.ORS_API_KEY;

  if (!apiKey || apiKey === 'dein_ors_api_key_hier') {
    result('API-Key vorhanden', false, 'Kein ORS_API_KEY in .env gesetzt');
    console.log(`
  So bekommst du einen kostenlosen Key:
    1. https://openrouteservice.org/dev/#/signup aufrufen
    2. Konto erstellen (kostenlos)
    3. Unter "Dashboard" → "API Key" generieren
    4. In backend/.env eintragen:  ORS_API_KEY=dein_key_hier
    5. Dieser Test nochmals ausführen

  Limit Free Tier: 2.000 Anfragen/Tag – für den MVP mehr als genug.
    `);
    return;
  }

  result('API-Key vorhanden', true, `${apiKey.substring(0, 8)}...`);

  // Test 2a: Einfache Route (Frankfurt Oder → Słubice, Grenzübergang)
  try {
    const resp = await axios.get('https://api.openrouteservice.org/v2/directions/driving-car', {
      params: {
        api_key: apiKey,
        start:   '14.5562,52.3418', // Frankfurt (Oder)
        end:     '14.5614,52.3496', // Słubice (Polen)
      },
      timeout: 8000,
    });

    const segment = resp.data.features?.[0]?.properties?.segments?.[0];
    if (segment) {
      const km  = (segment.distance / 1000).toFixed(2);
      const min = (segment.duration / 60).toFixed(1);
      result('Route Frankfurt (Oder) → Słubice', true,
        `${km} km · ${min} min Fahrzeit`);
    }
  } catch (err) {
    result('Route Frankfurt → Słubice', false, err.response?.data?.error?.message || err.message);
    if (err.response?.status === 403) {
      console.log(`      → Key ungültig oder Rate Limit erreicht`);
    }
  }

  // Test 2b: Längere Route (DE → PL, ~20 km)
  try {
    const resp = await axios.get('https://api.openrouteservice.org/v2/directions/driving-car', {
      params: {
        api_key: apiKey,
        start:   '14.5500,52.3400',
        end:     '14.7200,52.2800',
      },
      timeout: 8000,
    });
    const seg = resp.data.features?.[0]?.properties?.segments?.[0];
    if (seg) {
      result('Mittlere Route (~15 km)', true,
        `${(seg.distance / 1000).toFixed(1)} km · ${(seg.duration / 60).toFixed(0)} min`);
    }
  } catch (err) {
    result('Mittlere Route', false, err.message);
  }
}

// ── TEST 3: Nominatim (Geocoding) ─────────────────────────────────────────────

async function testNominatim() {
  header('TEST 3 – Nominatim Geocoding (OpenStreetMap)');
  console.log('  Kein API-Key benötigt – kostenlos & unbegrenzt (fair use)\n');

  const queries = [
    { q: 'Frankfurt (Oder)', expect: 'Frankfurt' },
    { q: 'Słubice, Polen',   expect: 'Słubice' },
    { q: 'Görlitz',          expect: 'Görlitz' },
  ];

  for (const { q, expect } of queries) {
    try {
      const resp = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: { q, format: 'json', limit: 1, addressdetails: 1 },
        headers: { 'User-Agent': 'TankPilot-MVP/0.1 (Hochschulprojekt)' },
        timeout: 8000,
      });

      if (resp.data.length > 0) {
        const r = resp.data[0];
        result(`Geocoding: "${q}"`, true,
          `lat=${parseFloat(r.lat).toFixed(4)}, lng=${parseFloat(r.lon).toFixed(4)}`);
      } else {
        result(`Geocoding: "${q}"`, false, 'Kein Ergebnis');
      }
    } catch (err) {
      result(`Geocoding: "${q}"`, false, err.message);
    }

    // Nominatim: max. 1 Anfrage/Sekunde
    await new Promise(r => setTimeout(r, 1100));
  }
}

// ── TEST 4: TankPilot Backend selbst ──────────────────────────────────────────

async function testOwnBackend() {
  header('TEST 4 – TankPilot Backend (localhost:3001)');

  // Health-Check
  try {
    const resp = await axios.get('http://localhost:3001/api/health', { timeout: 3000 });
    result('Health-Check', true, `Version ${resp.data.version}`);
  } catch {
    result('Health-Check', false, 'Backend nicht erreichbar – ist "npm run dev:backend" gestartet?');
    return;
  }

  // Geocode-Endpoint
  try {
    const resp = await axios.get('http://localhost:3001/api/geocode', {
      params: { q: 'Frankfurt Oder' },
      timeout: 8000,
    });
    result('/api/geocode', resp.data.results?.length > 0,
      `${resp.data.results?.length} Treffer`);
  } catch (err) {
    result('/api/geocode', false, err.message);
  }

  // Calculate-Endpoint
  try {
    const resp = await axios.post('http://localhost:3001/api/calculate', {
      userLat:     52.3418,
      userLng:     14.5562,
      fillAmount:  40,
      consumption: 7.5,
      fuelType:    'e5',
      radius:      10,
    }, { timeout: 12000 });

    const ok = resp.data.results?.length > 0;
    result('/api/calculate', ok,
      ok ? `${resp.data.count} Tankstellen · beste: ${resp.data.results[0]?.breakdown?.totalCost} €` : 'Keine Ergebnisse');

    if (ok) {
      const best = resp.data.results[0];
      const dm   = best.distanceMethod;
      result(`Distanzmethode`, true,
        dm === 'navigation' ? 'ORS-Navigation aktiv ✓' : 'Schätzung (Luftlinie ×1,3) – ORS_API_KEY fehlt');
    }
  } catch (err) {
    result('/api/calculate', false, err.response?.data?.error || err.message);
  }
}

// ── HAUPT-RUNNER ───────────────────────────────────────────────────────────────

async function main() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║     TankPilot – API-Verbindungstest              ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log(`  .env: ${require('path').resolve(__dirname, '../../.env')}\n`);

  await testTankerkoening();
  await testORS();
  await testNominatim();
  await testOwnBackend();
  await testEControl();
  await testHERE();

  header('ZUSAMMENFASSUNG');
  console.log(`
  Tankerkönig FEHLER  → https://creativecommons.tankerkoenig.de
  ORS fehlt           → https://openrouteservice.org/dev/#/signup
  HERE fehlt/403      → https://developer.here.com (Projekt → API Key)
  E-Control FEHLER    → Keine Aktion nötig (öffentliche API)
  Backend nicht da    → npm run dev:backend starten
  `);
}

main().catch(console.error);

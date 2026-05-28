require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');

const GREEN  = '\x1b[32m'; const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m'; const BOLD   = '\x1b[1m'; const RESET  = '\x1b[0m';

const ok   = (msg) => console.log(`  ${GREEN}✓${RESET} ${msg}`);
const fail = (msg) => console.log(`  ${RED}✗${RESET} ${msg}`);
const warn = (msg) => console.log(`  ${YELLOW}⚠${RESET} ${msg}`);
const head = (msg) => console.log(`\n${BOLD}${msg}${RESET}\n  ${'─'.repeat(50)}`);

async function testTankerkoenigDemo() {
  head('1. Tankerkönig API  –  Demo-Key');
  try {
    const res = await axios.get('https://creativecommons.tankerkoenig.de/json/list.php', {
      params: { lat: 52.3418, lng: 14.5562, rad: 5, sort: 'price', type: 'e5',
                apikey: '00000000-0000-0000-0000-000000000002' },
      timeout: 8000,
    });
    if (res.data.ok) {
      const st = res.data.stations || [];
      ok(`Verbindung OK · ${st.length} Tankstellen gefunden (Frankfurt/Oder, 5 km)`);
      if (st[0]) ok(`Günstigste: ${st[0].brand} ${st[0].name} – ${st[0].price} €/L`);
      warn(`Demo-Key hat begrenzte Anfragen/Tag.`);
      console.log(`     Eigenen Key registrieren: https://creativecommons.tankerkoenig.de`);
    } else {
      fail(`API-Fehler: ${res.data.message}`);
    }
  } catch (e) { fail(`Verbindung fehlgeschlagen: ${e.message}`); }
}

async function testTankerkoenigOwnKey() {
  head('2. Tankerkönig API  –  eigener Key aus .env');
  const key = process.env.TANKERKOENING_API_KEY;
  if (!key || key.startsWith('dein_')) {
    warn('Kein Key gesetzt. Trage in backend/.env ein:');
    console.log(`     TANKERKOENING_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`);
    return;
  }
  try {
    const res = await axios.get('https://creativecommons.tankerkoenig.de/json/list.php', {
      params: { lat: 52.3418, lng: 14.5562, rad: 5, sort: 'price', type: 'e5', apikey: key },
      timeout: 8000,
    });
    if (res.data.ok) {
      ok(`Key funktioniert! ${(res.data.stations||[]).length} Stationen gefunden`);
    } else {
      fail(`Key abgelehnt: ${res.data.message}`);
    }
  } catch (e) { fail(`Fehler: ${e.message}`); }
}

async function testORS() {
  head('3. OpenRouteService API  –  Navigationsdistanz');
  const key = process.env.ORS_API_KEY;
  if (!key || key.startsWith('dein_')) {
    warn('Kein Key gesetzt → Haversine-Fallback aktiv (Schätzung ±20%)');
    console.log(`     Gratis-Key (2.000 Req/Tag): https://openrouteservice.org/dev/#/signup`);
    console.log(`     Danach in backend/.env: ORS_API_KEY=dein_key`);
    return;
  }
  try {
    const res = await axios.get('https://api.openrouteservice.org/v2/directions/driving-car', {
      params: { api_key: key, start: '14.5562,52.3418', end: '14.5611,52.3344' },
      timeout: 8000,
    });
    const seg  = res.data.features[0].properties.segments[0];
    const km   = (seg.distance / 1000).toFixed(1);
    const mins = Math.round(seg.duration / 60);
    ok(`Key OK! Testroute Frankfurt(Oder)→Słubice: ${km} km (ca. ${mins} Min.)`);
    ok(`Navigationsdistanz wird jetzt für alle Berechnungen genutzt`);
  } catch (e) {
    if (e.response?.status === 403) fail(`Key abgelehnt (403) – korrekt kopiert?`);
    else if (e.response?.status === 429) warn(`Rate-Limit (429) – Tageskontingent aufgebraucht`);
    else fail(`Fehler: ${e.message}`);
  }
}

async function testNominatim() {
  head('4. Nominatim Geocoding  –  Adresssuche (kein Key nötig)');
  try {
    const res = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: { q: 'Frankfurt Oder', format: 'json', limit: 2 },
      headers: { 'User-Agent': 'TankPilot-MVP/0.1' },
      timeout: 8000,
    });
    if (res.data.length > 0) {
      ok(`Erreichbar · Treffer: ${res.data[0].display_name.substring(0, 55)}…`);
      ok(`Koordinaten: ${parseFloat(res.data[0].lat).toFixed(4)}, ${parseFloat(res.data[0].lon).toFixed(4)}`);
    } else { warn(`Keine Ergebnisse für Testabfrage`); }
  } catch (e) { fail(`Nicht erreichbar: ${e.message}`); }
}

async function testBackend() {
  head('5. TankPilot Backend  –  lokaler Endpunkt-Test');
  try {
    const health = await axios.get('http://localhost:3001/api/health', { timeout: 3000 });
    ok(`Backend läuft · Version ${health.data.version}`);
  } catch {
    fail(`Backend nicht erreichbar – läuft "npm run dev:backend"?`);
    return;
  }
  try {
    const res = await axios.post('http://localhost:3001/api/calculate', {
      userLat: 52.3418, userLng: 14.5562,
      fillAmount: 40, consumption: 7.5, fuelType: 'e5', radius: 10,
    }, { timeout: 12000 });
    const count = res.data.results?.length || 0;
    if (count > 0) {
      const best = res.data.results[0];
      ok(`/api/calculate OK · ${count} Ergebnisse`);
      ok(`Beste Option: ${best.name} · ${best.breakdown.totalCost.toFixed(2)} € Gesamtkosten`);
      ok(`Distanzmethode: ${best.distanceMethod === 'navigation' ? 'Navigation (ORS) ✓' : 'Schätzung (kein ORS-Key)'}`);
    } else { warn(`Keine Tankstellen gefunden (Demo-Key-Limit oder Netz?)`); }
  } catch (e) { fail(`/api/calculate Fehler: ${e.message}`); }

  try {
    const geo = await axios.get('http://localhost:3001/api/geocode?q=Cottbus', { timeout: 8000 });
    ok(`/api/geocode OK · ${geo.data.results.length} Treffer für "Cottbus"`);
  } catch (e) { fail(`/api/geocode Fehler: ${e.message}`); }
}

async function main() {
  console.log(`\n${BOLD}TankPilot – API-Verbindungstest${RESET}`);
  console.log('═'.repeat(54));
  await testTankerkoenigDemo();
  await testTankerkoenigOwnKey();
  await testORS();
  await testNominatim();
  await testBackend();
  console.log(`\n${'═'.repeat(54)}`);
  console.log(`${BOLD}Test abgeschlossen.${RESET} ✓ grün = OK  ✗ rot = Handlungsbedarf  ⚠ gelb = optional\n`);
}

main().catch(console.error);

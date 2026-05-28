/**
 * TankPilot – HERE API Diagnose-Script
 * Führe aus mit: node backend/tests/api/debug-here.js
 *
 * Zeigt den rohen API-Response damit du siehst ob der Key funktioniert
 * und wie die Daten aufgebaut sind.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const axios = require('axios');

const apiKey = process.env.HERE_API_KEY;

async function main() {
  console.log('\n── HERE API Diagnose ──────────────────────────────\n');

  if (!apiKey || apiKey === 'dein_here_api_key_hier') {
    console.log('❌ HERE_API_KEY nicht gesetzt!');
    console.log('\nSo einrichten:');
    console.log('  1. https://developer.here.com aufrufen');
    console.log('  2. Sign up / Log in');
    console.log('  3. "Projects" → neues Projekt anlegen');
    console.log('  4. "REST" API Key generieren');
    console.log('  5. In backend/.env eintragen: HERE_API_KEY=dein_key\n');
    return;
  }

  console.log(`API Key: ${apiKey.substring(0, 12)}...`);
  console.log('Endpoint: https://fuel-v2.cc.api.here.com/fuel/stations.json\n');

  // Test 1: Polen (Słubice, direkt an DE/PL-Grenze)
  const tests = [
    { name: 'Słubice, Polen (DE/PL)',    lat: 52.3496, lng: 14.5614 },
    { name: 'Cheb, Tschechien (DE/CZ)',  lat: 50.0804, lng: 12.3723 },
  ];

  for (const t of tests) {
    console.log(`── ${t.name} ──`);
    try {
      const resp = await axios.get('https://fuel-v2.cc.api.here.com/fuel/stations.json', {
        params: {
          prox:     `${t.lat},${t.lng},10000`,
          fueltype: '2',
          apiKey,
        },
        timeout: 8000,
      });

      const items = resp.data?.results?.items || [];
      console.log(`  HTTP Status: ${resp.status} ✓`);
      console.log(`  Stationen gesamt: ${items.length}`);

      const withPrice = items.filter(s => s.fuelPrices?.length > 0);
      console.log(`  Mit Preis: ${withPrice.length}`);

      if (withPrice.length > 0) {
        const s = withPrice[0];
        console.log('\n  Erste Station (Rohdaten):');
        console.log(JSON.stringify({
          id:         s.id,
          name:       s.name,
          brand:      s.brand,
          position:   s.position,
          address:    s.address,
          fuelPrices: s.fuelPrices,
          distance:   s.distance,
          open24x7:   s.open24x7,
        }, null, 4).split('\n').map(l => '  ' + l).join('\n'));
      } else if (items.length > 0) {
        console.log('\n  ⚠ Stationen gefunden, aber KEINE Preise.');
        console.log('  Rohdaten erste Station:');
        console.log(JSON.stringify(items[0], null, 4).split('\n').map(l => '  ' + l).join('\n'));
      }
    } catch (err) {
      const status = err.response?.status;
      const body   = err.response?.data;
      console.log(`  HTTP Status: ${status || 'Keine Antwort'} ❌`);

      if (status === 401) {
        console.log('  → Key ungültig oder abgelaufen');
        console.log('  → Neuen Key unter developer.here.com generieren');
      } else if (status === 403) {
        console.log('  → Key hat KEINE Berechtigung für Fuel Prices API');
        console.log('  → Lösung A: Key unter developer.here.com (nicht platform.here.com) anlegen');
        console.log('  → Lösung B: In platform.here.com → Projekt → Services → "Fuel Prices" aktivieren');
      } else if (status === 429) {
        console.log('  → Rate Limit erreicht – kurz warten');
      } else {
        console.log('  Fehler:', err.message);
        if (body) console.log('  Body:', JSON.stringify(body));
      }
    }
    console.log('');
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('──────────────────────────────────────────────────\n');
}

main().catch(console.error);

/**
 * TankPilot – Länder-Erkennung & Service-Routing
 *
 * Jedes Land ist genau einem Daten-Service zugeordnet:
 *   'tankerkoening' → Bundeskartellamt MTS-K (DE, kostenlos)
 *   'econtrol'      → E-Control Austria (AT, kostenlos)
 *   'here'          → HERE Fuel Prices API (alle anderen, Freemium)
 *
 * Bounding Boxes + Grenzpuffer von ~15 km (0.15°).
 * Im Grenzgebiet können mehrere Länder aktiv sein.
 */

const COUNTRIES = {
  // ── Dedizierte kostenlose APIs ──────────────────────────────────────────────
  DE: { latMin: 47.27, latMax: 55.06, lngMin:  5.87, lngMax: 15.04, service: 'tankerkoening' },
  AT: { latMin: 46.37, latMax: 49.02, lngMin:  9.53, lngMax: 17.16, service: 'econtrol'      },

  // ── HERE-Länder: DE-Grenzländer (alle relevant für Grenzregionen) ───────────
  PL: { latMin: 49.00, latMax: 54.84, lngMin: 14.12, lngMax: 24.15, service: 'here' }, // Frankfurt (Oder), Görlitz
  CZ: { latMin: 48.55, latMax: 51.06, lngMin: 12.09, lngMax: 18.86, service: 'here' }, // Erzgebirge, Oberlausitz
  NL: { latMin: 50.75, latMax: 53.56, lngMin:  3.36, lngMax:  7.23, service: 'here' }, // Niederrhein, Aachen
  BE: { latMin: 49.50, latMax: 51.51, lngMin:  2.55, lngMax:  6.40, service: 'here' }, // Aachen, Eifel
  LU: { latMin: 49.44, latMax: 50.18, lngMin:  5.73, lngMax:  6.53, service: 'here' }, // Trier, Eifel
  FR: { latMin: 42.33, latMax: 51.09, lngMin: -4.79, lngMax:  8.23, service: 'here' }, // Elsass, Saarland, Pfalz
  CH: { latMin: 45.82, latMax: 47.81, lngMin:  5.96, lngMax: 10.49, service: 'here' }, // Freiburg, Konstanz, Basel
  DK: { latMin: 54.56, latMax: 57.75, lngMin:  8.07, lngMax: 15.19, service: 'here' }, // Flensburg, Schleswig
};

const BORDER_BUFFER = 0.15; // ~15 km

/**
 * Gibt alle zutreffenden Länder-Einträge zurück.
 * @returns {Array<{ code: string, service: string }>}
 */
function detectCountries(lat, lng) {
  const results = [];
  for (const [code, bb] of Object.entries(COUNTRIES)) {
    if (
      lat >= bb.latMin - BORDER_BUFFER &&
      lat <= bb.latMax + BORDER_BUFFER &&
      lng >= bb.lngMin - BORDER_BUFFER &&
      lng <= bb.lngMax + BORDER_BUFFER
    ) {
      results.push({ code, service: bb.service });
    }
  }
  return results.length > 0 ? results : [{ code: 'DE', service: 'tankerkoening' }];
}

function isBorderRegion(lat, lng) {
  return detectCountries(lat, lng).length > 1;
}

/**
 * Gibt für eine Gruppe erkannter Länder eine lesbare Zusammenfassung zurück.
 */
function summarize(detectedCountries) {
  const codes    = detectedCountries.map(c => c.code);
  const services = [...new Set(detectedCountries.map(c => c.service))];
  return { codes, services, isBorder: codes.length > 1 };
}

module.exports = { detectCountries, isBorderRegion, summarize };

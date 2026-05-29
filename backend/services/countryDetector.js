/**
 * TankPilot – Länder-Erkennung & Service-Routing
 *
 * Services:
 *   'tankerkoening' → DE (Bundeskartellamt MTS-K, kostenlos)
 *   'econtrol'      → AT (E-Control Austria, kostenlos)
 *   'france'        → FR (Wirtschaftsministerium, kostenlos)
 *   'here'          → PL, CZ, NL, BE, LU, CH, DK (Freemium, Key nötig)
 */

const COUNTRIES = {
  DE: { latMin: 47.27, latMax: 55.06, lngMin:  5.87, lngMax: 15.04, service: 'tankerkoening' },
  AT: { latMin: 46.37, latMax: 49.02, lngMin:  9.53, lngMax: 17.16, service: 'econtrol'      },
  FR: { latMin: 42.33, latMax: 51.09, lngMin: -4.79, lngMax:  8.23, service: 'france'        },
  PL: { latMin: 49.00, latMax: 54.84, lngMin: 14.12, lngMax: 24.15, service: 'here'          },
  CZ: { latMin: 48.55, latMax: 51.06, lngMin: 12.09, lngMax: 18.86, service: 'here'          },
  NL: { latMin: 50.75, latMax: 53.56, lngMin:  3.36, lngMax:  7.23, service: 'here'          },
  BE: { latMin: 49.50, latMax: 51.51, lngMin:  2.55, lngMax:  6.40, service: 'here'          },
  LU: { latMin: 49.44, latMax: 50.18, lngMin:  5.73, lngMax:  6.53, service: 'here'          },
  CH: { latMin: 45.82, latMax: 47.81, lngMin:  5.96, lngMax: 10.49, service: 'here'          },
  DK: { latMin: 54.56, latMax: 57.75, lngMin:  8.07, lngMax: 15.19, service: 'here'          },
};

const BORDER_BUFFER = 0.15;

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

function summarize(detectedCountries) {
  const codes    = detectedCountries.map(c => c.code);
  const services = [...new Set(detectedCountries.map(c => c.service))];
  return { codes, services, isBorder: codes.length > 1 };
}

module.exports = { detectCountries, isBorderRegion, summarize };

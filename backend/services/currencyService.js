const axios = require('axios');

/**
 * TankPilot – Währungsumrechnung
 *
 * Primär:  open.er-api.com (kostenlos, kein Key, ~1.500 Req/Monat)
 * Fallback: Hardcodierte Näherungswerte (wöchentlich manuell aktualisierbar)
 *
 * Gibt zurück: Wie viele Einheiten der Fremdwährung = 1 EUR
 * Beispiel: PLN=4.25 → 1 EUR = 4.25 PLN → Preis in PLN / 4.25 = Preis in EUR
 */

// Cache: Kurse 6 Stunden gültig
const CACHE     = new Map();
const TTL_MS    = 6 * 60 * 60 * 1000;

// Fallback-Kurse (Stand: Mai 2026 – bitte regelmäßig prüfen)
const FALLBACK_RATES = {
  PLN: 4.26,   // Polnischer Zloty
  CZK: 25.20,  // Tschechische Krone
  DKK: 7.46,   // Dänische Krone
  CHF: 0.94,   // Schweizer Franken
  HUF: 395.0,  // Ungarischer Forint
  SEK: 11.60,  // Schwedische Krone
  NOK: 11.80,  // Norwegische Krone
};

/**
 * Gibt den Kurs zurück: wie viele Einheiten Fremdwährung = 1 EUR
 * @param {string} currency – ISO-Code, z. B. 'PLN'
 * @returns {number}
 */
async function getEurRate(currency) {
  if (currency === 'EUR') return 1;

  const cached = CACHE.get(currency);
  if (cached && Date.now() - cached.timestamp < TTL_MS) {
    return cached.rate;
  }

  try {
    const resp = await axios.get(`https://open.er-api.com/v6/latest/EUR`, {
      timeout: 5000,
    });

    if (resp.data?.rates) {
      // Alle Kurse einmal cachen
      for (const [code, rate] of Object.entries(resp.data.rates)) {
        CACHE.set(code, { rate, timestamp: Date.now() });
      }
      return resp.data.rates[currency] ?? FALLBACK_RATES[currency] ?? 1;
    }
  } catch (err) {
    console.warn(`[Currency] API fehlgeschlagen für ${currency}, nutze Fallback:`, err.message);
  }

  return FALLBACK_RATES[currency] ?? 1;
}

/**
 * Rechnet einen Preis von Fremdwährung in EUR um.
 * @param {number} amount   – Preis in Fremdwährung
 * @param {string} currency – ISO-Code
 * @returns {Promise<number>} – Preis in EUR
 */
async function toEur(amount, currency) {
  if (currency === 'EUR') return amount;
  const rate = await getEurRate(currency);
  return Math.round((amount / rate) * 1000) / 1000;
}

module.exports = { getEurRate, toEur, FALLBACK_RATES };

/**
 * TankPilot – Kern-Algorithmus
 *
 * Gesamtkosten = Tankkosten + Umwegkosten
 *
 *   Tankkosten  = fillAmount × pricePerLiter
 *   Umwegkosten = (detourKm × 2 × consumption / 100) × referencePrice
 *
 * Der Umweg wird doppelt gezählt (Hin- UND Rückfahrt).
 * "Lohnt es sich?" → wenn Gesamtkosten < Referenz-Gesamtkosten
 */

function calculateTotalCost({ pricePerLiter, fillAmount, detourKm, consumption, referencePrice }) {
  const fuelCost = pricePerLiter * fillAmount;
  const detourFuelLiters = (detourKm * 2 * consumption) / 100;
  const detourCost = detourFuelLiters * referencePrice;
  return fuelCost + detourCost;
}

/**
 * Gibt eine vollständige Aufschlüsselung der Berechnung zurück –
 * damit der Nutzer nachvollziehen kann, wie der Preis zustande kommt.
 */
function buildBreakdown({ pricePerLiter, fillAmount, detourKm, consumption, referencePrice }) {
  const fuelCost = pricePerLiter * fillAmount;
  const detourFuelLiters = (detourKm * 2 * consumption) / 100;
  const detourCost = detourFuelLiters * referencePrice;
  const totalCost = fuelCost + detourCost;

  return {
    fuelCost:         Math.round(fuelCost * 100) / 100,
    detourKm,
    detourFuelLiters: Math.round(detourFuelLiters * 100) / 100,
    detourCost:       Math.round(detourCost * 100) / 100,
    totalCost:        Math.round(totalCost * 100) / 100,
    formula: `${fillAmount} L × ${pricePerLiter.toFixed(3)} €/L + (${detourKm} km × 2 × ${consumption} L/100km / 100) × ${referencePrice.toFixed(3)} €/L`,
  };
}

function calculateSavings(totalCostStation, totalCostReference) {
  return totalCostReference - totalCostStation;
}

function isWorthIt(savings) {
  return savings > 0;
}

module.exports = { calculateTotalCost, buildBreakdown, calculateSavings, isWorthIt };

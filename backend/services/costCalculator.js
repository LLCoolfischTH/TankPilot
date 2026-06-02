function calculateTotalCost({ pricePerLiter, fillAmount, detourKm, consumption, referencePrice }) {
  const fuelCost = pricePerLiter * fillAmount;
  const detourFuelLiters = (detourKm * 2 * consumption) / 100;
  const detourCost = detourFuelLiters * referencePrice;
  return fuelCost + detourCost;
}

function buildBreakdown({ pricePerLiter, fillAmount, detourKm, consumption, referencePrice }) {
  const fuelCost = pricePerLiter * fillAmount;
  const detourFuelLiters = (detourKm * 2 * consumption) / 100;
  const detourCost = detourFuelLiters * referencePrice;
  const totalCost = fuelCost + detourCost;

  // .toFixed() gegen null/undefined absichern
  const priceFmt = (pricePerLiter ?? 0).toFixed(3);
  const refFmt   = (referencePrice   ?? 0).toFixed(3);

  return {
    fuelCost:         Math.round(fuelCost * 100) / 100,
    detourKm,
    detourFuelLiters: Math.round(detourFuelLiters * 100) / 100,
    detourCost:       Math.round(detourCost * 100) / 100,
    totalCost:        Math.round(totalCost * 100) / 100,
    formula: `${fillAmount} L × ${priceFmt} €/L + (${detourKm} km × 2 × ${consumption} L/100km / 100) × ${refFmt} €/L`,
  };
}

function calculateSavings(totalCostStation, totalCostReference) {
  return totalCostReference - totalCostStation;
}

function isWorthIt(savings) {
  return savings > 0;
}

module.exports = { calculateTotalCost, buildBreakdown, calculateSavings, isWorthIt };

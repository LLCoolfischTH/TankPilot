const { calculateTotalCost, calculateSavings, isWorthIt } = require('../services/costCalculator');

describe('calculateTotalCost', () => {
  test('Tankstelle direkt nebenan (0 km Umweg)', () => {
    const cost = calculateTotalCost({
      pricePerLiter: 1.80,
      fillAmount: 50,
      detourKm: 0,
      consumption: 7.5,
      referencePrice: 1.80,
    });
    expect(cost).toBeCloseTo(90.00, 2);
  });

  test('Günstige Tankstelle 5 km entfernt lohnt sich', () => {
    // Nächste Station: 1.80 €/L
    // Entfernte Station: 1.60 €/L, 5 km Umweg, 7.5 L/100km
    const totalCostFar = calculateTotalCost({
      pricePerLiter: 1.60,
      fillAmount: 50,
      detourKm: 5,
      consumption: 7.5,
      referencePrice: 1.80,
    });
    const totalCostRef = calculateTotalCost({
      pricePerLiter: 1.80,
      fillAmount: 50,
      detourKm: 0,
      consumption: 7.5,
      referencePrice: 1.80,
    });

    // Ersparnis sollte positiv sein
    const savings = calculateSavings(totalCostFar, totalCostRef);
    expect(savings).toBeGreaterThan(0);
    expect(isWorthIt(savings)).toBe(true);
  });

  test('Günstige Tankstelle 50 km entfernt lohnt sich NICHT', () => {
    const totalCostFar = calculateTotalCost({
      pricePerLiter: 1.60,
      fillAmount: 50,
      detourKm: 50,
      consumption: 7.5,
      referencePrice: 1.80,
    });
    const totalCostRef = calculateTotalCost({
      pricePerLiter: 1.80,
      fillAmount: 50,
      detourKm: 0,
      consumption: 7.5,
      referencePrice: 1.80,
    });

    const savings = calculateSavings(totalCostFar, totalCostRef);
    expect(savings).toBeLessThan(0);
    expect(isWorthIt(savings)).toBe(false);
  });

  test('Grenzregion: Sehr günstiger Preis im Ausland (z.B. Polen)', () => {
    // Polen: ~1.30 €/L, 15 km Grenzübergang
    const totalCostPoland = calculateTotalCost({
      pricePerLiter: 1.30,
      fillAmount: 60,
      detourKm: 15,
      consumption: 8.0,
      referencePrice: 1.80,
    });
    const totalCostGermany = calculateTotalCost({
      pricePerLiter: 1.80,
      fillAmount: 60,
      detourKm: 0,
      consumption: 8.0,
      referencePrice: 1.80,
    });

    const savings = calculateSavings(totalCostPoland, totalCostGermany);
    expect(savings).toBeGreaterThan(0);
  });
});

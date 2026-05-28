/**
 * TankPilot – Algorithmus-Validierung mit Rechenbeispielen
 * Führe aus mit: node backend/tests/api/validate-algorithm.js
 *
 * Prüft die Kernlogik mit realistischen Szenarien und
 * zeigt die vollständige Herleitung jedes Ergebnisses.
 */

const { calculateTotalCost, buildBreakdown, calculateSavings } = require('../../services/costCalculator');

// ── Hilfsfunktionen ────────────────────────────────────────────────────────────

function box(title) {
  const line = '═'.repeat(52);
  console.log(`\n╔${line}╗`);
  console.log(`║  ${title.padEnd(50)}║`);
  console.log(`╚${line}╝`);
}

function scenario(name) {
  console.log(`\n  ┌─ ${name}`);
}

function show(label, value, unit = '') {
  console.log(`  │  ${label.padEnd(38)} ${String(value).padStart(8)} ${unit}`);
}

function divider() { console.log('  │'); }

function verdict(label, passed) {
  console.log(`  └─ ${passed ? '✅' : '❌'}  ${label}\n`);
}

// ── Szenario 1: Grundfall ──────────────────────────────────────────────────────

box('TEST 1 – Grundfall: Nahe Tankstelle');
scenario('40 L tanken, 0 km Umweg, gleicher Preis → kein Vorteil');
{
  const params = { pricePerLiter: 1.80, fillAmount: 40, detourKm: 0, consumption: 7.5, referencePrice: 1.80 };
  const bd = buildBreakdown(params);
  show('Preis/L',           params.pricePerLiter, '€/L');
  show('Zu tankende Menge', params.fillAmount,     'L');
  show('Umweg',             params.detourKm,       'km');
  divider();
  show('Tankkosten',        bd.fuelCost,           '€');
  show('Umwegkosten',       bd.detourCost,         '€');
  show('= Gesamtkosten',    bd.totalCost,          '€');
  verdict(`Gesamtkosten = ${bd.totalCost} € (erwartet: 72.00 €)`, Math.abs(bd.totalCost - 72.00) < 0.01);
}

// ── Szenario 2: Lohnender Umweg ────────────────────────────────────────────────

box('TEST 2 – Grenzregion: Umweg nach Polen lohnt sich');
scenario('Słubice: 1.41 €/L, 5 km Umweg | Frankfurt: 1.79 €/L, 0 km');
{
  const ref = { pricePerLiter: 1.79, fillAmount: 40, detourKm: 0, consumption: 7.5, referencePrice: 1.79 };
  const pol = { pricePerLiter: 1.41, fillAmount: 40, detourKm: 5, consumption: 7.5, referencePrice: 1.79 };

  const bdRef = buildBreakdown(ref);
  const bdPol = buildBreakdown(pol);
  const savings = calculateSavings(bdPol.totalCost, bdRef.totalCost);

  console.log('\n  ── Referenz (Frankfurt, 0 km) ──────────────');
  show('Tankkosten (40L × 1.79)',  bdRef.fuelCost,      '€');
  show('Umwegkosten',              bdRef.detourCost,     '€');
  show('Gesamtkosten',             bdRef.totalCost,      '€');

  console.log('\n  ── Polen-Option (Słubice, 5 km Umweg) ─────');
  show('Tankkosten (40L × 1.41)',  bdPol.fuelCost,      '€');
  show('Rückfahrt: 5×2 × 7.5/100 × 1.79', bdPol.detourCost, '€');
  show('Gesamtkosten',             bdPol.totalCost,     '€');

  divider();
  show('→ Ersparnis',              savings.toFixed(2),  '€');
  verdict(`Ersparnis = ${savings.toFixed(2)} € (Umweg lohnt sich)`, savings > 0);
}

// ── Szenario 3: Nicht lohnender Umweg ─────────────────────────────────────────

box('TEST 3 – Weite Tankstelle lohnt sich NICHT');
scenario('Auswärtige Station: 1.65 €/L, aber 40 km Umweg');
{
  const ref  = { pricePerLiter: 1.79, fillAmount: 40, detourKm:  0, consumption: 7.5, referencePrice: 1.79 };
  const far  = { pricePerLiter: 1.65, fillAmount: 40, detourKm: 40, consumption: 7.5, referencePrice: 1.79 };

  const bdRef = buildBreakdown(ref);
  const bdFar = buildBreakdown(far);
  const savings = calculateSavings(bdFar.totalCost, bdRef.totalCost);

  show('Referenz-Gesamtkosten',    bdRef.totalCost,    '€');
  show('Ferne Station – Tankkosten', bdFar.fuelCost,   '€');
  show('Ferne Station – Umwegkosten (80km)', bdFar.detourCost, '€');
  show('Ferne Station – Gesamt',   bdFar.totalCost,   '€');
  divider();
  show('→ Mehrkosten',             Math.abs(savings).toFixed(2), '€');
  verdict(`Negatives Ergebnis (${savings.toFixed(2)} €) → lohnt sich NICHT`, savings < 0);
}

// ── Szenario 4: Break-even ────────────────────────────────────────────────────

box('TEST 4 – Break-Even: Ab wann lohnt sich der Umweg?');
{
  const fillAmount  = 40;
  const consumption = 7.5;
  const refPrice    = 1.79;
  const cheapPrice  = 1.60;

  // Ersparnis/Liter = refPrice - cheapPrice = 0.19 €/L
  // Umwegkraftstoff = 2 × km × consumption/100 Liter
  // Break-even: fillAmount × (refPrice - cheapPrice) = 2 × km × consumption/100 × refPrice
  const priceDiff = refPrice - cheapPrice;
  const savingsTotal = fillAmount * priceDiff;
  // Löse nach km: km = savingsTotal / (2 × consumption/100 × refPrice)
  const breakEvenKm = savingsTotal / (2 * consumption / 100 * refPrice);

  console.log(`\n  Preisdifferenz:  ${priceDiff.toFixed(2)} €/L`);
  console.log(`  Gesamtersparnis beim Tanken: ${savingsTotal.toFixed(2)} €`);
  console.log(`  → Break-even bei: ${breakEvenKm.toFixed(1)} km Umweg\n`);

  // Validierung: 1 km vor und nach Break-even testen
  const beforeKm = Math.floor(breakEvenKm) - 1;
  const afterKm  = Math.ceil(breakEvenKm)  + 1;

  const sBefore = calculateSavings(
    buildBreakdown({ pricePerLiter: cheapPrice, fillAmount, detourKm: beforeKm, consumption, referencePrice: refPrice }).totalCost,
    buildBreakdown({ pricePerLiter: refPrice,   fillAmount, detourKm: 0,        consumption, referencePrice: refPrice }).totalCost
  );
  const sAfter = calculateSavings(
    buildBreakdown({ pricePerLiter: cheapPrice, fillAmount, detourKm: afterKm, consumption, referencePrice: refPrice }).totalCost,
    buildBreakdown({ pricePerLiter: refPrice,   fillAmount, detourKm: 0,       consumption, referencePrice: refPrice }).totalCost
  );

  show(`${beforeKm} km → noch lohnend:`,  sBefore.toFixed(2), '€');
  show(`${afterKm}  km → nicht mehr:`,    sAfter.toFixed(2),  '€');
  verdict(`Break-even korrekt bei ~${breakEvenKm.toFixed(1)} km`, sBefore > 0 && sAfter < 0);
}

// ── Szenario 5: Tankmengen-Sensitivität ───────────────────────────────────────

box('TEST 5 – Je mehr getankt wird, desto weiter lohnt der Umweg');
{
  const refPrice   = 1.79;
  const cheapPrice = 1.59;
  const detourKm   = 15;
  const consumption = 7.5;

  console.log('\n  Tankstelle: 1.59 €/L, 15 km Umweg\n');
  console.log('  Menge (L)    Tankkosten   Umwegkosten   Gesamt   Lohnt?');
  console.log('  ' + '─'.repeat(55));

  [10, 20, 30, 40, 60, 80].forEach(fillAmount => {
    const bd  = buildBreakdown({ pricePerLiter: cheapPrice, fillAmount, detourKm, consumption, referencePrice: refPrice });
    const ref = buildBreakdown({ pricePerLiter: refPrice,   fillAmount, detourKm: 0, consumption, referencePrice: refPrice });
    const sav = calculateSavings(bd.totalCost, ref.totalCost);
    const lohnt = sav > 0 ? `+${sav.toFixed(2)} €` : `${sav.toFixed(2)} €`;
    console.log(
      `  ${String(fillAmount).padStart(6)} L   ` +
      `${String(bd.fuelCost.toFixed(2)).padStart(8)} €  ` +
      `${String(bd.detourCost.toFixed(2)).padStart(8)} €  ` +
      `${String(bd.totalCost.toFixed(2)).padStart(7)} €  ` +
      `${sav > 0 ? '✅' : '❌'} ${lohnt}`
    );
  });
  console.log(`\n  → Kleine Tankmengen machen weite Umwege unrentabler.`);
}

console.log('\n══════════════════════════════════════════════════════');
console.log('  Alle Algorithmus-Tests abgeschlossen.');
console.log('══════════════════════════════════════════════════════\n');

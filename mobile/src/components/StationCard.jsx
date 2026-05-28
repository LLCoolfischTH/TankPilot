import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const FLAG = { DE:'🇩🇪', AT:'🇦🇹', PL:'🇵🇱', CZ:'🇨🇿' };
const SOURCE = { tankerkoening: 'Tankerkönig', econtrol: 'E-Control', here: 'HERE' };

export default function StationCard({ station, rank }) {
  const [open, setOpen] = useState(false);
  const isBest = rank === 1;
  const { breakdown, distanceMethod } = station;
  const flag = FLAG[station.country] || '';
  const src  = SOURCE[station.dataSource] || station.dataSource;

  return (
    <View style={[s.card, isBest && s.cardBest]}>

      {/* Kopfzeile */}
      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <View style={s.badges}>
            <Text style={s.name}>{rank}. {flag} {station.name}</Text>
            {isBest && <View style={s.badgeBest}><Text style={s.badgeBestText}>Beste Wahl</Text></View>}
            {!station.isOpen && <View style={s.badgeClosed}><Text style={s.badgeClosedText}>Geschlossen</Text></View>}
          </View>
          <Text style={s.address} numberOfLines={1}>{station.address}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={s.totalCost}>{breakdown.totalCost.toFixed(2)} €</Text>
          <Text style={s.totalLabel}>Gesamtkosten</Text>
        </View>
      </View>

      {/* Kurzinfo */}
      <View style={[s.row, { marginTop: 8, flexWrap: 'wrap', gap: 10 }]}>
        <Text style={s.info}><Text style={{ fontWeight: '700' }}>{station.pricePerLiter.toFixed(3)} €</Text>/L</Text>
        <Text style={s.info}>{station.distanceKm} km
          <Text style={distanceMethod === 'navigation' ? s.tagNav : s.tagEst}>
            {' '}{distanceMethod === 'navigation' ? 'Navigation' : 'Schätzung'}
          </Text>
        </Text>
        <Text style={station.worthIt ? s.savingPos : s.savingNeg}>
          {station.worthIt
            ? `${Math.abs(station.savings).toFixed(2)} € günstiger`
            : `${Math.abs(station.savings).toFixed(2)} € teurer`}
        </Text>
      </View>

      {/* Aufklapper */}
      <TouchableOpacity onPress={() => setOpen(v => !v)} style={{ marginTop: 8 }}>
        <Text style={s.toggleLink}>{open ? 'Berechnung verbergen' : 'Berechnung zeigen'}</Text>
      </TouchableOpacity>

      {open && (
        <View style={s.breakdown}>
          <Text style={s.bdTitle}>Wie wird dieser Preis berechnet?</Text>

          <View style={s.bdRow}>
            <Text style={s.bdLabel}>① Tankkosten</Text>
            <Text style={s.bdValue}>{breakdown.fuelCost.toFixed(2)} €</Text>
          </View>
          <Text style={s.bdSub}>{station.pricePerLiter.toFixed(3)} €/L × Tankmenge</Text>

          <View style={s.bdRow}>
            <Text style={s.bdLabel}>② Umwegkosten (Hin + Rück)</Text>
            <Text style={s.bdValue}>{breakdown.detourCost.toFixed(2)} €</Text>
          </View>
          <Text style={s.bdSub}>{station.distanceKm} km × 2 = {(station.distanceKm * 2).toFixed(1)} km → {breakdown.detourFuelLiters.toFixed(2)} L</Text>

          <View style={[s.bdRow, s.bdTotal]}>
            <Text style={[s.bdLabel, { fontWeight: '700' }]}>① + ② Gesamtkosten</Text>
            <Text style={[s.bdValue, { fontWeight: '700' }]}>{breakdown.totalCost.toFixed(2)} €</Text>
          </View>

          <Text style={s.bdSource}>Quelle: {src}</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card:         { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 2, borderColor: '#e5e7eb' },
  cardBest:     { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  row:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  badges:       { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 2 },
  name:         { fontSize: 15, fontWeight: '700', color: '#111' },
  address:      { fontSize: 13, color: '#555' },
  totalCost:    { fontSize: 20, fontWeight: '700', color: '#111' },
  totalLabel:   { fontSize: 11, color: '#888' },
  info:         { fontSize: 13, color: '#333' },
  badgeBest:    { backgroundColor: '#2563eb', borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2 },
  badgeBestText:{ color: '#fff', fontSize: 11, fontWeight: '600' },
  badgeClosed:  { backgroundColor: '#fef2f2', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: '#fca5a5' },
  badgeClosedText: { color: '#dc2626', fontSize: 11 },
  tagNav:       { color: '#16a34a', fontSize: 11 },
  tagEst:       { color: '#92400e', fontSize: 11 },
  savingPos:    { fontSize: 13, fontWeight: '600', color: '#16a34a' },
  savingNeg:    { fontSize: 13, fontWeight: '600', color: '#dc2626' },
  toggleLink:   { color: '#2563eb', fontSize: 12, textDecorationLine: 'underline' },
  breakdown:    { backgroundColor: '#f0f4ff', borderRadius: 8, padding: 12, marginTop: 8, borderWidth: 1, borderColor: '#dbeafe' },
  bdTitle:      { fontSize: 13, fontWeight: '600', marginBottom: 6, color: '#111' },
  bdRow:        { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  bdLabel:      { fontSize: 12, color: '#555' },
  bdValue:      { fontSize: 12, color: '#111' },
  bdSub:        { fontSize: 11, color: '#888', fontFamily: 'Courier', marginBottom: 6 },
  bdTotal:      { borderTopWidth: 1, borderTopColor: '#bfdbfe', paddingTop: 6, marginTop: 4 },
  bdSource:     { fontSize: 11, color: '#6366f1', marginTop: 6 },
});

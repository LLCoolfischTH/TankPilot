import { View, Text, StyleSheet } from 'react-native';
import StationCard from './StationCard';

export default function ResultList({ results }) {
  return (
    <View>
      <Text style={s.heading}>Ergebnisse – sortiert nach Gesamtkosten</Text>
      {results.map((station, i) => (
        <StationCard key={station.stationId || i} station={station} rank={i + 1} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  heading: { fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#111' },
});

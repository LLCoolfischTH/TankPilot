import { View, Text, StyleSheet } from 'react-native';

export default function TankMap({ stations }) {
  if (!stations?.length) return null;
  return (
    <View style={s.placeholder}>
      <Text style={s.text}>
        🗺️ Karte: {stations.length} Tankstellen gefunden
      </Text>
      <Text style={s.sub}>
        Beste: {stations[0]?.name} · {stations[0]?.distanceKm} km
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  placeholder: { backgroundColor: '#eff6ff', borderRadius: 12, padding: 20, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: '#bfdbfe' },
  text: { fontSize: 15, fontWeight: '600', color: '#1e40af' },
  sub:  { fontSize: 13, color: '#3b82f6', marginTop: 4 },
});
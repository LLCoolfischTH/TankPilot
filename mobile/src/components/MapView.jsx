import { View, StyleSheet } from 'react-native';
import MapView, { Marker, Circle, Callout } from 'react-native-maps';
import { Text } from 'react-native';

const FLAG = { DE:'🇩🇪', AT:'🇦🇹', PL:'🇵🇱', CZ:'🇨🇿' };

export default function TankMap({ stations, userLocation }) {
  const center = userLocation ?? { lat: 52.52, lng: 13.4 };

  return (
    <View style={s.container}>
      <MapView
        style={s.map}
        initialRegion={{
          latitude:        center.lat,
          longitude:       center.lng,
          latitudeDelta:   0.1,
          longitudeDelta:  0.1,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        {/* Nutzer-Radius */}
        {userLocation && (
          <Circle
            center={{ latitude: userLocation.lat, longitude: userLocation.lng }}
            radius={500}
            strokeColor="#2563eb"
            fillColor="rgba(37,99,235,0.1)"
          />
        )}

        {/* Tankstellen-Marker */}
        {stations.map((station, i) => (
          <Marker
            key={station.stationId || i}
            coordinate={{ latitude: station.lat, longitude: station.lng }}
            pinColor={i === 0 ? '#2563eb' : '#888'}
          >
            <Callout>
              <View style={s.callout}>
                <Text style={s.calloutName}>
                  {FLAG[station.country] || ''} {station.name}
                </Text>
                <Text style={s.calloutPrice}>
                  {station.pricePerLiter?.toFixed(3)} €/L
                </Text>
                <Text style={s.calloutTotal}>
                  Gesamt: {station.breakdown?.totalCost?.toFixed(2)} €
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { height: 280, borderRadius: 12, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  map:       { flex: 1 },
  callout:   { padding: 8, minWidth: 160 },
  calloutName:  { fontWeight: '700', fontSize: 13, marginBottom: 2 },
  calloutPrice: { fontSize: 13, color: '#333' },
  calloutTotal: { fontSize: 12, color: '#555', marginTop: 2 },
});

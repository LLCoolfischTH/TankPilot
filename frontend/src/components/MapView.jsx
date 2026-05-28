import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Leaflet Icon-Fix für Vite/Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const bestIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export default function MapView({ stations, userLocation }) {
  const center = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [52.52, 13.4]; // Berlin als Fallback

  return (
    <div style={{ height: 350, borderRadius: 10, overflow: 'hidden', marginBottom: 20, border: '1px solid #e5e7eb' }}>
      <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
        />

        {userLocation && (
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={500}
            color="#2563eb"
            fillOpacity={0.15}
          />
        )}

        {stations.map((station, index) => (
          <Marker
            key={station.stationId || index}
            position={[station.lat, station.lng]}
            icon={index === 0 ? bestIcon : new L.Icon.Default()}
          >
            <Popup>
              <strong>{station.name || station.brand}</strong><br />
              {station.pricePerLiter?.toFixed(3)} €/L<br />
              Gesamtkosten: <strong>{station.totalCost?.toFixed(2)} €</strong><br />
              {station.distanceKm} km entfernt
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

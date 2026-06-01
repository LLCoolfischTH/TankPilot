import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Leaflet Icon-Fix für Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Blauer Marker für beste Tankstelle
const bestIcon = new L.Icon({
  iconUrl:    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl:  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize:   [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

// Roter Marker für Nutzerstandort
const userIcon = new L.Icon({
  iconUrl:    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl:  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize:   [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const FLAG = { DE:'🇩🇪', AT:'🇦🇹', PL:'🇵🇱', CZ:'🇨🇿' };

function MapCenterer({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo([center.lat, center.lng], map.getZoom(), { duration: 1 });
  }, [center?.lat, center?.lng]);
  return null;
}

export default function MapView({ stations, userLocation }) {
  const center = userLocation ?? { lat: 52.52, lng: 13.4 };

  return (
    <div style={{ height: 350, borderRadius: 10, overflow: 'hidden', marginBottom: 20, border: '1px solid #e5e7eb' }}>
      <MapContainer center={[center.lat, center.lng]} zoom={12} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
        />

        <MapCenterer center={userLocation} />

        {/* Nutzerstandort – roter Marker */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>📍 Dein Standort</Popup>
          </Marker>
        )}

        {/* Tankstellen */}
        {stations.map((station, i) => (
          <Marker
            key={station.stationId || i}
            position={[station.lat, station.lng]}
            icon={i === 0 ? bestIcon : new L.Icon.Default()}
          >
            <Popup>
              <strong>{FLAG[station.country] || ''} {station.name}</strong><br />
              {station.pricePerLiter?.toFixed(3)} €/L<br />
              Gesamtkosten: <strong>{station.breakdown?.totalCost?.toFixed(2)} €</strong><br />
              {station.distanceKm} km entfernt
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

import axios from 'axios';

// Backend (Render) – für Tankstellen-Berechnung
const api = axios.create({
  baseURL: 'https://tankpilot-backend.onrender.com/api',
  timeout: 30000,
});

export async function calculateStations({ userLat, userLng, fillAmount, consumption, fuelType, radius }) {
  const response = await api.post('/calculate', { userLat, userLng, fillAmount, consumption, fuelType, radius });
  return response.data;
}

/**
 * Geocoding direkt im Browser – kein Backend-Umweg.
 * Photon (Komoot) erlaubt Browser-Anfragen direkt (CORS offen).
 * Schneller, keine Render-Abhängigkeit, kein Key nötig.
 */
export async function geocodeAddress(query) {
  const response = await axios.get('https://photon.komoot.io/api/', {
    params: {
      q:     query,
      limit: 5,
      lang:  'de',
      lat:   51.0,
      lon:   10.0,
    },
    timeout: 6000,
  });

  return (response.data.features || []).map((f) => {
    const p = f.properties;
    const parts = [p.name, p.street, p.city, p.state, p.country].filter(Boolean);
    const displayName = [...new Set(parts)].join(', ');
    return {
      displayName,
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0],
    };
  });
}

export default api;

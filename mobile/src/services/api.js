import axios from 'axios';

/**
 * Im Entwicklungsmodus kann 'localhost' vom Handy nicht erreicht werden.
 * Ersetze die IP mit der IP deines Computers im lokalen Netzwerk.
 * Mac: System → WLAN → Details → IP-Adresse
 * Windows: ipconfig → IPv4-Adresse
 *
 * Für Produktion: echte Backend-URL eintragen.
 */
const DEV_BACKEND_URL = 'https://tankpilot-backend.onrender.com'; // ← Deine lokale IP hier!
const PROD_BACKEND_URL = 'https://tankpilot-backend.onrender.com';
const BASE_URL = __DEV__ ? DEV_BACKEND_URL : PROD_BACKEND_URL;

const api = axios.create({ baseURL: BASE_URL, timeout: 12000 });

export async function calculateStations({ userLat, userLng, fillAmount, consumption, fuelType, radius }) {
  const response = await api.post('/api/calculate', {
    userLat, userLng, fillAmount, consumption, fuelType, radius,
  });
  return response.data;
}

export async function geocodeAddress(query) {
  const response = await api.get('/api/geocode', { params: { q: query } });
  return response.data.results;
}

export default api;

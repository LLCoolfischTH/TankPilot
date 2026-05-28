import axios from 'axios';
const api = axios.create({
  baseURL: 'https://tankpilot-backend.onrender.com/api',
  timeout: 10000,
});


export async function calculateStations({ userLat, userLng, fillAmount, consumption, fuelType, radius }) {
  const response = await api.post('/calculate', { userLat, userLng, fillAmount, consumption, fuelType, radius });
  return response.data;
}

export async function geocodeAddress(query) {
  const response = await api.get('/geocode', { params: { q: query } });
  return response.data.results;
}

export default api;

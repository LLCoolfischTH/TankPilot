import axios from 'axios';
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL: '/api', timeout: 10000 });

export async function calculateStations({ userLat, userLng, fillAmount, consumption, fuelType, radius }) {
  const response = await api.post('/calculate', { userLat, userLng, fillAmount, consumption, fuelType, radius });
  return response.data;
}

export async function geocodeAddress(query) {
  const response = await api.get('/geocode', { params: { q: query } });
  return response.data.results;
}

export default api;

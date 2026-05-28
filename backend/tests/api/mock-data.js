/**
 * TankPilot – Mock-Daten für Offline-Entwicklung
 *
 * Wenn Tankerkönig oder ORS nicht erreichbar sind,
 * kann dieser Mock als Fallback in tankerkoenigService.js
 * und routeService.js eingebunden werden.
 *
 * Aktivierung: MOCK_APIS=true in backend/.env setzen
 */

// Realistische Tankstellen rund um Frankfurt (Oder) / Słubice
const MOCK_STATIONS = [
  {
    id:     'mock-001',
    name:   'Orlen Słubice',
    brand:  'Orlen',
    street: 'ul. Jedności Robotniczej 1',
    place:  'Słubice (PL)',
    lat:    52.3496,
    lng:    14.5614,
    dist:   1.2,
    price:  1.41,   // Polen – günstig
    isOpen: true,
  },
  {
    id:     'mock-002',
    name:   'Esso Frankfurt Oder',
    brand:  'Esso',
    street: 'Berliner Str. 50',
    place:  'Frankfurt (Oder)',
    lat:    52.3418,
    lng:    14.5650,
    dist:   0.4,
    price:  1.79,
    isOpen: true,
  },
  {
    id:     'mock-003',
    name:   'Shell Frankfurt Oder',
    brand:  'Shell',
    street: 'Karl-Marx-Str. 193',
    place:  'Frankfurt (Oder)',
    lat:    52.3380,
    lng:    14.5520,
    dist:   0.8,
    price:  1.82,
    isOpen: true,
  },
  {
    id:     'mock-004',
    name:   'JET Frankfurt Oder',
    brand:  'JET',
    street: 'Dresdener Str. 12',
    place:  'Frankfurt (Oder)',
    lat:    52.3450,
    lng:    14.5700,
    dist:   1.5,
    price:  1.76,
    isOpen: false,
  },
  {
    id:     'mock-005',
    name:   'BP Frankfurt Oder',
    brand:  'BP',
    street: 'Spornstraße 8',
    place:  'Frankfurt (Oder)',
    lat:    52.3500,
    lng:    14.5580,
    dist:   2.1,
    price:  1.80,
    isOpen: true,
  },
];

// Realistische Routing-Distanzen von Frankfurt (Oder) aus
const MOCK_DISTANCES = {
  'mock-001': 2.3,   // Orlen Słubice – kurzer Grenzübergang
  'mock-002': 0.6,
  'mock-003': 1.1,
  'mock-004': 2.0,
  'mock-005': 2.8,
};

/**
 * Drop-in Ersatz für tankerkoenigService.getStations()
 */
function getMockStations({ type = 'e5' }) {
  // E10 und Diesel bekommen leicht andere Preise
  const offset = type === 'diesel' ? -0.15 : type === 'e10' ? -0.02 : 0;
  return MOCK_STATIONS.map(s => ({
    ...s,
    price: Math.round((s.price + offset) * 1000) / 1000,
  }));
}

/**
 * Drop-in Ersatz für routeService.getDistance()
 */
function getMockDistance(stationId) {
  return {
    km:     MOCK_DISTANCES[stationId] ?? 3.0,
    method: 'mock',
  };
}

module.exports = { getMockStations, getMockDistance, MOCK_STATIONS };

import { useState } from 'react';
import SearchForm from './components/SearchForm';
import ResultList from './components/ResultList';
import MapView    from './components/MapView';
import { calculateStations } from './services/api';

const FLAG = { DE:'🇩🇪', AT:'🇦🇹', PL:'🇵🇱', CZ:'🇨🇿', NL:'🇳🇱', BE:'🇧🇪', FR:'🇫🇷', CH:'🇨🇭', LU:'🇱🇺', DK:'🇩🇰' };

export default function App() {
  const [results,       setResults]       = useState([]);
  const [userLocation,  setUserLocation]  = useState({ lat: 47.8415, lng: 12.9685 });
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState(null);
  const [serviceErrors, setServiceErrors] = useState([]);
  const [meta,          setMeta]          = useState(null);

  // Wird von SearchForm aufgerufen sobald Standort gewählt wird (vor dem Suchen)
  function handleLocationChange(location) {
    setUserLocation(location);
  }

  async function handleSearch(formData) {
    setLoading(true);
    setError(null);
    setServiceErrors([]);
    setUserLocation({ lat: formData.userLat, lng: formData.userLng });

    try {
      const data = await calculateStations(formData);
      setResults(data.results || []);
      setServiceErrors(data.serviceErrors || []);
      setMeta({ countries: data.countries, borderRegion: data.borderRegion });
      if (data.results?.length === 0) setError(data.message || 'Keine Tankstellen gefunden.');
    } catch (err) {
      setError('Verbindungsfehler zum Backend.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ fontFamily:'system-ui, sans-serif', maxWidth:900, margin:'0 auto', padding:16 }}>
      <h1 style={{ fontSize:24, marginBottom:4 }}> TankPilot</h1>
      <p style={{ color:'#666', marginBottom:20 }}>
        Findet die günstigste Tankstelle nach Gesamtkosten – inkl. Umweg.
      </p>

      <SearchForm
        onSearch={handleSearch}
        loading={loading}
        onLocationChange={handleLocationChange}
      />

      {/* Erkannte Länder */}
      {meta && (
        <div style={{ marginBottom:12, fontSize:13, color:'#555', display:'flex', gap:6, flexWrap:'wrap' }}>
          {meta.borderRegion && (
            <span style={{ background:'#fefce8', border:'1px solid #fde68a', borderRadius:4, padding:'2px 8px' }}>
              🌍 Grenzregion
            </span>
          )}
          {meta.countries?.map(c => (
            <span key={c}>{FLAG[c] || c} {c}</span>
          ))}
        </div>
      )}

      {/* Service-Fehler */}
      {serviceErrors.length > 0 && (
        <div style={{ marginBottom:16, background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, padding:12 }}>
          <div style={{ fontWeight:600, marginBottom:6, fontSize:13 }}>⚠️ Einige Länder nicht geladen:</div>
          {serviceErrors.map((e, i) => (
            <div key={i} style={{ fontSize:12, marginBottom:4 }}>
              <strong>{FLAG[e.country] || ''} {e.country}:</strong> {e.hint}
            </div>
          ))}
        </div>
      )}

      {error && <p style={{ color:'#dc2626', margin:'12px 0', fontSize:13 }}>{error}</p>}

      {/* Karte – immer sichtbar, zentriert auf aktuellen Standort */}
      <MapView stations={results} userLocation={userLocation} />

      {results.length > 0 && <ResultList results={results} />}
    </div>
  );
}
